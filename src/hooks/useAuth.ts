import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import axios from '@/lib/axios';
import type { User } from '@/types/user';

export function useAuth() {
  const {
    user,
    accessToken: token,
    isAuthenticated,
    isLoading: storeLoading,
    setUser,
    setToken,
    setLoading,
    login: storeLogin,
    logout: storeLogout,
  } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login with email/password
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.success) {
        const { user, access_token } = response.data.data;
        storeLogin(user, access_token);
        return { success: true, user };
      }
      
      throw new Error(response.data.message || 'Đăng nhập thất bại');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [storeLogin]);

  // Register
  const register = useCallback(async (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/auth/register', data);
      
      if (response.data.success) {
        const { user, access_token } = response.data.data;
        storeLogin(user, access_token);
        return { success: true, user };
      }
      
      throw new Error(response.data.message || 'Đăng ký thất bại');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Đăng ký thất bại';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [storeLogin]);

  // Login with OTP
  const loginWithOtp = useCallback(async (phone: string, otp: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/auth/otp/login', { phone, otp });
      
      if (response.data.success) {
        const { user, access_token } = response.data.data;
        storeLogin(user, access_token);
        return { success: true, user };
      }
      
      throw new Error(response.data.message || 'Đăng nhập thất bại');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [storeLogin]);

  // Logout
  const logout = useCallback(async () => {
    try {
      if (token) {
        await axios.post('/api/auth/logout');
      }
    } catch (err) {
      // Ignore logout API errors
    } finally {
      storeLogout();
    }
  }, [token, storeLogout]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const response = await axios.post('/api/auth/refresh');
      
      if (response.data.success) {
        setToken(response.data.data.access_token);
        return true;
      }
      return false;
    } catch (err) {
      storeLogout();
      return false;
    }
  }, [setToken, storeLogout]);

  // Fetch current user
  const fetchUser = useCallback(async () => {
    if (!token) return null;
    
    setLoading(true);
    try {
      const response = await axios.get('/api/user/me');
      
      if (response.data.success) {
        setUser(response.data.data);
        return response.data.data;
      }
      return null;
    } catch (err) {
      storeLogout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, setUser, setLoading, storeLogout]);

  // Update profile
  const updateProfile = useCallback(async (data: Partial<User>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.put('/api/user/profile', data);
      
      if (response.data.success) {
        setUser(response.data.data);
        return { success: true, user: response.data.data };
      }
      
      throw new Error(response.data.message || 'Cập nhật thất bại');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Cập nhật thất bại';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  // Change password
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.put('/api/user/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPassword,
      });
      
      return { success: true };
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Đổi mật khẩu thất bại';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send OTP
  const sendOtp = useCallback(async (phone: string, type: 'login' | 'register' | 'verify' | 'reset' = 'login') => {
    try {
      const response = await axios.post('/api/auth/otp/send', { phone, type });
      return { success: response.data.success, message: response.data.message };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Gửi OTP thất bại';
      return { success: false, error: message };
    }
  }, []);

  // OAuth login
  const oauthLogin = useCallback(async (provider: 'google' | 'facebook', code: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const endpoint = provider === 'google' ? '/api/auth/oauth/google/callback' : '/api/auth/oauth/facebook/callback';
      const response = await axios.post(endpoint, { code });
      
      if (response.data.success) {
        const { user, access_token } = response.data.data;
        storeLogin(user, access_token);
        return { success: true, user, isNewUser: response.data.data.is_new_user };
      }
      
      throw new Error(response.data.message || 'Đăng nhập thất bại');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [storeLogin]);

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading: isLoading || storeLoading,
    error,
    
    // Actions
    login,
    register,
    loginWithOtp,
    logout,
    refreshToken,
    fetchUser,
    updateProfile,
    changePassword,
    sendOtp,
    oauthLogin,
    
    // Clear
    clearError: () => setError(null),
  };
}
