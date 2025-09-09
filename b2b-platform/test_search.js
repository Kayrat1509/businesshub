#!/bin/bash

echo "=== Тестирование поиска товаров ==="

echo -e "\n1. Поиск \"Цемент\":"
curl -s "http://localhost:8000/api/products/?search=Цемент" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
console.log(\`Найдено товаров: \${data.results.length}\`);
console.log('Названия:', data.results.map(p => p.title));
"

echo -e "\n2. Все товары:"
curl -s "http://localhost:8000/api/products/" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
console.log(\`Всего товаров: \${data.results.length}\`);
console.log('Названия:', data.results.map(p => p.title));
"

echo -e "\n3. Поиск компаний \"Цемент\":"
curl -s "http://localhost:8000/api/companies/?search=Цемент" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
console.log(\`Найдено компаний: \${data.results.length}\`);
"