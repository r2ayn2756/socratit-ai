// ============================================================================
// AUTH SERVICE
// API functions for authentication and user management
// ============================================================================

import { apiService } from './api.service';

// ============================================================================
// TYPES
// ============================================================================

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'TEACHER' | 'STUDENT';
  schoolCode: string;
  gradeLevel?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'TEACHER' | 'STUDENT' | 'ADMIN';
  schoolId: string;
  gradeLevel?: string;
  profilePhotoUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface VerifyEmailDTO {
  token: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileDTO {
  firstName?: string;
  lastName?: string;
  profilePhotoUrl?: string;
}

// ============================================================================
// AUTH SERVICE
// ============================================================================

export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginDTO): Promise<LoginResponse> => {
    const response = await apiService.post<LoginResponse>('/auth/login', credentials);

    // Store tokens in localStorage
    const { accessToken, refreshToken, user } = response.data.data;
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data;
  },

  /**
   * Register new user
   */
  register: async (data: RegisterDTO) => {
    const response = await apiService.post('/auth/register', data);
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    try {
      await apiService.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiService.post('/auth/refresh', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);

    return response.data;
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (data: VerifyEmailDTO) => {
    const response = await apiService.post('/auth/verify-email', data);
    return response.data;
  },

  /**
   * Request password reset
   */
  forgotPassword: async (data: ForgotPasswordDTO) => {
    const response = await apiService.post('/auth/forgot-password', data);
    return response.data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: ResetPasswordDTO) => {
    const response = await apiService.post('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await apiService.get<{ success: boolean; data: User }>('/users/me');
    return response.data.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileDTO) => {
    const response = await apiService.patch('/users/me', data);

    // Update user in localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...user, ...response.data.data }));

    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (data: ChangePasswordDTO) => {
    const response = await apiService.post('/users/change-password', data);
    return response.data;
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  },

  /**
   * Get stored auth token
   */
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  /**
   * Initiate Google OAuth flow
   */
  loginWithGoogle: () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
    window.location.href = `${apiUrl}/auth/google`;
  },

  /**
   * Initiate Microsoft OAuth flow
   */
  loginWithMicrosoft: () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
    window.location.href = `${apiUrl}/auth/microsoft`;
  },

  /**
   * Handle OAuth callback (called from OAuthCallback component)
   */
  handleOAuthCallback: async (accessToken: string, refreshToken: string, user: User) => {
    // Store tokens and user data
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  },
};

export default authService;
