// ============================================================================
// LOGIN PAGE
// User authentication with React Hook Form validation
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button, Input } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LoginFormData } from '../../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LoginFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    shouldUnregister: false,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Watch form values to ensure they're preserved
  const emailValue = watch('email');
  const passwordValue = watch('password');

  const onSubmit = async (data: LoginFormData) => {
    // Prevent any default form behavior
    console.log('Form submitted with:', { email: data.email, password: data.password });
    setIsLoading(true);
    setError('');

    try {
      await login(data.email, data.password);

      // Get the user from localStorage (set by login function)
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);

        // Navigate based on actual user role from backend
        if (user.role === 'TEACHER') {
          navigate('/teacher/dashboard');
        } else if (user.role === 'STUDENT') {
          navigate('/student/dashboard');
        } else if (user.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          // Fallback - should not reach here with valid user
          navigate('/');
        }
      } else {
        throw new Error('User data not found after login');
      }
    } catch (err: any) {
      // Ensure error is set without causing re-render issues
      console.log('Login error caught:', err);
      console.log('Form values after error:', { email: emailValue, password: passwordValue });
      const errorMsg = err?.message || 'Invalid email or password. Please try again.';
      setError(errorMsg);
      setIsLoading(false);
      // Important: DO NOT reset form - values should be preserved
      return; // Exit early on error
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-4">
          <Link to="/">
            <img src="/logo.svg" alt="Socratit.ai" className="h-32 w-auto mx-auto mb-1" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Login</h1>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <Input
                label={t('login.emailLabel')}
                type="email"
                placeholder={t('login.emailPlaceholder')}
                error={errors.email?.message}
                value={emailValue || ''}
                {...register('email', {
                  required: t('login.validation.emailRequired'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('login.validation.invalidEmail'),
                  },
                })}
              />
            </div>

            {/* Password Field */}
            <div>
              <Input
                label={t('login.passwordLabel')}
                type="password"
                placeholder={t('login.passwordPlaceholder')}
                showPasswordToggle={true}
                error={errors.password?.message}
                value={passwordValue || ''}
                {...register('password', {
                  required: t('login.validation.passwordRequired'),
                  minLength: {
                    value: 6,
                    message: t('login.validation.passwordLength'),
                  },
                })}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
            >
              {t('login.signIn')}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or continue with</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {/* Google OAuth */}
              <button
                type="button"
                onClick={() => {
                  window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1'}/auth/google`;
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-700">Google</span>
              </button>

              {/* Microsoft OAuth */}
              <button
                type="button"
                onClick={() => {
                  window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1'}/auth/microsoft`;
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 23 23">
                  <path fill="#f25022" d="M1 1h10v10H1z" />
                  <path fill="#00a4ef" d="M12 1h10v10H12z" />
                  <path fill="#7fba00" d="M1 12h10v10H1z" />
                  <path fill="#ffb900" d="M12 12h10v10H12z" />
                </svg>
                <span className="text-sm font-medium text-slate-700">Microsoft</span>
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center pt-4 border-t border-slate-200">
              <p className="text-slate-600 text-sm">
                {t('login.noAccount')}{' '}
                <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  {t('login.signUpFree')}
                </Link>
              </p>
            </div>

          </form>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
};
