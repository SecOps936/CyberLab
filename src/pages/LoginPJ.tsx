import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Chrome, Shield, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const handleGitHubLogin = () => {
    // OAuth functionality will be added later
    console.log('GitHub OAuth login');
  };

  const handleGoogleLogin = () => {
    // OAuth functionality will be added later
    console.log('Google OAuth login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-orbitron font-bold text-cyber-blue mb-2">Welcome Back</h1>
          <p className="text-gray-400 font-cyber">Access your cybersecurity training portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-cyber-card backdrop-blur-md border border-cyber-blue/20 rounded-lg p-8 shadow-2xl shadow-cyber-blue/10 animate-slide-up">
          <div className="space-y-6">
            {/* GitHub OAuth Button */}
            <button
              onClick={handleGitHubLogin}
              className="w-full bg-cyber-dark/50 border border-cyber-blue/30 rounded-lg py-4 px-6 font-cyber text-white hover:border-cyber-blue hover:bg-cyber-blue/10 transition-all transform hover:scale-105 flex items-center justify-center gap-3 group"
            >
              <Github className="w-6 h-6 text-cyber-blue group-hover:text-white transition-colors" />
              <span className="font-bold">Continue with GitHub</span>
              <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg py-4 px-6 font-cyber text-white hover:border-cyber-purple hover:bg-cyber-purple/10 transition-all transform hover:scale-105 flex items-center justify-center gap-3 group"
            >
              <Chrome className="w-6 h-6 text-cyber-purple group-hover:text-white transition-colors" />
              <span className="font-bold">Continue with Google</span>
              <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-cyber-blue/20"></div>
            <span className="px-4 text-sm font-cyber text-gray-400">Secure Authentication</span>
            <div className="flex-1 border-t border-cyber-blue/20"></div>
          </div>

          {/* Features */}
          <div className="space-y-3 text-center">
            <p className="text-sm font-cyber text-gray-400">
              🔒 Enterprise-grade security
            </p>
            <p className="text-sm font-cyber text-gray-400">
              ⚡ Instant access to all labs
            </p>
            <p className="text-sm font-cyber text-gray-400">
              🏆 Track your progress & compete
            </p>
          </div>

          {/* Register Link */}
          <div className="text-center mt-8 pt-6 border-t border-cyber-blue/20">
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

export default Login;