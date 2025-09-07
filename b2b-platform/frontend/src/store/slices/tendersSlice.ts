import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../api'; // Единый API слой с автоматическим управлением токенами
import { Tender, TenderFilters, PaginatedResponse } from '../../types';

// Состояние для управления тендерами в Redux store
interface TendersState {
  tenders: Tender[] // Массив загруженных тендеров
  totalCount: number // Общее количество тендеров (для пагинации)
  isLoading: boolean // Флаг загрузки данных
  error: string | null // Сообщение об ошибке
}

const initialState: TendersState = {
  tenders: [],
  totalCount: 0,
  isLoading: false,
  error: null,
};

// Асинхронный thunk для загрузки публичных тендеров с пагинацией и фильтрами
export const fetchTenders = createAsyncThunk<
  PaginatedResponse<Tender>,
  { page?: number; filters?: TenderFilters }
>(
  'tenders/fetchTenders',
  async ({ page = 1, filters = {} }, { rejectWithValue }) => {
    try {
      const params = { page, ...filters };
      // Используем единый API слой - автоматически обрабатывает токены и 401 ошибки
      const response = await apiService.get<PaginatedResponse<Tender>>('/tenders/', params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Ошибка загрузки тендеров');
    }
  },
);

// Асинхронный thunk для загрузки тендеров текущего пользователя (требует авторизации)
export const fetchMyTenders = createAsyncThunk<
  PaginatedResponse<Tender>,
  { page?: number; filters?: TenderFilters }
>(
  'tenders/fetchMyTenders',
  async ({ page = 1, filters = {} }, { rejectWithValue }) => {
    try {
      const params = { page, ...filters };
      // Приватный endpoint - автоматически добавится Bearer токен через interceptor
      const response = await apiService.get<PaginatedResponse<Tender>>('/tenders/my/', params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Ошибка загрузки моих тендеров');
    }
  },
);

const tendersSlice = createSlice({
  name: 'tenders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTenders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tenders = action.payload.results;
        state.totalCount = action.payload.count;
      })
      .addCase(fetchTenders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch my tenders
      .addCase(fetchMyTenders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyTenders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tenders = action.payload.results;
        state.totalCount = action.payload.count;
      })
      .addCase(fetchMyTenders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = tendersSlice.actions;
export default tendersSlice.reducer;