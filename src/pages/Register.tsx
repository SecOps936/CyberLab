import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Github, Chrome } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { loginWithGoogle, loginWithGitHub } = useAuth();
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous error
    setError('');

    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('Sign up attempt:', { username: formData.username, email: formData.email });

      // ✅ FIXED: Removed '/api/' from the URL - THIS WAS THE PROBLEM
      const response = await apiClient.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      console.log('Registration response:', response.data);

      if (response.data.access_token) {
        // Save token to localStorage
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify({
          username: formData.username,
          email: formData.email
        }));

        setSuccess(true);

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Registration error:', err);

      if (err.response) {
        // Server responded with error
        const errorMsg = err.response.data?.detail || err.response.data?.message || 'Registration failed';
        setError(errorMsg);
      } else if (err.request) {
        // Request made but no response
        setError('Cannot connect to server. Make sure backend is running on port 8000');
      } else {
        // Something else happened
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
    <h1 className="text-3xl font-orbitron font-bold text-cyber-purple mb-2">Join the Elite</h1>
    <p className="text-gray-400 font-cyber">Start your cybersecurity journey today</p>
    </div>

    {/* Sign Up Form */}
    <div className="bg-cyber-card backdrop-blur-md border border-cyber-purple/20 rounded-lg p-8 shadow-2xl shadow-cyber-purple/10 animate-slide-up">
    {/* Success Message */}
    {success && (
      <div className="mb-6 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-500 text-center">
      ✅ Registration successful! Redirecting...
      </div>
    )}

    {/* Error Message */}
    {error && !success && (
      <div className="mb-6 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-500 text-center">
      ⚠️ {error}
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-6">
    {/* Username Field */}
    <div>
    <label className="block text-sm font-cyber text-gray-300 mb-2">Username</label>
    <div className="relative">
    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
    type="text"
    value={formData.username}
    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
    className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg pl-10 pr-4 py-3 text-white font-cyber focus:border-cyber-purple focus:outline-none focus:ring-2 focus:ring-cyber-purple/20 transition-all"
    placeholder="Choose a username"
    disabled={loading || success}
    required
    />
    </div>
    </div>

    {/* Email Field */}
    <div>
    <label className="block text-sm font-cyber text-gray-300 mb-2">Email Address</label>
    <div className="relative">
    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
    type="email"
    value={formData.email}
    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
    className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg pl-10 pr-4 py-3 text-white font-cyber focus:border-cyber-purple focus:outline-none focus:ring-2 focus:ring-cyber-purple/20 transition-all"
    placeholder="your@email.com"
    disabled={loading || success}
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
    className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg pl-10 pr-12 py-3 text-white font-cyber focus:border-cyber-purple focus:outline-none focus:ring-2 focus:ring-cyber-purple/20 transition-all"
    placeholder="Create a strong password (min 6 characters)"
    disabled={loading || success}
    required
    />
    <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyber-purple transition-colors"
    >
    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
    </button>
    </div>
    </div>

    {/* Confirm Password Field */}
    <div>
    <label className="block text-sm font-cyber text-gray-300 mb-2">Confirm Password</label>
    <div className="relative">
    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
    type={showConfirmPassword ? 'text' : 'password'}
    value={formData.confirmPassword}
    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
    className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg pl-10 pr-12 py-3 text-white font-cyber focus:border-cyber-purple focus:outline-none focus:ring-2 focus:ring-cyber-purple/20 transition-all"
    placeholder="Confirm your password"
    disabled={loading || success}
    required
    />
    <button
    type="button"
    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyber-purple transition-colors"
    >
    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
    </button>
    </div>
    </div>

    {/* Terms Agreement */}
    <div className="flex items-start gap-3">
    <input
    type="checkbox"
    className="mt-1 w-4 h-4 border border-cyber-purple/30 rounded bg-cyber-dark/50"
    disabled={loading || success}
    required
    />
    <p className="text-sm font-cyber text-gray-300">
    I agree to the{' '}
    <Link to="/terms" className="text-cyber-purple hover:text-cyber-blue transition-colors">
    Terms of Service
    </Link>
    {' '}and{' '}
    <Link to="/privacy" className="text-cyber-purple hover:text-cyber-blue transition-colors">
    Privacy Policy
    </Link>
    </p>
    </div>

    {/* Sign Up Button */}
    <button
    type="submit"
    disabled={loading || success}
    className="w-full bg-gradient-to-r from-cyber-purple to-cyber-blue py-3 rounded-lg font-orbitron font-bold hover:shadow-lg hover:shadow-cyber-purple/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
    >
    {loading ? 'REGISTERING...' : success ? 'REGISTERED!' : 'Join Snowden Labs'}
    </button>
    </form>

    {/* Divider */}
    <div className="my-8 flex items-center">
    <div className="flex-1 border-t border-cyber-purple/20"></div>
    <span className="px-4 text-sm font-cyber text-gray-400">or continue with</span>
    <div className="flex-1 border-t border-cyber-purple/20"></div>
    </div>

    {/* Social Login */}
    <div className="grid grid-cols-2 gap-4">
    <button
    className="flex items-center justify-center gap-2 bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg py-3 font-cyber text-gray-300 hover:border-cyber-purple transition-all transform hover:scale-105"
    onClick={loginWithGitHub}
    disabled={loading || success}
    >
    <Github className="w-5 h-5" />
    GitHub
    </button>
    <button
    className="flex items-center justify-center gap-2 bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg py-3 font-cyber text-gray-300 hover:border-cyber-purple transition-all transform hover:scale-105"
    onClick={loginWithGoogle}
    disabled={loading || success}
    >
    <Chrome className="w-5 h-5" />
    Google
    </button>
    </div>

    {/* Sign In Link */}
    <div className="text-center mt-8">
    <p className="text-gray-400 font-cyber">
    Already have an account?{' '}
    <Link to="/login" className="text-cyber-purple hover:text-cyber-blue transition-colors font-bold">
    Sign In
    </Link>
    </p>
    </div>
    </div>
    </div>
    </div>
  );
};

export default SignUp;
