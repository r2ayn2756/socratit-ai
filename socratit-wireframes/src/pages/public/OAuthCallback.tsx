// ============================================================================
// OAUTH CALLBACK PAGE
// Handles OAuth redirects from Google and Microsoft
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUser } = useAuth();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Get token and user data from URL parameters
        const accessToken = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const userDataParam = searchParams.get('user');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError(errorParam);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!accessToken || !refreshToken || !userDataParam) {
          setError('Missing authentication data');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Parse user data
        const userData = JSON.parse(decodeURIComponent(userDataParam));

        // Store tokens and user data
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));

        // Update auth context - this will trigger a re-render with the new user
        updateUser(userData);

        // Navigate based on user role
        if (userData.role === 'TEACHER') {
          navigate('/teacher/dashboard');
        } else if (userData.role === 'STUDENT') {
          navigate('/student/dashboard');
        } else if (userData.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError('Failed to complete authentication');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processOAuthCallback();
  }, [searchParams, navigate, updateUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 text-center">
          {error ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Authentication Failed</h2>
              <p className="text-slate-600 mb-4">{error}</p>
              <p className="text-sm text-slate-500">Redirecting to login...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Completing Sign In</h2>
              <p className="text-slate-600">Please wait while we log you in...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
