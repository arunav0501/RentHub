import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import { ThemeContext } from '../../../context/ThemeContext';
import { Search, Menu, X, Package, Sun, Moon, Sparkles } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md fixed w-full z-50 top-0 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">RentHub</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">Home</Link>
            <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">Products</Link>
            <div className="relative">
              <input type="text" placeholder="Search..." className="pl-10 pr-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm w-48 focus:w-64 transition-all duration-300 dark:text-white" />
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <button onClick={toggleTheme} className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Dashboard</Link>
                <Link to="/dashboard/ai-listing" className="text-primary hover:text-primary-dark transition-colors font-medium flex items-center gap-1"><Sparkles className="h-4 w-4" /> AI Listing</Link>
                <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Hi, {user.name}</span>
                <button onClick={handleLogout} className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium">Logout</button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors font-medium text-sm">Login</Link>
                <Link to="/register" className="px-5 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-all shadow-md shadow-primary/30 font-medium text-sm">Register</Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center space-x-4">
            <button onClick={toggleTheme} className="text-slate-500 dark:text-slate-400">{isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-500 dark:text-slate-400 hover:text-slate-700">{isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-4 space-y-4">
          <Link to="/" className="block text-slate-600 dark:text-slate-300 hover:text-primary">Home</Link>
          <Link to="/" className="block text-slate-600 dark:text-slate-300 hover:text-primary">Products</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="block text-slate-600 dark:text-slate-300 hover:text-primary">Dashboard</Link>
              <Link to="/dashboard/ai-listing" className="block text-primary font-medium">✨ AI Listing Generator</Link>
              <button onClick={handleLogout} className="block w-full text-left text-red-500">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-slate-600 dark:text-slate-300 hover:text-primary">Login</Link>
              <Link to="/register" className="block text-primary font-medium">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
