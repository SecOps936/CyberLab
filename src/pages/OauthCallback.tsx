import React, { useEffect, useState,useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OAuthCallback : React.FC = () => {
  const { provider } = useParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false); 

  useEffect(() => {
     if (hasProcessed.current) return;
    const handleCallback = async () => {
      hasProcessed.current = true;
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        setError(`OAuth error: ${error}`);
        setLoading(false);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setLoading(false);
        return;
      }

      try {
        if (!provider) {
          setError('No provider specified');
          setLoading(false);
          return;
        }
        // provider is guaranteed to be a string here
        // code is checked above for null, so it's safe to assert as string
        
        console.log(`Handling OAuth callback for provider: ${provider}, code: ${code}, state: ${state}`);
        const success = await handleOAuthCallback(provider, code, state as string);
        if (success) {
          navigate('/dashboard');
        } else {
          setError('Failed to authenticate');
        }
      } catch (err) {
        setError('Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [provider, handleOAuthCallback, navigate]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div className="fixed inset-0 w-full h-full flex justify-center items-center min-h-screen bg-black relative overflow-hidden">
          {/* Animated grid background */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20"></div>
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          ></div>

          {/* Loading content */}
          <div className="relative z-10 text-center w-full">
            {/* Spinning neon ring */}
            <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-6 mx-auto shadow-lg shadow-cyan-400/50"></div>

            {/* Glitchy text */}
            <div className="text-cyan-400 text-xl font-mono tracking-wider uppercase animate-pulse">
              <span className="relative">
                Loading
                <span className="absolute inset-0 text-pink-500 animate-ping opacity-30">Loading</span>
              </span>
              <span className="animate-bounce">...</span>
            </div>

            {/* Scanning line effect */}
            <div className="w-full max-w-2xl h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mt-4 animate-pulse mx-auto"></div>
          </div>

          {/* Corner accents */}
          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-cyan-400 opacity-60"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-cyan-400 opacity-60"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-cyan-400 opacity-60"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-cyan-400 opacity-60"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        gap: '20px'
      }}>
        <div style={{ color: 'red' }}>{error}</div>
        <button 
          onClick={() => navigate('/login')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Login
        </button>
      </div>
    );
  }

  return null;
};

export default OAuthCallback;