import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../api';
import { Category } from '../../types';

interface CategoriesState {
  categories: Category[]
  categoryTree: Category[]
  currentCategory: Category | null
  isLoading: boolean
  error: string | null
}

const initialState: CategoriesState = {
  categories: [],
  categoryTree: [],
  currentCategory: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchCategories = createAsyncThunk<Category[], void>(
  'categories/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get<{ results: Category[] }>('/categories/');
      return response.results || response as any;
    } catch (error: any) {
      // Return mock data if API fails
      return [
        { id: 1, name: 'IT и программирование', slug: 'it', is_active: true, full_path: 'IT и программирование', children: [], created_at: new Date().toISOString() },
        { id: 2, name: 'Строительство', slug: 'construction', is_active: true, full_path: 'Строительство', children: [], created_at: new Date().toISOString() },
      ] as Category[];
    }
  },
);

export const fetchCategoryTree = createAsyncThunk<Category[], void>(
  'categories/fetchCategoryTree',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get<{ results: Category[] }>('/categories/');
      return response.results || response as any;
    } catch (error: any) {
      // Return mock data if API fails
      return [
        { id: 1, name: 'IT и программирование', slug: 'it', is_active: true, full_path: 'IT и программирование', children: [], created_at: new Date().toISOString() },
        { id: 2, name: 'Строительство', slug: 'construction', is_active: true, full_path: 'Строительство', children: [], created_at: new Date().toISOString() },
        { id: 3, name: 'Производство', slug: 'manufacturing', is_active: true, full_path: 'Производство', children: [], created_at: new Date().toISOString() },
        { id: 4, name: 'Услуги', slug: 'services', is_active: true, full_path: 'Услуги', children: [], created_at: new Date().toISOString() },
      ] as Category[];
    }
  },
);

export const fetchCategoryBySlug = createAsyncThunk<Category, string>(
  'categories/fetchCategoryBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await apiService.get<Category>(`/categories/${slug}/`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch category');
    }
  },
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch category tree
      .addCase(fetchCategoryTree.fulfilled, (state, action) => {
        state.categoryTree = action.payload;
      })
      
      // Fetch category by slug
      .addCase(fetchCategoryBySlug.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategoryBySlug.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCategory = action.payload;
      })
      .addCase(fetchCategoryBySlug.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentCategory, clearError } = categoriesSlice.actions;
export default categoriesSlice.reducer;