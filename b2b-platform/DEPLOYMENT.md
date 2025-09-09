# 🚀 Инструкция по деплою на orbiz.asia

## Проблема
Регистрация работает на localhost, но не работает на продакшн домене https://orbiz.asia

## Решение

### 1. 🔧 Backend изменения (уже сделаны)

В `backend/app/settings.py` обновлены:

```python
# Разрешенные хосты
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "orbiz.asia", "api.orbiz.asia"]

# CORS настройки для продакшна
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000", 
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://orbiz.asia",        # ← ДОБАВЛЕНО
    "https://www.orbiz.asia",    # ← ДОБАВЛЕНО
]

# CSRF защита для продакшна
CSRF_TRUSTED_ORIGINS = [
    "https://orbiz.asia",
    "https://www.orbiz.asia", 
    "https://api.orbiz.asia",
]
```

### 2. 📱 Frontend изменения (уже сделаны)

Создан файл `.env.production`:
```env
VITE_API_URL=https://api.orbiz.asia
VITE_USE_MOCK=false
VITE_DEV_TOOLS=false
VITE_LOG_LEVEL=error
```

### 3. 🌐 Nginx конфигурация (nginx.conf.example)

Создана конфигурация с:
- CORS заголовками для API
- SSL/HTTPS настройками
- Проксированием запросов к Django
- Обработкой OPTIONS preflight запросов

### 4. 📋 Пошаговая инструкция деплоя

#### На сервере выполнить:

1. **Обновить backend:**
```bash
cd /path/to/backend
git pull origin main
python manage.py collectstatic --noinput
sudo systemctl restart gunicorn  # или ваш WSGI сервер
```

2. **Собрать и деплоить frontend:**
```bash
cd /path/to/frontend
npm install
npm run build  # Vite автоматически использует .env.production
sudo cp -r dist/* /var/www/orbiz.asia/
```

3. **Установить Nginx конфигурацию:**
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/orbiz.asia
sudo ln -s /etc/nginx/sites-available/orbiz.asia /etc/nginx/sites-enabled/
sudo nginx -t  # Проверить конфигурацию
sudo systemctl reload nginx
```

4. **Проверить SSL сертификаты:**
```bash
sudo certbot --nginx -d orbiz.asia -d www.orbiz.asia -d api.orbiz.asia
```

### 5. 🔍 Диагностика проблем

#### Проверить в браузере (DevTools → Network):

**Правильные заголовки в ответе API:**
```
Access-Control-Allow-Origin: https://orbiz.asia
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

**Типичные ошибки:**
```
❌ Access-Control-Allow-Origin: *  (должно быть конкретный домен)
❌ Missing Access-Control-Allow-Credentials
❌ CORS error в консоли браузера
```

#### Проверить на сервере:
```bash
# Проверить что Django отдает правильные заголовки
curl -H "Origin: https://orbiz.asia" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.orbiz.asia/auth/register/

# Ожидаемый результат: статус 200 с CORS заголовками
```

### 6. 🚨 Частые проблемы и решения

| Проблема | Причина | Решение |
|----------|---------|---------|
| CORS policy error | Домен не в CORS_ALLOWED_ORIGINS | Добавить в Django settings.py |
| 403 Forbidden | CSRF token error | Добавить в CSRF_TRUSTED_ORIGINS |
| 502 Bad Gateway | Django не отвечает | Перезапустить gunicorn/uwsgi |
| SSL certificate error | Неправильный сертификат | Обновить через certbot |
| API_URL undefined | Неправильные env переменные | Проверить .env.production |

### 7. ✅ Проверка работоспособности

После деплоя проверить:

1. **Frontend загружается:** https://orbiz.asia ✅
2. **API доступен:** https://api.orbiz.asia/api/ ✅
3. **CORS заголовки:** В DevTools Network tab ✅
4. **Регистрация работает:** Создать тестовый аккаунт ✅

### 8. 📝 Переменные окружения на сервере

Убедиться что на сервере установлены:

**.env в Django:**
```env
DEBUG=False
ALLOWED_HOSTS=orbiz.asia,api.orbiz.asia,www.orbiz.asia
SECRET_KEY=ваш-секретный-ключ-продакшна
DATABASE_URL=postgresql://user:pass@localhost/db
```

### 9. 🔄 Автоматизация (опционально)

Создать deploy скрипт:
```bash
#!/bin/bash
# deploy.sh
cd backend && git pull && python manage.py collectstatic --noinput
cd ../frontend && npm run build && sudo cp -r dist/* /var/www/orbiz.asia/
sudo systemctl reload nginx
echo "✅ Deploy completed!"
```