from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import pandas as pd
import os
from decimal import Decimal, InvalidOperation

from app.companies.models import Company, Branch, Employee
from app.categories.models import Category
from app.common.permissions import IsAdmin, IsSupplierOrAdmin


class ExcelImportView(generics.GenericAPIView):
    permission_classes = [IsSupplierOrAdmin]
    parser_classes = [MultiPartParser]
    
    def post(self, request):
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file = request.FILES['file']
        
        # Validate file extension
        if not file.name.endswith(('.xlsx', '.xls', '.csv')):
            return Response(
                {'error': 'Invalid file format. Please upload Excel or CSV file'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Read the file
            if file.name.endswith('.csv'):
                df = pd.read_csv(file)
            else:
                df = pd.read_excel(file)
            
            # Process the data
            result = self.process_companies_data(df, request.user)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to process file: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def process_companies_data(self, df, user):
        """Process companies data from DataFrame"""
        results = {
            'total_rows': len(df),
            'created': 0,
            'updated': 0,
            'skipped': 0,
            'errors': []
        }
        
        required_columns = ['name', 'city', 'description']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            results['errors'].append(f"Missing required columns: {', '.join(missing_columns)}")
            return results
        
        for index, row in df.iterrows():
            try:
                row_number = index + 2  # Excel rows start from 2 (header is 1)
                
                # Validate required fields
                if pd.isna(row['name']) or pd.isna(row['city']):
                    results['errors'].append(f"Row {row_number}: Missing name or city")
                    results['skipped'] += 1
                    continue
                
                # Check if company exists (by name and city)
                company_name = str(row['name']).strip()
                city = str(row['city']).strip()
                
                company, created = Company.objects.get_or_create(
                    name=company_name,
                    city=city,
                    defaults={
                        'owner': user,
                        'description': str(row.get('description', '')).strip(),
                        'status': 'PENDING' if user.role == 'ROLE_SUPPLIER' else 'APPROVED'
                    }
                )
                
                # Update company data
                company.description = str(row.get('description', company.description)).strip()
                
                # Handle categories (pipe-separated)
                if not pd.isna(row.get('categories')):
                    category_names = str(row['categories']).split('|')
                    categories = []
                    for cat_name in category_names:
                        cat_name = cat_name.strip()
                        if cat_name:
                            category, _ = Category.objects.get_or_create(
                                name=cat_name,
                                defaults={'is_active': True}
                            )
                            categories.append(category)
                    company.categories.set(categories)
                
                # Handle coordinates
                if not pd.isna(row.get('latitude')) and not pd.isna(row.get('longitude')):
                    try:
                        company.latitude = float(row['latitude'])
                        company.longitude = float(row['longitude'])
                    except (ValueError, TypeError):
                        results['errors'].append(f"Row {row_number}: Invalid coordinates")
                
                # Handle address
                if not pd.isna(row.get('address')):
                    company.address = str(row['address']).strip()
                
                # Handle contacts
                contacts = {}
                if not pd.isna(row.get('phone')):
                    phones = [p.strip() for p in str(row['phone']).split('|') if p.strip()]
                    contacts['phones'] = phones
                
                if not pd.isna(row.get('email')):
                    emails = [e.strip() for e in str(row['email']).split('|') if e.strip()]
                    contacts['emails'] = emails
                
                if not pd.isna(row.get('website')):
                    contacts['website'] = str(row['website']).strip()
                
                company.contacts = contacts
                
                # Handle staff count
                if not pd.isna(row.get('staff_count')):
                    try:
                        company.staff_count = int(row['staff_count'])
                    except (ValueError, TypeError):
                        pass
                
                company.save()
                
                # Handle branches if address data is provided
                if (not pd.isna(row.get('branch_address')) and 
                    not pd.isna(row.get('branch_latitude')) and 
                    not pd.isna(row.get('branch_longitude'))):
                    try:
                        Branch.objects.get_or_create(
                            company=company,
                            address=str(row['branch_address']).strip(),
                            defaults={
                                'latitude': float(row['branch_latitude']),
                                'longitude': float(row['branch_longitude']),
                                'phone': str(row.get('branch_phone', '')).strip()
                            }
                        )
                    except (ValueError, TypeError):
                        results['errors'].append(f"Row {row_number}: Invalid branch data")
                
                if created:
                    results['created'] += 1
                else:
                    results['updated'] += 1
                    
            except Exception as e:
                results['errors'].append(f"Row {index + 2}: {str(e)}")
                results['skipped'] += 1
        
        return results