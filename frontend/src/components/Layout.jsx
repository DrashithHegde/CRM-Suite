import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  UserCircle,
  TrendingUp,
  Moon,
  Sun,
  Bell,
  Shield,
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { unreadCount, setShowPanel } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', href: '/leads', icon: Users },
    { name: 'User Management', href: '/users', icon: Shield },
  ];
  const isActive = (path) => location.pathname === path;

  const currentItem = navigation.find((n) => location.pathname.startsWith(n.href));
  const currentTitle = currentItem ? currentItem.name : 'Dashboard';

  return (
    <div className="min-h-screen transition-colors">
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 modal-backdrop" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full sidebar">
          <SidebarContent
            user={user}
            navigation={navigation}
            isActive={isActive}
            handleLogout={handleLogout}
          />
        </div>
      </div>
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 sidebar">
        <SidebarContent
          user={user}
          navigation={navigation}
          isActive={isActive}
          handleLogout={handleLogout}
        />
      </div>
      <div className="lg:pl-72">
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md btn-ghost">
                  <Menu className="h-6 w-6" />
                </button>
                <div className="ml-2">
                  <p className="text-sm subtle">CRM</p>
                  <h2 className="page-title">{currentTitle}</h2>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg btn-ghost"
                >
                  {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setShowPanel(true)}
                  className="relative p-2 rounded-lg btn-ghost"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>
                <div className="flex items-center gap-3">
                  <UserCircle className="h-8 w-8 text-gray-400" />
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ user, navigation, isActive, handleLogout }) => (
  <div className="flex-1 flex flex-col">
    <div className="flex-1 pt-6 pb-4">
        <div className="flex items-center px-4">
          <div className="h-12 w-12 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-2xl flex items-center justify-center shadow-md">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="brand-title text-2xl font-extrabold">CRM Suite</h1>
            <p className="brand-subtitle text-xs mt-0.5">Lead Management Platform</p>
          </div>
        </div>
      <div className="mt-8 px-3 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group sidebar-item ${isActive(item.href) ? 'sidebar-item-active' : ''}`}
            >
              <Icon className={`mr-3 h-5 w-5 ${isActive(item.href) ? 'text-indigo-700' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
    <div className="p-4 border-t">
      <div className="mb-3 px-3 py-2 card">
        <p className="text-xs text-slate-500">Logged in as</p>
        <p className="text-sm font-medium text-slate-900 truncate">{user?.username}</p>
        <p className="text-xs text-slate-500">{user?.email}</p>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-rose-600 hover:text-white hover:bg-rose-50 rounded-lg"
      >
        <LogOut className="mr-3 h-5 w-5" />
        Logout
      </button>
    </div>
  </div>
);

export default Layout;
