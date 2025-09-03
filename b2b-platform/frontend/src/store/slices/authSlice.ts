import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../api';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../../types';

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk<AuthResponse, LoginRequest>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiService.post<AuthResponse>('/auth/token/', credentials);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Login failed');
    }
  },
);

export const register = createAsyncThunk<AuthResponse, RegisterRequest>(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await apiService.post<AuthResponse>('/auth/register/', userData);
      return response;
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData && typeof errorData === 'object') {
        // Handle validation errors
        const errorMessages = [];
        for (const [field, messages] of Object.entries(errorData)) {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(', ')}`);
          } else if (typeof messages === 'string') {
            errorMessages.push(`${field}: ${messages}`);
          }
        }
        return rejectWithValue(errorMessages.join('; '));
      }
      return rejectWithValue(errorData?.detail || errorData?.message || 'Registration failed');
    }
  },
);

export const refreshToken = createAsyncThunk<{ access: string }, string>(
  'auth/refresh',
  async (refresh, { rejectWithValue }) => {
    try {
      const response = await apiService.post<{ access: string }>('/auth/token/refresh/', { refresh });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Token refresh failed');
    }
  },
);

export const fetchUserProfile = createAsyncThunk<User, void>(
  'auth/profile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get<User>('/auth/profile/');
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch profile');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
    clearError: (state) => {
      state.error = null;
    },
    initializeAuth: (state) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        state.accessToken = token;
        state.refreshToken = localStorage.getItem('refreshToken');
        state.isAuthenticated = true;
      }
    },
    setTestUser: (state) => {
      // Test user for development - allows accessing dashboard without login
      state.user = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'ROLE_SUPPLIER',
        company_id: 1,
        is_active: true,
      };
      state.accessToken = 'test-token';
      state.isAuthenticated = true;
      localStorage.setItem('accessToken', 'test-token');
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        localStorage.setItem('accessToken', action.payload.access);
        localStorage.setItem('refreshToken', action.payload.refresh);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        localStorage.setItem('accessToken', action.payload.access);
        localStorage.setItem('refreshToken', action.payload.refresh);
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.access;
        localStorage.setItem('accessToken', action.payload.access);
      })
      
      // User profile
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout, clearError, initializeAuth, setTestUser } = authSlice.actions;
export default authSlice.reducer;