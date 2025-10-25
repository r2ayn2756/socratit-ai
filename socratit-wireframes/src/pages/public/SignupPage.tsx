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
import { SignupFormData, UserRole } from '../../types';
import { Mail, Lock, User, GraduationCap, Users, Shield, AlertCircle, CheckCircle } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
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
      setError('Please select your role');
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
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    {
      value: 'teacher' as UserRole,
      icon: GraduationCap,
      title: 'Teacher',
      description: 'Create classes, assignments, and track student progress',
    },
    {
      value: 'student' as UserRole,
      icon: User,
      title: 'Student',
      description: 'Complete assignments and get AI tutoring help',
    },
    {
      value: 'admin' as UserRole,
      icon: Shield,
      title: 'Admin',
      description: 'Manage school/district and view analytics',
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
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/logo.svg" alt="Socratit.ai" className="h-12 w-auto mx-auto mb-4" />
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your Account</h1>
          <p className="text-slate-600">Get started with your 14-day free trial</p>
        </div>

        <Card variant="glass" padding="lg">
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
                I am a... *
              </label>
              <div className="grid grid-cols-3 gap-3">
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
                label="First Name"
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
                label="Last Name"
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
              label="Email Address"
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
                label="Password"
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

            {/* School Code - Required for ALL roles */}
            <Input
              label="School Code"
              type="text"
              placeholder="e.g., DEMO0001"
              error={errors.schoolCode?.message}
              {...register('schoolCode', {
                required: 'School code is required',
                minLength: {
                  value: 8,
                  message: 'School code must be 8 characters',
                },
                maxLength: {
                  value: 8,
                  message: 'School code must be 8 characters',
                },
              })}
              helperText="Get this code from your school administrator"
            />

            {/* Conditional Fields Based on Role */}
            {selectedRole === 'student' && (
              <Input
                label="Grade Level"
                type="text"
                placeholder="e.g., 9th Grade"
                error={errors.gradeLevel?.message}
                {...register('gradeLevel', {
                  required: 'Grade level is required for students',
                })}
              />
            )}

            {/* Terms Acceptance */}
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 text-brand-blue border-slate-300 rounded focus:ring-brand-blue"
                required
              />
              <span className="text-sm text-slate-600">
                I agree to the{' '}
                <a href="#" className="text-brand-blue hover:text-blue-600 font-medium">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-brand-blue hover:text-blue-600 font-medium">
                  Privacy Policy
                </a>
              </span>
            </label>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              Create Account
            </Button>

            {/* Benefits */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="font-medium text-slate-900">Your free trial includes:</span>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 ml-7">
                <li>• 14 days full access to all features</li>
                <li>• No credit card required</li>
                <li>• Unlimited classes and students</li>
                <li>• Cancel anytime</li>
              </ul>
            </div>

            {/* Sign In Link */}
            <div className="text-center pt-4 border-t border-slate-200">
              <p className="text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-blue hover:text-blue-600 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>

          </form>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
            ← Back to home
          </Link>
        </div>

      </motion.div>
    </div>
  );
};
