// ============================================================================
// SIDEBAR NAVIGATION
// Left sidebar with role-specific navigation menu
// ============================================================================

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  MessageSquare,
  Settings,
  FileText,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  Brain,
  FolderOpen
} from 'lucide-react';
import messageService from '../../services/message.service';

interface SidebarProps {
  userRole: 'teacher' | 'student' | 'admin';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole, isCollapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch unread message count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages'],
    queryFn: messageService.getUnreadCount,
    refetchInterval: 60000, // Refetch every 60 seconds (reduced from 30s to prevent rate limits)
    staleTime: 50000, // Consider data stale after 50 seconds
  });

  // Role-specific navigation items
  // NOTE: Analytics and AI Insights have been removed from global navigation
  // These features are now integrated into individual class pages (ClassDashboard)
  // to provide class-specific context and better user experience
  const navItems: Record<string, NavItem[]> = {
    teacher: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher/dashboard' },
      { label: 'Classes', icon: BookOpen, path: '/teacher/classes' },
      { label: 'Assignments', icon: FileText, path: '/teacher/assignments' },
      { label: 'Messages', icon: MessageSquare, path: '/teacher/messages', badge: unreadCount },
      // REMOVED: Analytics and AI Insights - now part of class pages
      // Analytics features: Performance tracking, concept mastery, engagement metrics
      // AI Insights features: Student AI usage monitoring, common questions, struggling concepts
    ],
    student: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
      { label: 'My Classes', icon: BookOpen, path: '/student/classes' },
      { label: 'Assignments', icon: FileText, path: '/student/assignments' },
      { label: 'Grades', icon: BarChart3, path: '/student/grades' },
      { label: 'SocratIt!', icon: Brain, path: '/student/ai-tutor' },
      { label: 'Messages', icon: MessageSquare, path: '/student/messages', badge: unreadCount },
    ],
    admin: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
      { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
      { label: 'Teachers', icon: GraduationCap, path: '/admin/teachers' },
      { label: 'Students', icon: Users, path: '/admin/students' },
      { label: 'Reports', icon: FileText, path: '/admin/reports' },
    ],
  };

  const currentNavItems = navItems[userRole] || [];

  const isActive = (path: string) => location.pathname === path;

  const roleConfig = {
    teacher: { color: 'brand-blue', label: 'Teacher' },
    student: { color: 'brand-purple', label: 'Student' },
    admin: { color: 'brand-orange', label: 'Admin' },
  };

  const config = roleConfig[userRole];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? '5rem' : '16rem' }}
      className="fixed left-0 top-0 h-screen glass border-r border-white/20 shadow-xl z-40"
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 flex items-center justify-center">
          {!isCollapsed ? (
            <img
              src="/logo.svg"
              alt="Socratit Logo"
              className="h-12 w-auto"
            />
          ) : (
            <img
              src="/logo.svg"
              alt="Socratit Logo"
              className="h-8 w-auto"
            />
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <ul className="space-y-2">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200 relative group
                      ${active
                        ? `bg-${config.color} text-white shadow-lg shadow-${config.color}/30`
                        : 'text-slate-700 hover:bg-white/50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />

                    {!isCollapsed && (
                      <span className="font-medium text-sm">{item.label}</span>
                    )}

                    {item.badge !== undefined && item.badge > 0 && !isCollapsed && (
                      <span className={`
                        ml-auto px-2 py-0.5 rounded-full text-xs font-semibold
                        ${active ? 'bg-white/20 text-white' : 'bg-brand-orange text-white'}
                      `}>
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {item.label}
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 bg-brand-orange rounded-full text-xs">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse Toggle */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-slate-700 hover:bg-white/50 transition-all"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.aside>
  );
};
