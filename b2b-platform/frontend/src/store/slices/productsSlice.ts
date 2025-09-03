import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../api';
import { Product, ProductFilters, PaginatedResponse } from '../../types';

interface ProductsState {
  products: Product[]
  currentProduct: Product | null
  totalCount: number
  isLoading: boolean
  error: string | null
  filters: ProductFilters
}

const initialState: ProductsState = {
  products: [],
  currentProduct: null,
  totalCount: 0,
  isLoading: false,
  error: null,
  filters: {},
};

export const fetchProducts = createAsyncThunk<
  PaginatedResponse<Product>,
  { page?: number; filters?: ProductFilters }
>(
  'products/fetchProducts',
  async ({ page = 1, filters = {} }, { rejectWithValue }) => {
    try {
      const params = { page, ...filters };
      const response = await apiService.get<PaginatedResponse<Product>>('/products/', params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch products');
    }
  },
);

export const fetchProductsByCategory = createAsyncThunk<
  Product[],
  string
>(
  'products/fetchProductsByCategory',
  async (categoryName, { rejectWithValue }) => {
    try {
      const response = await apiService.get<Product[]>(`/products/category/${encodeURIComponent(categoryName)}/`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch products by category');
    }
  },
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.results;
        state.totalCount = action.payload.count;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload;
        state.totalCount = action.payload.length;
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearError } = productsSlice.actions;
export default productsSlice.reducer;