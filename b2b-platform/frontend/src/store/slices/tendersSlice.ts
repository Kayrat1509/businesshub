import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tenderService, TendersResponse } from '../../services/tenderService'; // Используем новый сервис для тендеров
import { Tender, TenderFilters } from '../../types';

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

// Асинхронный thunk для загрузки публичных тендеров через новый сервис
export const fetchTenders = createAsyncThunk<
  TendersResponse,
  { page?: number; filters?: TenderFilters }
>(
  'tenders/fetchTenders',
  async ({ page = 1, filters = {} }, { rejectWithValue }) => {
    try {
      // Используем новый tenderService - автоматически обрабатывает токены и 401 ошибки
      return await tenderService.fetchAllTenders({ page, ...filters });
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Ошибка загрузки тендеров');
    }
  },
);

// Асинхронный thunk для загрузки тендеров текущего пользователя через сервис
export const fetchMyTenders = createAsyncThunk<
  TendersResponse,
  { page?: number; filters?: TenderFilters }
>(
  'tenders/fetchMyTenders',
  async ({ page = 1, filters = {} }, { rejectWithValue }) => {
    try {
      // Используем новый tenderService для получения тендеров пользователя
      return await tenderService.fetchMyTenders({ page, ...filters });
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