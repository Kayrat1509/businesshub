# B2B Platform - Supplier Search Portal

A full-stack B2B platform for finding suppliers of goods and services, built with Django REST Framework and React.

## 🚀 Quick Start

1. Clone the repository
2. Copy environment files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
3. Start the application:
   ```bash
   docker-compose up --build
   ```

## 🌐 Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **API Documentation**: http://localhost:8000/api/schema/swagger/
- **Django Admin**: http://localhost:8000/admin
- **PgAdmin**: http://localhost:5050

## 👥 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin123! |
| Supplier | supplier@example.com | Supplier123! |
| Seeker | seeker@example.com | Seeker123! |

## 🏗️ Architecture

### Backend (Django + DRF)
- **Python 3.11**, Django 5, Django REST Framework
- JWT Authentication with refresh tokens
- PostgreSQL database
- Excel/CSV import functionality
- Image validation (600x600px logos)

### Frontend (React + Vite)
- **React 18** with TypeScript
- Vite build tool
- TailwindCSS for styling
- Framer Motion for animations
- React Router v6 for routing

## 🗂️ Project Structure

```
b2b-platform/
├── backend/
│   ├── app/
│   │   ├── ads/          # Advertisement system
│   │   ├── categories/   # Category hierarchy
│   │   ├── common/       # Shared utilities
│   │   ├── companies/    # Company models and views
│   │   ├── logs/         # Activity logging
│   │   ├── products/     # Product/service management
│   │   ├── reviews/      # Reviews and ratings
│   │   ├── tenders/      # Tender management
│   │   └── users/        # Authentication and users
│   ├── media/           # User uploaded files
│   ├── staticfiles/     # Static assets
│   ├── tests/           # Test files
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/          # API integration
│   │   ├── components/   # Reusable UI components
│   │   ├── mocks/        # Mock data for testing
│   │   ├── pages/        # Route components
│   │   ├── services/     # Business logic services
│   │   ├── store/        # State management
│   │   ├── styles/       # CSS styles
│   │   ├── test/         # Test utilities
│   │   └── types/        # TypeScript type definitions
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml    # Docker services configuration
└── nginx.conf.example    # Nginx configuration template
```

## 🎭 User Roles

### Seeker (ROLE_SEEKER)
- Search and filter companies
- View company profiles and products
- Leave reviews (after registration)
- Manage favorites
- Create tenders (subject to moderation)

### Supplier (ROLE_SUPPLIER)
- Manage company profile
- Upload company logo (600x600px)
- Manage products and services
- Import data from Excel/1C
- Create promotional campaigns
- View analytics

### Admin/Moderator (ROLE_ADMIN)
- Moderate companies, products, reviews, tenders
- Manage categories
- Bulk import from Excel
- Manage advertisements
- View activity logs

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/token/` - Login (JWT)
- `POST /api/auth/token/refresh/` - Refresh token

### Companies
- `GET /api/companies/` - List companies (with filters)
- `GET /api/companies/{id}/` - Company details
- `POST /api/companies/` - Create company (suppliers only)
- `PUT /api/companies/{id}/` - Update company (owner only)

### Products
- `GET /api/products/` - List products
- `POST /api/products/` - Create product
- `PUT /api/products/{id}/` - Update product

### Reviews
- `GET /api/reviews/` - List reviews
- `POST /api/reviews/` - Create review (authenticated users)

### Favorites
- `GET /api/favorites/` - User's favorites
- `POST /api/favorites/{company_id}/` - Toggle favorite

### Import
- `POST /api/import/companies-excel/` - Import companies from Excel

## 📊 Excel Import Format

The platform supports importing companies from Excel files with the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| name | Company name | "Tech Solutions LLC" |
| description | Company description | "IT services provider" |
| categories | Categories (pipe-separated) | "IT|Software|Web Development" |
| city | City | "Moscow" |
| address | Full address | "123 Main St, Moscow" |
| latitude | Latitude coordinate | 55.7558 |
| longitude | Longitude coordinate | 37.6176 |
| phone | Phone numbers (pipe-separated) | "+7-495-123-45-67|+7-495-765-43-21" |
| email | Email addresses (pipe-separated) | "info@company.com|sales@company.com" |
| website | Website URL | "https://company.com" |

## 🧪 Development

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo  # Load demo data
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

### Code Quality
```bash
# Backend
black .
isort .
flake8 .

# Frontend
npm run lint
npm run format
npm run type-check
```

## 🎨 Design System

The platform uses a high-tech design with:
- Dark theme with blue/teal accents
- Neon glow effects on hover
- Smooth animations with Framer Motion
- Responsive design (mobile, tablet, desktop)
- Card-based layouts with soft shadows

## 📱 Responsive Breakpoints

- **Desktop**: ≥1280px
- **Tablet**: 768-1279px
- **Mobile**: ≤767px

## 🔒 Security Features

- JWT authentication with refresh tokens
- Role-based permissions
- Image validation (size, format)
- SQL injection prevention
- XSS protection
- CORS configuration

## 📦 Deployment

For production deployment:

1. Update environment variables in `.env` files
2. Set `DEBUG=False` in Django settings
3. Configure proper database credentials
4. Set up SSL certificates
5. Use production-grade web server (Gunicorn + Nginx)

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Rebuild and start
docker-compose up --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Reset database
docker-compose down -v
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License