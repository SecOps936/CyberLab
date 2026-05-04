import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Github, Chrome } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithGitHub } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);

    try {
      console.log('Login attempt:', { username: formData.username });

      // Use the login method from AuthContext
      await login(formData.username, formData.password);

      console.log('Login successful, redirecting to dashboard...');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);

      if (err.response) {
        const errorMsg = err.response.data?.detail || err.response.data?.message || 'Invalid username or password';
        setError(errorMsg);
      } else if (err.request) {
        setError('Cannot connect to server. Make sure backend is running on port 8000');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
    <div className="max-w-md w-full">
    {/* Header */}
    <div className="text-center mb-8 animate-fade-in">
    <h1 className="text-3xl font-orbitron font-bold text-cyber-blue mb-2">Welcome Back</h1>
    <p className="text-gray-400 font-cyber">Access your cybersecurity training portal</p>
    </div>

    {/* Sign In Form */}
    <div className="bg-cyber-card backdrop-blur-md border border-cyber-blue/20 rounded-lg p-8 shadow-2xl shadow-cyber-blue/10 animate-slide-up">
    {/* Error Message */}
    {error && (
      <div className="mb-6 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-500 text-center">
      {error}
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-6">
    {/* Username Field */}
    <div>
    <label className="block text-sm font-cyber text-gray-300 mb-2">Username</label>
    <div className="relative">
    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
    type="text"
    value={formData.username}
    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
    className="w-full bg-cyber-dark/50 border border-cyber-blue/30 rounded-lg pl-10 pr-4 py-3 text-white font-cyber focus:border-cyber-blue focus:outline-none focus:ring-2 focus:ring-cyber-blue/20 transition-all"
    placeholder="Enter your username"
    disabled={loading}
    required
    />
    </div>
    </div>

    {/* Password Field */}
    <div>
    <label className="block text-sm font-cyber text-gray-300 mb-2">Password</label>
    <div className="relative">
    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
    type={showPassword ? 'text' : 'password'}
    value={formData.password}
    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
    className="w-full bg-cyber-dark/50 border border-cyber-blue/30 rounded-lg pl-10 pr-12 py-3 text-white font-cyber focus:border-cyber-blue focus:outline-none focus:ring-2 focus:ring-cyber-blue/20 transition-all"
    placeholder="Enter your password"
    disabled={loading}
    required
    />
    <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyber-blue transition-colors"
    >
    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
    </button>
    </div>
    </div>

    {/* Remember Me & Forgot Password */}
    <div className="flex items-center justify-between">
    <label className="flex items-center cursor-pointer">
    <input type="checkbox" className="sr-only" disabled={loading} />
    <div className="w-4 h-4 border border-cyber-blue/30 rounded bg-cyber-dark/50 flex items-center justify-center">
    <div className="w-2 h-2 bg-cyber-blue rounded hidden"></div>
    </div>
    <span className="ml-2 text-sm font-cyber text-gray-300">Remember me</span>
    </label>
    <Link to="/forgot-password" className="text-sm font-cyber text-cyber-blue hover:text-cyber-purple transition-colors">
    Forgot password?
    </Link>
    </div>

    {/* Sign In Button */}
    <button
    type="submit"
    disabled={loading}
    className="w-full bg-gradient-to-r from-cyber-blue to-cyber-purple py-3 rounded-lg font-orbitron font-bold hover:shadow-lg hover:shadow-cyber-blue/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
    >
    {loading ? 'LOGGING IN...' : 'Access Labs'}
    </button>
    </form>

    {/* Divider */}
    <div className="my-8 flex items-center">
    <div className="flex-1 border-t border-cyber-blue/20"></div>
    <span className="px-4 text-sm font-cyber text-gray-400">or continue with</span>
    <div className="flex-1 border-t border-cyber-blue/20"></div>
    </div>

    {/* Social Login */}
    <div className="grid grid-cols-2 gap-4">
    <button
    className="flex items-center justify-center gap-2 bg-cyber-dark/50 border border-cyber-blue/30 rounded-lg py-3 font-cyber text-gray-300 hover:border-cyber-blue transition-all transform hover:scale-105"
    onClick={loginWithGitHub}
    disabled={loading}
    >
    <Github className="w-5 h-5" />
    GitHub
    </button>
    <button
    className="flex items-center justify-center gap-2 bg-cyber-dark/50 border border-cyber-blue/30 rounded-lg py-3 font-cyber text-gray-300 hover:border-cyber-blue transition-all transform hover:scale-105"
    onClick={loginWithGoogle}
    disabled={loading}
    >
    <Chrome className="w-5 h-5" />
    Google
    </button>
    </div>

    {/* Sign Up Link */}
    <div className="text-center mt-8">
    <p className="text-gray-400 font-cyber">
    New to Snowden Labs?{' '}
    <Link to="/register" className="text-cyber-blue hover:text-cyber-purple transition-colors font-bold">
    Create Account
    </Link>
    </p>
    </div>
    </div>
    </div>
    </div>
  );
};

export default SignIn;
