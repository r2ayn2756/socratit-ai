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
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/logo.svg" alt="Socratit.ai" className="h-16 w-auto mx-auto mb-4" />
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
