// ============================================================================
// TOP NAVIGATION
// Top bar with search, notifications, and user profile
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search,
  Settings,
  LogOut,
  User,
  ChevronDown,
  MessageSquare,
  Calendar,
  Brain
} from 'lucide-react';
import { NotificationCenter } from '../common/NotificationCenter';

export const TopNav: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 glass border-b border-white/20 backdrop-blur-xl">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-6">

          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search for students, classes, assignments..."
                className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Calendar */}
            <button className="p-2 hover:bg-white/50 rounded-lg transition-all">
              <Calendar className="w-5 h-5 text-slate-600" />
            </button>

            {/* Messages */}
            <button className="p-2 hover:bg-white/50 rounded-lg transition-all">
              <MessageSquare className="w-5 h-5 text-slate-600" />
            </button>

            {/* Notifications */}
            <NotificationCenter />

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-white/50 rounded-xl transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-slate-500 capitalize">
                    {user?.role}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-200">
                      <div className="font-semibold text-slate-900">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-sm text-slate-500">{user?.email}</div>
                    </div>

                    <div className="py-2">
                      <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-all text-slate-700">
                        <User className="w-4 h-4" />
                        <span className="text-sm">My Profile</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-all text-slate-700">
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Settings</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-200 p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-all text-error rounded-lg"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
