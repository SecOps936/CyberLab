import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-cyber-gray/90 backdrop-blur-md border-b border-cyber-blue/20 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4">
    <div className="flex items-center justify-between h-16">
    {/* Logo */}
    <Link to="/" className="flex items-center gap-2 group">
    <div className="p-2 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-lg group-hover:shadow-lg group-hover:shadow-cyber-blue/50 transition-all">
    <Shield className="w-6 h-6 text-white" />
    </div>
    <div className="flex flex-col">
    <span className="text-xl font-orbitron font-bold text-cyber-blue">SNOWDEN</span>
    <span className="text-xs font-cyber text-cyber-green -mt-1">LABS</span>
    </div>
    </Link>

    {/* Desktop Navigation */}
    <div className="hidden md:flex items-center gap-8">
    <Link
    to="/"
    className={`font-cyber transition-colors hover:text-cyber-blue ${isActive('/') ? 'text-cyber-blue' : 'text-gray-300'
    }`}
    >
    Home
    </Link>
    <Link
    to={isAuthenticated ? "/labs" : "/login"}
    className={`font-cyber transition-colors hover:text-cyber-blue ${isActive('/labs') ? 'text-cyber-blue' : 'text-gray-300'
    }`}
    >
    Labs
    </Link>
    <Link
    to={isAuthenticated ? "/dashboard" : "/login"}
    className={`font-cyber transition-colors hover:text-cyber-blue ${isActive('/dashboard') ? 'text-cyber-blue' : 'text-gray-300'
    }`}
    >
    Dashboard
    </Link>
    </div>

    {/* Auth Section */}
    <div className="hidden md:flex items-center gap-4">
    {loading ? null : isAuthenticated ? (
      <>
      <Link
      to="/dashboard"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyber-blue/30 bg-cyber-blue/10 hover:bg-cyber-blue/20 hover:border-cyber-blue/50 transition-all"
      >
      {user?.avatar_url ? (
        <img
        src={user.avatar_url}
        alt="avatar"
        className="w-8 h-8 rounded-full border-2 border-cyber-blue"
        />
      ) : (
        <User className="w-6 h-6 text-cyber-blue" />
      )}
      <span className="font-cyber text-cyber-blue">
      {user?.username || 'Profile'}
      </span>
      </Link>
      {/* Logout Button */}
      <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all font-cyber text-sm border border-red-500/30"
      >
      <LogOut className="w-4 h-4" />
      <span>Logout</span>
      </button>
      </>
    ) : (
      <>
      <Link
      to="/login"
      className="font-cyber text-gray-300 hover:text-cyber-blue transition-colors"
      >
      Sign In
      </Link>
      <Link
      to="/register"
      className="bg-gradient-to-r from-cyber-blue to-cyber-purple px-4 py-2 rounded-lg font-cyber font-bold hover:shadow-lg hover:shadow-cyber-blue/50 transition-all transform hover:scale-105"
      >
      Join Now
      </Link>
      </>
    )}
    </div>

    {/* Mobile Menu Button */}
    <button
    onClick={() => setIsMenuOpen(!isMenuOpen)}
    className="md:hidden p-2 text-gray-300 hover:text-cyber-blue transition-colors"
    >
    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
    </button>
    </div>

    {/* Mobile Menu */}
    {isMenuOpen && (
      <div className="md:hidden py-4 border-t border-cyber-blue/20 animate-slide-up">
      <div className="flex flex-col gap-4">
      <Link to="/" className="font-cyber text-gray-300 hover:text-cyber-blue transition-colors">
      Home
      </Link>
      <Link to="/labs" className="font-cyber text-gray-300 hover:text-cyber-blue transition-colors">
      Labs
      </Link>
      <Link to="/dashboard" className="font-cyber text-gray-300 hover:text-cyber-blue transition-colors">
      Dashboard
      </Link>
      <hr className="border-cyber-blue/20" />

      {!isAuthenticated ? (
        <div className="flex flex-col gap-3">
        <Link to="/login" className="font-cyber text-gray-300 hover:text-cyber-blue transition-colors">
        Sign In
        </Link>
        <Link
        to="/register"
        className="bg-gradient-to-r from-cyber-blue to-cyber-purple px-4 py-2 rounded-lg font-cyber font-bold text-center"
        >
        Join Now
        </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
        <Link
        to="/dashboard"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyber-blue/30 bg-cyber-blue/10 hover:bg-cyber-blue/20 hover:border-cyber-blue/50 transition-all w-fit"
        >
        {user?.avatar_url ? (
          <img
          src={user.avatar_url}
          alt="avatar"
          className="w-8 h-8 rounded-full border-2 border-cyber-blue"
          />
        ) : (
          <User className="w-6 h-6 text-cyber-blue" />
        )}
        <span className="font-cyber text-cyber-blue">
        {user?.username || 'Profile'}
        </span>
        </Link>
        {/* Mobile Logout Button */}
        <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all font-cyber text-sm border border-red-500/30 w-full"
        >
        <LogOut className="w-4 h-4" />
        <span>Logout</span>
        </button>
        </div>
      )}
      </div>
      </div>
    )}
    </div>
    </nav>
  );
};
export default Navbar;
