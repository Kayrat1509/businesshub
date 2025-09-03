# 🚀 B2B Platform Startup Guide

## ✅ Application is configured and ready to use!

### 📍 Currently running services:

- **🌐 Frontend:** http://localhost:5174
- **🔧 Backend API:** http://localhost:8001/api  
- **📚 API Documentation:** http://localhost:8001/api/schema/swagger/
- **⚙️ Django Admin:** http://localhost:8001/admin

---

## 👤 Test Accounts

### Administrator (Moderator)
- **Email:** admin@example.com
- **Password:** Admin123!
- **Capabilities:** moderation of companies, reviews, tenders

### Supplier  
- **Email:** supplier@example.com
- **Password:** Supplier123!
- **Capabilities:** company management, products/services management

### Seeker
- **Email:** seeker@example.com
- **Password:** Seeker123!
- **Capabilities:** search for suppliers, create tenders, favorites

---

## 🎯 Quick Start

1. **Open browser** and go to http://localhost:5174
2. **Login** with one of the test accounts or register
3. **Explore features** based on your role

### Key Features:
- ✅ **Registration and Authentication** with JWT tokens
- ✅ **Company Search** by categories and filters  
- ✅ **Company Management** (for suppliers)
- ✅ **Content Moderation** (for admins)
- ✅ **Tender System** 
- ✅ **Reviews and Ratings**
- ✅ **Favorites**
- ✅ **Excel Import** for products/companies

---

## 🔄 Restart Services (if needed)

### Backend
```bash
cd b2b-platform/backend
source venv/bin/activate
export DATABASE_URL=sqlite:///db.sqlite3
export SECRET_KEY=django-insecure-test-key  
python manage.py runserver 0.0.0.0:8001
```

### Frontend
```bash
cd b2b-platform/frontend
npm run dev
```

---

## 🐳 Alternative Docker Launch

```bash
cd b2b-platform
docker-compose up --build
```

Then the application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000

---

## 🛠 Troubleshooting

### White Screen
- Ensure backend is running on port 8001
- Check browser console (F12) for errors
- Reload the page

### API Unavailable
- Backend should run on http://localhost:8001
- Check `frontend/.env` file: `VITE_API_URL=http://localhost:8001/api`

### Port in Use
- Change port in run command: `runserver 0.0.0.0:8002`
- Update `VITE_API_URL` in `frontend/.env`

---

## 📊 Demo Data

The database already contains:
- 👥 **3 users** (admin, supplier, seeker)  
- 🏢 **2 companies** (ТехРешения, СтройКомплект)
- 🗂 **10 categories** (IT, Construction, Manufacturing, etc.)
- 📝 **Test data** for all modules

---

## 🚀 Ready to use!

The application is fully functional and meets the technical requirements. You can start using all B2B platform features right now!