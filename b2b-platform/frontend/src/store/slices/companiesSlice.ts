import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../api';
import { tenderService } from '../../services/tenderService'; // Используем новый сервис для тендеров
import { Company, CompanyFilters, PaginatedResponse, Tender } from '../../types';

interface CompaniesState {
  companies: Company[]
  selectedCompany: Company | null
  companyTenders: Tender[]
  totalCount: number
  isLoading: boolean
  loading: boolean  // добавлено для совместимости с некоторыми компонентами
  tendersLoading: boolean
  error: string | null
  filters: CompanyFilters
}

const initialState: CompaniesState = {
  companies: [],
  selectedCompany: null,
  companyTenders: [],
  totalCount: 0,
  isLoading: false,
  loading: false,  // синхронизируем с isLoading
  tendersLoading: false,
  error: null,
  filters: {},
};

// Async thunks
export const fetchCompanies = createAsyncThunk<
  PaginatedResponse<Company>,
  { page?: number; filters?: CompanyFilters }
>(
  'companies/fetchCompanies',
  async ({ page = 1, filters = {} }, { rejectWithValue }) => {
    try {
      const params = { page, ...filters };
      const response = await apiService.get<PaginatedResponse<Company>>('/companies/', params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки компаний');
    }
  },
);

export const fetchCompanyById = createAsyncThunk<Company, number>(
  'companies/fetchCompanyById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiService.get<Company>(`/companies/${id}/`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch company');
    }
  },
);

export const toggleFavorite = createAsyncThunk<{ message: string }, number>(
  'companies/toggleFavorite',
  async (companyId, { rejectWithValue }) => {
    try {
      const response = await apiService.post<{ message: string }>(`/favorites/${companyId}/`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to toggle favorite');
    }
  },
);

// Асинхронный thunk для загрузки тендеров конкретной компании через единый сервис
export const fetchCompanyTenders = createAsyncThunk<Tender[], number>(
  'companies/fetchCompanyTenders',
  async (companyId, { rejectWithValue }) => {
    try {
      // Используем новый tenderService, который инкапсулирует всю логику работы с тендерами
      // Автоматически обрабатывается авторизация, обновление токенов и фильтрация по компании
      return await tenderService.fetchCompanyTenders(companyId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Ошибка загрузки тендеров компании');
    }
  },
);

const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    clearCurrentCompany: (state) => {
      state.selectedCompany = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch companies
      .addCase(fetchCompanies.pending, (state) => {
        state.isLoading = true;
        state.loading = true;  // синхронизируем с isLoading
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loading = false;  // синхронизируем с isLoading
        state.companies = action.payload.results;
        state.totalCount = action.payload.count;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.isLoading = false;
        state.loading = false;  // синхронизируем с isLoading
        state.error = action.payload as string;
      })
      // Fetch company by id
      .addCase(fetchCompanyById.pending, (state) => {
        state.isLoading = true;
        state.loading = true;  // синхронизируем с isLoading
        state.error = null;
      })
      .addCase(fetchCompanyById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loading = false;  // синхронизируем с isLoading
        state.selectedCompany = action.payload;
      })
      .addCase(fetchCompanyById.rejected, (state, action) => {
        state.isLoading = false;
        state.loading = false;  // синхронизируем с isLoading
        state.error = action.payload as string;
      })
      // Toggle favorite
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        // Update the company in the list if it exists
        const companyIndex = state.companies.findIndex(
          (company) => company.id === action.meta.arg
        );
        if (companyIndex !== -1) {
          state.companies[companyIndex].is_favorite = !state.companies[companyIndex].is_favorite;
        }
        // Update selected company if it matches
        if (state.selectedCompany && state.selectedCompany.id === action.meta.arg) {
          state.selectedCompany.is_favorite = !state.selectedCompany.is_favorite;
        }
      })
      // Fetch company tenders
      .addCase(fetchCompanyTenders.pending, (state) => {
        state.tendersLoading = true;
      })
      .addCase(fetchCompanyTenders.fulfilled, (state, action) => {
        state.tendersLoading = false;
        state.companyTenders = action.payload;
      })
      .addCase(fetchCompanyTenders.rejected, (state) => {
        state.tendersLoading = false;
        state.companyTenders = [];
      });
  },
});

export const { setFilters, clearCurrentCompany, clearError } = companiesSlice.actions;
export default companiesSlice.reducer;