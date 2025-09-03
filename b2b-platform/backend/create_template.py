#!/usr/bin/env python3
"""
Script to create Excel template for company import
"""
import pandas as pd
import os

# Template data with example values
template_data = {
    'name': ['ООО "ТехСолюшн"', 'ИП Иванов И.И.'],
    'city': ['Москва', 'Санкт-Петербург'],
    'description': ['Разработка веб-приложений и IT-консалтинг', 'Поставка строительных материалов'],
    'categories': ['IT и программирование|Веб-разработка', 'Строительство|Отделочные работы'],
    'latitude': [55.7558, 59.9311],
    'longitude': [37.6176, 30.3609],
    'address': ['ул. Ленина, д. 10, оф. 205', 'Невский проспект, д. 50'],
    'phone': ['+7-495-123-45-67|+7-495-123-45-68', '+7-812-987-65-43'],
    'email': ['info@techsolution.ru|sales@techsolution.ru', 'ivanov@example.com'],
    'website': ['https://techsolution.ru', 'https://ivanov-stroy.ru'],
    'staff_count': [25, 5],
    'branch_address': ['ул. Пушкина, д. 20', ''],
    'branch_latitude': [55.7600, ''],
    'branch_longitude': [37.6200, ''],
    'branch_phone': ['+7-495-111-22-33', '']
}

# Create DataFrame
df = pd.DataFrame(template_data)

# Save to Excel
output_path = 'app/common/templates/company_import_template.xlsx'
df.to_excel(output_path, index=False)

print(f"Excel template created at: {output_path}")
print("\nColumn descriptions:")
print("name* - Company name (required)")
print("city* - City where company is located (required)")  
print("description* - Company description (required)")
print("categories - Pipe-separated categories (|)")
print("latitude - GPS latitude coordinate")
print("longitude - GPS longitude coordinate")
print("address - Full company address")
print("phone - Pipe-separated phone numbers (|)")
print("email - Pipe-separated email addresses (|)")
print("website - Company website URL")
print("staff_count - Number of employees")
print("branch_address - Branch office address")
print("branch_latitude - Branch GPS latitude")
print("branch_longitude - Branch GPS longitude")
print("branch_phone - Branch phone number")
print("\n* Required fields")