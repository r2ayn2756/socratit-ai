// ============================================================================
// SIGNUP PAGE
// User registration with role selection and validation
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Button, Input, Card, Badge } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { SignupFormData, UserRole } from '../../types';
import { Mail, Lock, User, GraduationCap, Users, AlertCircle, CheckCircle } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>();

  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    if (!selectedRole) {
      setError(t('signup.validation.roleRequired'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const signupData = { ...data, role: selectedRole };
      await signup(signupData);

      // Get the user from localStorage (set by signup function)
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
        throw new Error('User data not found after signup');
      }
    } catch (err) {
      setError(t('signup.error.accountCreation'));
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    {
      value: 'teacher' as UserRole,
      icon: GraduationCap,
      title: t('signup.roleTeacher'),
      description: t('signup.roleTeacherDesc'),
    },
    {
      value: 'student' as UserRole,
      icon: User,
      title: t('signup.roleStudent'),
      description: t('signup.roleStudentDesc'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-12 px-6">

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl mx-auto relative z-10"
      >

        {/* Logo */}
        <div className="text-center mb-4">
          <Link to="/">
            <img src="/logo.svg" alt="Socratit.ai" className="h-32 w-auto mx-auto mb-1" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign Up</h1>
        </div>

        <Card variant="elevated" padding="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-error/10 border border-error/20 rounded-lg p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error">{error}</p>
              </motion.div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                {t('signup.roleLabel')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => (
                  <motion.button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      selectedRole === role.value
                        ? 'border-brand-blue bg-blue-50 shadow-lg shadow-brand-blue/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <role.icon
                      className={`w-8 h-8 mb-2 ${
                        selectedRole === role.value ? 'text-brand-blue' : 'text-slate-400'
                      }`}
                    />
                    <div className={`font-semibold mb-1 ${
                      selectedRole === role.value ? 'text-brand-blue' : 'text-slate-900'
                    }`}>
                      {role.title}
                    </div>
                    <div className="text-xs text-slate-600 leading-tight">
                      {role.description}
                    </div>
                    {selectedRole === role.value && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-5 h-5 text-brand-blue" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('signup.firstNameLabel')}
                type="text"
                placeholder="John"
                error={errors.firstName?.message}
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters',
                  },
                })}
              />
              <Input
                label={t('signup.lastNameLabel')}
                type="text"
                placeholder="Doe"
                error={errors.lastName?.message}
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters',
                  },
                })}
              />
            </div>

            {/* Email Field */}
            <Input
              label={t('signup.emailLabel')}
              type="email"
              placeholder="you@school.edu"
              leftIcon={<Mail className="w-5 h-5" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />

            {/* Password Fields */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('signup.passwordLabel')}
                type="password"
                placeholder="Min. 8 characters"
                leftIcon={<Lock className="w-5 h-5" />}
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain uppercase, lowercase, and number',
                  },
                })}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                leftIcon={<Lock className="w-5 h-5" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
              />
            </div>

            {/* Conditional Fields Based on Role */}
            {selectedRole === 'student' && (
              <Input
                label={t('signup.gradeLevelLabel')}
                type="text"
                placeholder="e.g., 9th Grade"
                error={errors.gradeLevel?.message}
                {...register('gradeLevel', {
                  required: 'Grade level is required for students',
                })}
              />
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
            >
              Create Account
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or sign up with</span>
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

            {/* Sign In Link */}
            <div className="text-center pt-4 border-t border-slate-200">
              <p className="text-slate-600">
                {t('signup.hasAccount')}{' '}
                <Link to="/login" className="text-brand-blue hover:text-blue-600 font-semibold">
                  {t('nav.login')}
                </Link>
              </p>
            </div>

          </form>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
            ← {t('nav.backToHome')}
          </Link>
        </div>

      </motion.div>
    </div>
  );
};
