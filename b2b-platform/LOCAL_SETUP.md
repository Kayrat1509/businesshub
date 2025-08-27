# Локальная установка без Docker

## Требования
- Python 3.11+
- Node.js 18+
- PostgreSQL 13+

## Настройка базы данных

1. Установите PostgreSQL
2. Создайте базу данных:
```sql
CREATE DATABASE b2b_platform;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE b2b_platform TO postgres;
```

## Настройка Backend

1. Перейдите в папку backend:
```bash
cd backend
```

2. Создайте виртуальное окружение:
```bash
python -m venv venv
```

3. Активируйте окружение:
```bash
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

4. Установите зависимости:
```bash
pip install -r requirements.txt
```

5. Скопируйте файл окружения:
```bash
copy .env.example .env
```

6. Обновите .env файл:
```
DEBUG=1
SECRET_KEY=your-very-secret-key-change-in-production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/b2b_platform
ALLOWED_HOSTS=localhost,127.0.0.1
```

7. Выполните миграции:
```bash
python manage.py migrate
```

8. Создайте демо-данные:
```bash
python manage.py seed_demo
```

9. Запустите сервер:
```bash
python manage.py runserver
```

Backend будет доступен по адресу: http://localhost:8000

## Настройка Frontend

1. Откройте новый терминал и перейдите в папку frontend:
```bash
cd frontend
```

2. Установите зависимости:
```bash
npm install
```

3. Скопируйте файл окружения:
```bash
copy .env.example .env
```

4. Убедитесь что в .env правильный URL:
```
VITE_API_URL=http://localhost:8000/api
VITE_USE_MOCK=false
```

5. Запустите сервер разработки:
```bash
npm run dev
```

Frontend будет доступен по адресу: http://localhost:5173

## Демо-аккаунты

- **Администратор**: admin@example.com / Admin123!
- **Поставщик**: supplier@example.com / Supplier123!
- **Покупатель**: seeker@example.com / Seeker123!

## Полезные команды

### Backend
```bash
# Запуск тестов
pytest

# Линтинг
black .
isort .
flake8 .

# Создание суперпользователя
python manage.py createsuperuser
```

### Frontend
```bash
# Запуск тестов
npm run test

# Линтинг
npm run lint

# Сборка для продакшена
npm run build
```