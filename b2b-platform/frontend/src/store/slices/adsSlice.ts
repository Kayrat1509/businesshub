import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../api';

interface Ad {
  id: number;
  title: string;
  image: string;
  url: string;
  // ===== ОБНОВЛЕН ИНТЕРФЕЙС AD =====
  // Добавлены новые позиции для левой и правой боковых панелей
  position: 'HOME_WIDGET' | 'SIDEBAR_LEFT' | 'SIDEBAR_RIGHT' | 'BANNER';
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  is_current: boolean;
  created_at: string;
}

interface AdsState {
  ads: Ad[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AdsState = {
  ads: [],
  isLoading: false,
  error: null,
};

export const fetchAds = createAsyncThunk<
  Ad[],
  { position?: string; is_current?: boolean }
>('ads/fetchAds', async (params, { rejectWithValue }) => {
  try {
    // ===== ИСПРАВЛЕНО: ПРЯМАЯ ПЕРЕДАЧА ПАРАМЕТРОВ БЕЗ ОБЕРТКИ =====
    // Раньше: { params } создавал двойную обертку params[position]=...
    // Теперь: передаем параметры напрямую в apiService.get
    const response = await apiService.get<{ results: Ad[] }>('/ads/', params);
    return response.results;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch ads');
  }
});

const adsSlice = createSlice({
  name: 'ads',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAds.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ads = action.payload;
      })
      .addCase(fetchAds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = adsSlice.actions;
export default adsSlice.reducer;