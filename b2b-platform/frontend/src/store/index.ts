import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import companiesSlice from './slices/companiesSlice'
import categoriesSlice from './slices/categoriesSlice'
import productsSlice from './slices/productsSlice'
import reviewsSlice from './slices/reviewsSlice'
import tendersSlice from './slices/tendersSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    companies: companiesSlice,
    categories: categoriesSlice,
    products: productsSlice,
    reviews: reviewsSlice,
    tenders: tendersSlice,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch