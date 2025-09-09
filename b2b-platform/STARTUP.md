# 🚀 B2B Platform Startup Guide

## ✅ Application is configured and ready to use!

### 📍 Currently running services:

- **🌐 Frontend:** http://localhost:5173
- **🔧 Backend API:** http://localhost:8000/api  
- **📚 API Documentation:** http://localhost:8000/api/schema/swagger/
- **⚙️ Django Admin:** http://localhost:8000/admin

---

---

## 🎯 Quick Start

1. **Open browser** and go to http://localhost:5173
2. **Register** a new account or login
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
python manage.py runserver 0.0.0.0:8000
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
- Ensure backend is running on port 8000
- Check browser console (F12) for errors
- Reload the page

### API Unavailable
- Backend should run on http://localhost:8000
- Check `frontend/.env` file: `VITE_API_URL=http://localhost:8000/api`

### Port in Use
- Change port in run command: `runserver 0.0.0.0:8002`
- Update `VITE_API_URL` in `frontend/.env`

---

## 📊 Demo Data

The database contains:
- 🗂 **Categories** (IT, Construction, Manufacturing, etc.)
- 📝 **Sample data** for testing

---

## 🚀 Ready to use!

The application is fully functional and meets the technical requirements. You can start using all B2B platform features right now!