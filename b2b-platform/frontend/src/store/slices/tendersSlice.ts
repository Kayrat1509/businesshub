import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiService from '../../api'
import { Tender, TenderFilters, PaginatedResponse } from '../../types'

interface TendersState {
  tenders: Tender[]
  totalCount: number
  isLoading: boolean
  error: string | null
}

const initialState: TendersState = {
  tenders: [],
  totalCount: 0,
  isLoading: false,
  error: null,
}

export const fetchTenders = createAsyncThunk<
  PaginatedResponse<Tender>,
  { page?: number; filters?: TenderFilters }
>(
  'tenders/fetchTenders',
  async ({ page = 1, filters = {} }, { rejectWithValue }) => {
    try {
      const params = { page, ...filters }
      const response = await apiService.get<PaginatedResponse<Tender>>('/tenders/', params)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch tenders')
    }
  }
)

const tendersSlice = createSlice({
  name: 'tenders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenders.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTenders.fulfilled, (state, action) => {
        state.isLoading = false
        state.tenders = action.payload.results
        state.totalCount = action.payload.count
      })
      .addCase(fetchTenders.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError } = tendersSlice.actions
export default tendersSlice.reducer