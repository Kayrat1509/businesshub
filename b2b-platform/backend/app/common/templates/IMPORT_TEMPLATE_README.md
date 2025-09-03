# Company Import Template

## Overview
This template allows bulk import of company data into the B2B platform. The system supports both Excel (.xlsx, .xls) and CSV formats.

## Required Fields
The following fields are mandatory for each row:
- **name**: Company name
- **city**: City where the company is located
- **description**: Brief description of the company

## Optional Fields

### Basic Information
- **categories**: Company categories separated by pipe (|) symbol
- **latitude**: GPS latitude coordinate (decimal format)
- **longitude**: GPS longitude coordinate (decimal format)
- **address**: Full company address
- **staff_count**: Number of employees (integer)

### Contact Information
- **phone**: Phone numbers separated by pipe (|) symbol
- **email**: Email addresses separated by pipe (|) symbol  
- **website**: Company website URL

### Branch Information
- **branch_address**: Branch office address
- **branch_latitude**: Branch GPS latitude
- **branch_longitude**: Branch GPS longitude
- **branch_phone**: Branch phone number

## Format Examples

### Categories
```
IT и программирование|Веб-разработка|Мобильная разработка
```

### Phone Numbers
```
+7-495-123-45-67|+7-495-123-45-68|+7-495-123-45-69
```

### Email Addresses
```
info@company.com|sales@company.com|support@company.com
```

### Coordinates
```
Latitude: 55.7558 (Moscow)
Longitude: 37.6176 (Moscow)
```

## Important Notes

1. **Unique Key**: Companies are identified by the combination of `name` + `city`. If a company with the same name and city already exists, it will be updated.

2. **Status**: 
   - Suppliers can only import companies with PENDING status (requires admin approval)
   - Admins can import companies with APPROVED status

3. **Categories**: If a category doesn't exist, it will be created automatically.

4. **Logo Validation**: Company logos must be exactly 600x600 pixels. Invalid logos will be rejected.

5. **Error Reporting**: The import process returns a detailed report with:
   - Number of rows processed
   - Number of companies created/updated/skipped
   - List of errors with row numbers

## API Endpoint
```
POST /api/import/companies-excel/
```

### Request
- Method: POST
- Content-Type: multipart/form-data
- Body: file (Excel or CSV)

### Response
```json
{
    "total_rows": 100,
    "created": 80,
    "updated": 15,
    "skipped": 5,
    "errors": [
        "Row 12: Missing name or city",
        "Row 25: Invalid coordinates"
    ]
}
```

## Usage Instructions

1. Download the template file: `company_import_template.csv`
2. Fill in your company data following the format
3. Save the file in Excel or CSV format
4. Upload via the admin panel or supplier dashboard
5. Review the import report for any errors
6. Check imported companies in the system

## Troubleshooting

### Common Errors
- **Missing required columns**: Ensure name, city, and description columns exist
- **Invalid coordinates**: Use decimal format (e.g., 55.7558, not 55°45'21")
- **File format**: Only .xlsx, .xls, and .csv files are supported
- **Encoding**: Use UTF-8 encoding for CSV files with Cyrillic characters

### Tips
- Test with a small batch first (5-10 companies)
- Keep backup of your original data
- Validate coordinates using online tools
- Use consistent category naming