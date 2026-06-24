import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { httpService } from '../../services/httpService';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
  email: string;
  name: string;
}

export interface RegistrationResponse {
  clientId: string;
  applicationName: string;
  basePackage: string;
}

export interface AuthState {
  token: string | null;
  cookie: string | null;
  user: { name: string; email: string } | null;
}

const initialState: AuthState = {
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  cookie: null,
  user: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await httpService.post<AuthResponse>('/api/admin/auth/custom-login', {
      data: credentials,
    });
    return response.data;
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (idToken: string) => {
    const response = await httpService.post<AuthResponse>('/api/admin/auth/google-login', {
      data: { idToken },
    });
    return response.data;
  }
);

export const createClient = createAsyncThunk(
  'auth/createClient',
  async (data: { name: string; email: string; password: string }) => {
    const registration = await httpService.post<RegistrationResponse>('/api/admin/auth/register', {
      data,
    });
    await httpService.post('/api/client/register', {
      data: {
        clientId: registration.data.clientId,
        applicationName: registration.data.applicationName,
        basePackage: registration.data.basePackage,
      },
    });
    return registration.data;
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    return null;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload);
      }
    },
    clearToken(state) {
      state.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(login.fulfilled, (state, action) => {
      state.token = action.payload.accessToken;
      state.user = { name: action.payload.name, email: action.payload.email };
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.accessToken);
      }
    });
    builder.addCase(googleLogin.fulfilled, (state, action) => {
      state.token = action.payload.accessToken;
      state.user = { name: action.payload.name, email: action.payload.email };
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.accessToken);
      }
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.token = null;
      state.user = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    });
  },
});

export const { setToken, clearToken } = authSlice.actions;
export default authSlice.reducer;
