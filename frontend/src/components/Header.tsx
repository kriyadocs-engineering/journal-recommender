import React from 'react';
import { BookOpen } from 'lucide-react';
import kriyadocsLogo from '../assets/kriyadocs-logo.svg';

const Header: React.FC = () => {
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
              <span className="font-medium hidden sm:inline">Journal Scope Matcher</span>
            </div>
          </div>

          {/* Right side - User avatar */}
          <div className="flex items-center">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-medium text-xs sm:text-sm">
              Mt
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
