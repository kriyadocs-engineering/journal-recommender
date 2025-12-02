import React from 'react';
import { BookOpen, LogOut } from 'lucide-react';
import kriyadocsLogo from '../assets/kriyadocs-logo.svg';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { logout } = useAuth();
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src={kriyadocsLogo}
              alt="Kriyadocs"
              className="h-7 w-7 sm:h-8 sm:w-8"
            />
            <span className="ml-1.5 sm:ml-2 text-lg sm:text-xl font-semibold text-violet-600">kriyadocs</span>
            <sup className="text-xs text-violet-400 ml-0.5 hidden sm:inline">®</sup>
          </div>

          {/* Center Title */}
          <div className="flex items-center">
            <div className="flex items-center gap-2 text-gray-700">
              <BookOpen className="h-5 w-5 text-violet-600" />
              <span className="font-medium hidden sm:inline">Journal Recommendation System</span>
            </div>
          </div>

          {/* Right side - Sign out button */}
          <div className="flex items-center">
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
