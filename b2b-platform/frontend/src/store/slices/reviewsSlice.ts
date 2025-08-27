import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiService from '../../api'
import { Review, ReviewFilters, PaginatedResponse } from '../../types'

interface ReviewsState {
  reviews: Review[]
  totalCount: number
  isLoading: boolean
  error: string | null
}

const initialState: ReviewsState = {
  reviews: [],
  totalCount: 0,
  isLoading: false,
  error: null,
}

export const fetchReviews = createAsyncThunk<
  PaginatedResponse<Review>,
  { page?: number; filters?: ReviewFilters }
>(
  'reviews/fetchReviews',
  async ({ page = 1, filters = {} }, { rejectWithValue }) => {
    try {
      const params = { page, ...filters }
      const response = await apiService.get<PaginatedResponse<Review>>('/reviews/', params)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch reviews')
    }
  }
)

export const createReview = createAsyncThunk<
  Review,
  { company: number; rating: number; text: string }
>(
  'reviews/createReview',
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await apiService.post<Review>('/reviews/', reviewData)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to create review')
    }
  }
)

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.isLoading = false
        state.reviews = action.payload.results
        state.totalCount = action.payload.count
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.reviews.unshift(action.payload)
      })
  },
})

export const { clearError } = reviewsSlice.actions
export default reviewsSlice.reducer