import React from 'react';
import { SunIcon, MoonIcon, Cog6ToothIcon, BellIcon } from './common/Icons';

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onSettingsClick: () => void;
  overdueCount: number;
  onNotificationClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode, onSettingsClick, overdueCount, onNotificationClick }) => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-10 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            LoanDash
          </h1>
          <div className="flex items-center gap-2">
            <button
                onClick={onNotificationClick}
                className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="View notifications"
            >
                <BellIcon className="w-6 h-6" />
                {overdueCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800" />
                )}
            </button>
            <button
                onClick={onSettingsClick}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Open settings"
            >
                <Cog6ToothIcon className="w-6 h-6" />
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;