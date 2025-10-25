// ============================================================================
// DASHBOARD LAYOUT
// Main layout wrapper with sidebar and top navigation
// ============================================================================

import React, { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: 'teacher' | 'student' | 'admin';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userRole }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Sidebar
        userRole={userRole}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <TopNav />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
