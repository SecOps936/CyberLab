import React, { createContext, useContext, useState, useEffect } from 'react';
import axios, { AxiosInstance } from 'axios';

// Define User interface with role
interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  labs_completed: number;
  xps: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  role?: string;  // ADDED: 'user' or 'staff'
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  handleOAuthCallback: (provider: string, code: string, state: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true,
  });

  // Add token to requests
  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle token expiry
  api.interceptors.response.use(
    (response) => response,
                                (error) => {
                                  if (error.response?.status === 401) {
                                    logout();
                                  }
                                  return Promise.reject(error);
                                }
  );

  useEffect(() => {
    if (token) {
      getCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const getCurrentUser = async (): Promise<void> => {
    try {
      const response = await api.get<User>('/auth/me');
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      console.log('Current user:', response.data);
    } catch (error) {
      console.error('Error getting current user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Add login method
  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { access_token, user: userData } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);

      console.log('Login successful:', userData.username, 'Role:', userData.role);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    window.location.href = 'http://localhost:8000/auth/google';
  };

  const loginWithGitHub = async (): Promise<void> => {
    window.location.href = 'http://localhost:8000/auth/github';
  };

  interface OAuthCallbackResponse {
    access_token: string;
    user: User;
  }

  const handleOAuthCallback = async (
    provider: string,
    code: string,
    state: string
  ): Promise<boolean> => {
    try {
      const response = await api.post<OAuthCallbackResponse>(`/auth/callback/${provider}`, {
        code,
        state,
      });
      console.log(`OAuth callback sent for ${provider}:`, code, state);

      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(access_token);
      console.log('OAuth login successful:', userData.username);
      setUser(userData);

      return true;
    } catch (error) {
      console.error('OAuth callback error:', error);
      return false;
    }
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    loginWithGoogle,
    loginWithGitHub,
    handleOAuthCallback,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
