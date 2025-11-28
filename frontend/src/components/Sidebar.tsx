import React from 'react';
import {
  Search,
  FileText,
  BookOpen,
  HelpCircle,
  X
} from 'lucide-react';

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'scope-matcher', icon: Search, label: 'Scope Matcher' },
  { id: 'manuscripts', icon: FileText, label: 'My Manuscripts' },
  { id: 'journals', icon: BookOpen, label: 'Journals' },
];

const bottomNavItems: NavItem[] = [
  { id: 'help', icon: HelpCircle, label: 'Help' },
];

interface SidebarProps {
  activeItem?: string;
  onItemClick?: (id: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeItem = 'scope-matcher',
  onItemClick,
  isOpen = false,
  onClose
}) => {
  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (onItemClick) {
      onItemClick(id);
    }
    // Close sidebar on mobile after clicking
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  const NavContent = () => (
    <nav className="flex flex-col h-full">
      {/* Main Navigation */}
      <div className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = item.id === activeItem;
            return (
              <li key={item.id}>
                <button
                  onClick={(e) => handleClick(e, item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-violet-600' : 'text-gray-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-auto text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isActive
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 py-4">
        <ul className="space-y-1 px-3">
          {bottomNavItems.map((item) => {
            const isActive = item.id === activeItem;
            return (
              <li key={item.id}>
                <button
                  onClick={(e) => handleClick(e, item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-violet-600' : 'text-gray-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar - always visible on lg+ */}
      <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] hidden lg:block flex-shrink-0">
        <NavContent />
      </aside>

      {/* Mobile/Tablet Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sidebar Panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl animate-slide-in-left">
            {/* Mobile Header */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
              <div className="flex items-center">
                <svg
                  className="h-7 w-7"
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="20" cy="20" r="18" fill="#7C3AED" />
                  <path
                    d="M14 10V30M14 20L26 10M14 20L26 30"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="ml-2 text-lg font-semibold text-violet-600">kriyadocs</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <div className="h-[calc(100vh-56px)] overflow-y-auto">
              <NavContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
