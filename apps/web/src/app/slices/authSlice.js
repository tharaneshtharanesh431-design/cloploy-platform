import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/client';

export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', payload);
    if (data.accessToken) {
      localStorage.setItem('cloploy_token', data.accessToken);
    }
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', payload);
    if (data.accessToken) {
      localStorage.setItem('cloploy_token', data.accessToken);
    }
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const verifyOtp = createAsyncThunk('auth/verifyOtp', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/verify-otp', payload);
    localStorage.setItem('cloploy_token', data.accessToken);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Invalid or expired OTP');
  }
});

export const verifyLoginOtp = createAsyncThunk('auth/verifyLoginOtp', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/verify-login-otp', payload);
    if (data.requiresTwoFactor) {
      localStorage.setItem('cloploy_temp_token', data.tempToken);
      return data;
    }
    localStorage.setItem('cloploy_token', data.accessToken);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Invalid or expired OTP');
  }
});

export const verifyTwoFactor = createAsyncThunk('auth/verifyTwoFactor', async (payload, { rejectWithValue }) => {
  try {
    const tempToken = localStorage.getItem('cloploy_temp_token');
    const headers = tempToken ? { Authorization: `Bearer ${tempToken}` } : {};
    
    const { data } = await api.post('/auth/verify-totp', payload, { headers });
    localStorage.setItem('cloploy_token', data.accessToken);
    localStorage.removeItem('cloploy_temp_token');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Invalid 2FA code');
  }
});

export const googleLogin = createAsyncThunk('auth/googleLogin', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/google-login', payload);
    localStorage.setItem('cloploy_token', data.accessToken);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Google login failed');
  }
});

export const resendOtp = createAsyncThunk('auth/resendOtp', async (email, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/resend-otp', { email });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to resend OTP');
  }
});

export const onboardUser = createAsyncThunk('auth/onboardUser', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/onboard', payload);
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Onboarding failed');
  }
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
  const { data } = await api.get('/auth/me');
  return data.user;
});

const slice = createSlice({
  name: 'auth',
  initialState: { 
    user: null, 
    token: localStorage.getItem('cloploy_token'), 
    status: 'idle', 
    error: null,
    requiresOtp: false,
    otpEmail: '',
    emailSent: true,
    requiresTwoFactor: false,
    tempToken: null,
    resendStatus: 'idle'
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.requiresOtp = false;
      state.otpEmail = '';
      state.emailSent = true;
      state.requiresTwoFactor = false;
      state.tempToken = null;
      localStorage.removeItem('cloploy_token');
      localStorage.removeItem('cloploy_temp_token');
    },
    resetOtpState(state) {
      state.requiresOtp = false;
      state.otpEmail = '';
      state.emailSent = true;
      state.requiresTwoFactor = false;
      state.tempToken = null;
      state.error = null;
      state.resendStatus = 'idle';
    },
    updateUser(state, action) {
      state.user = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload.requiresOtp) {
          state.requiresOtp = true;
          state.otpEmail = action.payload.email;
          state.emailSent = action.payload.emailSent !== false;
        } else {
          state.user = action.payload.user;
          state.token = action.payload.accessToken;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload.requiresOtp) {
          state.requiresOtp = true;
          state.otpEmail = action.payload.email;
          state.emailSent = action.payload.emailSent !== false;
        } else {
          state.user = action.payload.user;
          state.token = action.payload.accessToken;
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Verify Registration OTP
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.requiresOtp = false;
        state.otpEmail = '';
        state.error = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Verify Login OTP
      .addCase(verifyLoginOtp.fulfilled, (state, action) => {
        if (action.payload.requiresTwoFactor) {
          state.requiresTwoFactor = true;
          state.tempToken = action.payload.tempToken;
          state.otpEmail = action.payload.email;
          state.requiresOtp = false;
        } else {
          state.user = action.payload.user;
          state.token = action.payload.accessToken;
          state.requiresOtp = false;
          state.otpEmail = '';
          state.error = null;
        }
      })
      .addCase(verifyLoginOtp.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Verify Two-Factor Authentication
      .addCase(verifyTwoFactor.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(verifyTwoFactor.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.requiresTwoFactor = false;
        state.tempToken = null;
        state.requiresOtp = false;
        state.otpEmail = '';
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(verifyTwoFactor.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Google Login
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.requiresOtp = false;
        state.otpEmail = '';
        state.error = null;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Resend OTP
      .addCase(resendOtp.pending, (state) => {
        state.resendStatus = 'loading';
      })
      .addCase(resendOtp.fulfilled, (state) => {
        state.resendStatus = 'succeeded';
        state.emailSent = true;
      })
      .addCase(resendOtp.rejected, (state) => {
        state.resendStatus = 'failed';
      })
      // Onboarding
      .addCase(onboardUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      // Fetch user profile
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  }
});

export const { logout, resetOtpState, updateUser } = slice.actions;
export default slice.reducer;
