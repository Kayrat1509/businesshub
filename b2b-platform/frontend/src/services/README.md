# Frontend Services Architecture

This directory contains all the service layer implementations for the B2B Platform frontend.

## Overview

The services architecture is built around:
- **Universal API client** (`apiService.ts`) using Axios
- **Specialized service modules** for different domains
- **Centralized error handling** and authentication
- **TypeScript types** for all API interactions

## Services

### Core Services

#### `apiService.ts` - Universal API Client
- Axios-based HTTP client with interceptors
- Automatic auth token handling
- Centralized error handling and logging
- Support for file uploads/downloads
- External API calls (bypassing interceptors)

#### `authService.ts` - Authentication Service
- Login/logout/register functionality
- Token refresh automation
- Password reset flows
- Profile management
- Auth state initialization

#### `currencyService.ts` - Currency Conversion Service  
- Real-time exchange rate fetching
- Scheduled updates (9:00, 14:00, 19:00)
- Local caching with fallback rates
- Multi-source rate fetching (external API + backend)

### Domain Services

#### `companyService.ts` - Company Management
- CRUD operations for companies
- Company search and filtering
- Favorite companies
- Branch and employee management
- File uploads (logos)

#### `productService.ts` - Product Management
- Product CRUD operations
- Search and filtering
- Category-based queries
- Image uploads
- Bulk operations
- Import/export functionality

## Environment Configuration

Set the API base URL in your `.env` file:
```env
VITE_API_URL=http://localhost:8001/api
```

## Usage Examples

### Basic API Calls
```typescript
import { apiService } from '@/services';

// GET request
const data = await apiService.get<MyType>('/endpoint');

// POST request
const result = await apiService.post('/endpoint', payload);
```

### Using Specialized Services
```typescript
import { companyService, productService, currencyService } from '@/services';

// Get companies
const companies = await companyService.getCompanies({ city: 'Almaty' });

// Search products
const products = await productService.searchProducts('laptop');

// Convert currency
const converted = await currencyService.convert(1000, 'USD', 'KZT');
```

### Authentication
```typescript
import { authService } from '@/services';

// Login
const response = await authService.login({ email, password });

// Get current user
const user = await authService.getProfile();

// Auto-refresh token
const token = await authService.ensureValidToken();
```

## Error Handling

All services use centralized error handling:

```typescript
try {
  const data = await apiService.get('/endpoint');
} catch (error) {
  // Error object contains:
  // - status: HTTP status code
  // - message: Human-readable message
  // - errors: Field-specific errors (for validation)
  console.error('API Error:', error.message);
}
```

## Adding New Services

To add a new service:

1. Create `newService.ts` following the existing patterns
2. Import the service types and interfaces
3. Export from `index.ts`
4. Update this README

Example template:
```typescript
import { apiService, PaginatedApiResponse } from './apiService';

class NewService {
  private readonly BASE_URL = '/new-endpoint';

  async getItems(): Promise<PaginatedApiResponse<Item>> {
    return apiService.get(`${this.BASE_URL}`);
  }

  async createItem(data: CreateItemRequest): Promise<Item> {
    return apiService.post(`${this.BASE_URL}/`, data);
  }
}

export const newService = new NewService();
```

## Architecture Benefits

- **Separation of concerns**: Each service handles one domain
- **Type safety**: Full TypeScript support with proper interfaces
- **Reusability**: Services can be used across components
- **Testability**: Easy to mock and test individual services  
- **Maintainability**: Centralized API logic
- **Error handling**: Consistent error patterns
- **Authentication**: Automatic token handling

## Currency Service Details

The `currencyService` implements a sophisticated caching strategy:

- **Scheduled Updates**: Fetches rates at 9:00, 14:00, and 19:00
- **Fallback Chain**: External API → Backend API → localStorage → hardcoded rates
- **Cache Management**: 6-hour cache with localStorage persistence
- **Smart Refresh**: Only fetches when needed or at scheduled times

## Best Practices

1. Always use the specialized services instead of direct API calls
2. Handle errors appropriately in your components
3. Use TypeScript interfaces for all API data
4. Cache expensive operations when possible
5. Use the currency service for all price conversions
6. Check authentication state before protected operations