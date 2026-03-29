import apiClient from './apiClient';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
}

interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
  role?: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data),

  signup: (data: SignupRequest) =>
    apiClient.post<LoginResponse>('/auth/signup', data),

  logout: () =>
    apiClient.post('/auth/logout'),

  me: () =>
    apiClient.get('/auth/me'),
};
