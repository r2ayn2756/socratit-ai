// ============================================================================
// AUTHENTICATION CONTEXT
// Manages user authentication state across the application
// NOW CONNECTED TO REAL BACKEND!
// ============================================================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { apiService } from '../services/api.service';
import { API_ENDPOINTS } from '../config/api.config';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('authToken');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  // Login function - CONNECTED TO REAL BACKEND!
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);

    try {
      // Call real backend API
      const response = await apiService.post(API_ENDPOINTS.LOGIN, { email, password });

      if (response.data.success && response.data.data) {
        const { user: userData, accessToken, refreshToken } = response.data.data;

        // Store user and tokens
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        setUser(userData);
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.message || 'Invalid email or password';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function - CONNECTED TO REAL BACKEND!
  const signup = async (userData: any): Promise<void> => {
    setIsLoading(true);

    try {
      // Prepare data for backend (backend expects different field names)
      const signupData = {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role.toUpperCase(), // Backend expects TEACHER, STUDENT, ADMIN
        schoolCode: userData.school || userData.schoolCode, // Backend uses schoolCode
        gradeLevel: userData.gradeLevel,
      };

      // Call real backend API
      const response = await apiService.post(API_ENDPOINTS.SIGNUP, signupData);

      if (response.data.success && response.data.data) {
        const { user: registeredUser } = response.data.data;

        // Store user (no token yet - need to verify email first)
        localStorage.setItem('user', JSON.stringify(registeredUser));
        setUser(registeredUser);

        // Note: User needs to verify email before they can login
      } else {
        throw new Error('Signup failed');
      }
    } catch (error: any) {
      console.error('Signup failed:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function - CONNECTED TO REAL BACKEND!
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        // Call backend logout to blacklist tokens
        await apiService.post(API_ENDPOINTS.LOGOUT, { refreshToken });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API fails
    } finally {
      // Clear local storage
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
