import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Chrome, Shield, ArrowRight, Star, Trophy, Target } from 'lucide-react';

const Register: React.FC = () => {
  const handleGitHubRegister = () => {
    // OAuth functionality will be added later
    console.log('GitHub OAuth register');
  };

  const handleGoogleRegister = () => {
    // OAuth functionality will be added later
    console.log('Google OAuth register');
  };

  const benefits = [
    { icon: <Target className="w-5 h-5" />, text: "Access 50+ hands-on labs" },
    { icon: <Trophy className="w-5 h-5" />, text: "Compete in weekly tournaments" },
    { icon: <Star className="w-5 h-5" />, text: "Earn certificates & badges" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-gradient-to-br from-cyber-purple to-cyber-blue rounded-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-orbitron font-bold text-cyber-purple mb-2">Join the Elite</h1>
          <p className="text-gray-400 font-cyber">Start your cybersecurity journey today</p>
        </div>

        {/* Register Form */}
        <div className="bg-cyber-card backdrop-blur-md border border-cyber-purple/20 rounded-lg p-8 shadow-2xl shadow-cyber-purple/10 animate-slide-up">
          {/* Benefits */}
          <div className="mb-8 space-y-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-sm font-cyber text-gray-300">
                <div className="text-cyber-green">
                  {benefit.icon}
                </div>
                {benefit.text}
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {/* GitHub OAuth Button */}
            <button
              onClick={handleGitHubRegister}
              className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg py-4 px-6 font-cyber text-white hover:border-cyber-purple hover:bg-cyber-purple/10 transition-all transform hover:scale-105 flex items-center justify-center gap-3 group"
            >
              <Github className="w-6 h-6 text-cyber-purple group-hover:text-white transition-colors" />
              <span className="font-bold">Sign up with GitHub</span>
              <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleRegister}
              className="w-full bg-cyber-dark/50 border border-cyber-blue/30 rounded-lg py-4 px-6 font-cyber text-white hover:border-cyber-blue hover:bg-cyber-blue/10 transition-all transform hover:scale-105 flex items-center justify-center gap-3 group"
            >
              <Chrome className="w-6 h-6 text-cyber-blue group-hover:text-white transition-colors" />
              <span className="font-bold">Sign up with Google</span>
              <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* Terms */}
          <div className="mt-6 text-center">
            <p className="text-xs font-cyber text-gray-500">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="text-cyber-purple hover:text-cyber-blue transition-colors">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-cyber-purple hover:text-cyber-blue transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Login Link */}
          <div className="text-center mt-8 pt-6 border-t border-cyber-purple/20">
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

export default Register;