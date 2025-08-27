import { rest } from 'msw'

export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/token/', (req, res, ctx) => {
    return res(
      ctx.json({
        access: 'mock-access-token',
        refresh: 'mock-refresh-token',
        user: {
          id: 1,
          email: 'user@example.com',
          username: 'testuser',
          role: 'ROLE_SUPPLIER',
          first_name: 'Test',
          last_name: 'User',
          phone: '+7-999-123-45-67',
          created_at: new Date().toISOString(),
        },
      })
    )
  }),

  // Categories
  rest.get('/api/categories/tree/', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 1,
          name: 'IT и программирование',
          slug: 'it-programming',
          children: [],
        },
        {
          id: 2,
          name: 'Строительство',
          slug: 'construction',
          children: [],
        },
      ])
    )
  }),

  // Companies
  rest.get('/api/companies/', (req, res, ctx) => {
    return res(
      ctx.json({
        count: 0,
        next: null,
        previous: null,
        results: [],
      })
    )
  }),

  // Products
  rest.get('/api/products/', (req, res, ctx) => {
    return res(
      ctx.json({
        count: 0,
        next: null,
        previous: null,
        results: [],
      })
    )
  }),

  // Tenders
  rest.get('/api/tenders/', (req, res, ctx) => {
    return res(
      ctx.json({
        count: 0,
        next: null,
        previous: null,
        results: [],
      })
    )
  }),
]