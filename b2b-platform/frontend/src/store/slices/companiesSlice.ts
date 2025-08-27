import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiService from '../../api'
import { Company, CompanyFilters, PaginatedResponse } from '../../types'

interface CompaniesState {
  companies: Company[]
  currentCompany: Company | null
  totalCount: number
  isLoading: boolean
  error: string | null
  filters: CompanyFilters
}

const initialState: CompaniesState = {
  companies: [],
  currentCompany: null,
  totalCount: 0,
  isLoading: false,
  error: null,
  filters: {},
}

// Async thunks
export const fetchCompanies = createAsyncThunk<
  PaginatedResponse<Company>,
  { page?: number; filters?: CompanyFilters }
>(
  'companies/fetchCompanies',
  async ({ page = 1, filters = {} }, { rejectWithValue }) => {
    try {
      const params = { page, ...filters }
      const response = await apiService.get<PaginatedResponse<Company>>('/companies/', params)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch companies')
    }
  }
)

export const fetchCompanyById = createAsyncThunk<Company, number>(
  'companies/fetchCompanyById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiService.get<Company>(`/companies/${id}/`)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch company')
    }
  }
)

export const toggleFavorite = createAsyncThunk<{ message: string }, number>(
  'companies/toggleFavorite',
  async (companyId, { rejectWithValue }) => {
    try {
      const response = await apiService.post<{ message: string }>(`/favorites/${companyId}/`)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to toggle favorite')
    }
  }
)

const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload
    },
    clearCurrentCompany: (state) => {
      state.currentCompany = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch companies
      .addCase(fetchCompanies.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.isLoading = false
        state.companies = action.payload.results
        state.totalCount = action.payload.count
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Fetch company by ID
      .addCase(fetchCompanyById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCompanyById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentCompany = action.payload
      })
      .addCase(fetchCompanyById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Toggle favorite
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        // Update favorite status in current company
        if (state.currentCompany) {
          state.currentCompany.is_favorite = !state.currentCompany.is_favorite
        }
        // Update in companies list
        state.companies.forEach(company => {
          if (company.id === state.currentCompany?.id) {
            company.is_favorite = !company.is_favorite
          }
        })
      })
  },
})

export const { setFilters, clearCurrentCompany, clearError } = companiesSlice.actions
export default companiesSlice.reducer