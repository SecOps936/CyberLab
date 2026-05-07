import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Clock, Server, RefreshCw, Terminal, Shield, Zap, BookOpen, Target, AlertCircle, Info, Key, Lock, Unlock, Wifi, WifiOff } from 'lucide-react';
import apiClient from '../api';

const LabWorkspace: React.FC = () => {
  const { labId } = useParams<{ labId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [labUrl, setLabUrl] = useState<string | null>(null);
  const [labTitle, setLabTitle] = useState<string>('');
  const [labDetails, setLabDetails] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittedFlag, setSubmittedFlag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ correct: boolean; message: string } | null>(null);

  useEffect(() => {
    const initWorkspace = async () => {
      const sessionData = location.state?.labSession;
      const labData = location.state?.lab;

      if (sessionData && sessionData.url) {
        setLabUrl(sessionData.url);
        setLabTitle(sessionData.labTitle || labData?.title || 'Lab');
        setSessionId(sessionData.sessionId);
        setExpiresIn(sessionData.expiresIn || 3600);
        await fetchLabDetails(labId!);
        await checkContainerStatus(sessionData.url);
        setLoading(false);

        // Auto-open in new tab after container is ready
        setTimeout(() => {
          if (sessionData.url && !tabOpened) {
            window.open(sessionData.url, '_blank');
            setTabOpened(true);
          }
        }, 3000);
      } else {
        const stored = localStorage.getItem(`lab_${labId}_session`);
        if (stored) {
          try {
            const session = JSON.parse(stored);
            setLabUrl(session.url);
            setLabTitle(session.labTitle || 'Lab');
            setSessionId(session.sessionId);
            setExpiresIn(session.expiresIn || 3600);
            await fetchLabDetails(labId!);
            await checkContainerStatus(session.url);
          } catch (e) {
            setError('Invalid session data');
          }
        } else {
          setError('No lab session found. Please start the lab again.');
        }
        setLoading(false);
      }
    };

    initWorkspace();
  }, [labId, location]);

  const fetchLabDetails = async (id: string) => {
    try {
      const response = await apiClient.get(`/labs/${id}`);
      setLabDetails(response.data);
    } catch (err) {
      console.error('Error fetching lab details:', err);
    }
  };

  const checkContainerStatus = async (url: string) => {
    setContainerStatus('checking');

    let attempts = 0;
    const maxAttempts = 20;

    const checkInterval = setInterval(async () => {
      attempts++;
      try {
        const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        setContainerStatus('running');
        clearInterval(checkInterval);
      } catch (err) {
        if (attempts >= maxAttempts) {
          setContainerStatus('unreachable');
          clearInterval(checkInterval);
        }
      }
    }, 2000);
  };

  const getLabCredentials = () => {
    const image = labDetails?.docker_image || '';

    if (image.includes('dvwa')) {
      return {
        type: 'DVWA (Damn Vulnerable Web Application)',
        username: 'admin',
        password: 'password',
        loginUrl: `${labUrl}/login.php`,
        instructions: 'Login with the credentials below to start the lab'
      };
    }

    if (image.includes('juice')) {
      return {
        type: 'OWASP Juice Shop',
        username: 'admin@juice-sh.op',
        password: 'admin123',
        loginUrl: labUrl,
        instructions: 'Login or register a new account'
      };
    }

    return null;
  };

  const getLabInstructions = () => {
    const title = labDetails?.title || '';

    if (title.includes('SQL')) {
      return {
        objective: 'Learn to exploit SQL injection vulnerabilities',
        steps: [
          'Navigate to the SQL Injection section',
          'Try entering: \' OR \'1\'=\'1',
          'Bypass authentication and extract data'
        ]
      };
    }

    if (title.includes('XSS')) {
      return {
        objective: 'Master Cross-Site Scripting attacks',
        steps: [
          'Find input fields that reflect user input',
          'Try injecting: <script>alert("XSS")</script>',
          'Steal cookies or redirect users'
        ]
      };
    }

    if (title.includes('Caesar')) {
      return {
        objective: 'Decrypt Caesar cipher messages',
        steps: [
          'Use frequency analysis',
          'Try all 25 possible shifts',
          'Look for readable English text'
        ]
      };
    }

    return null;
  };

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [timeLeft, setTimeLeft] = useState(expiresIn);

  useEffect(() => {
    if (expiresIn > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [expiresIn]);

  const handleOpenLab = () => {
    if (labUrl) {
      window.open(labUrl, '_blank');
      setTabOpened(true);
    }
  };

  const handleStopLab = async () => {
    if (!sessionId) return;

    try {
      await apiClient.post(`/labs/stop/${sessionId}`);
      localStorage.removeItem(`lab_${labId}_session`);
      navigate('/labs');
    } catch (err) {
      console.error('Error stopping lab:', err);
    }
  };

  const handleSubmitFlag = async () => {
    if (!submittedFlag.trim()) {
      setSubmissionResult({ correct: false, message: 'Please enter a flag' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.post('/flags/submit/lab', {
        challenge_id: labId,
        flag: submittedFlag
      });

      setSubmissionResult(response.data);
      if (response.data.correct) {
        setSubmittedFlag('');
        // Refresh user data or show completion status
        setTimeout(() => {
          navigate('/labs');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error submitting flag:', err);
      setSubmissionResult({
        correct: false,
        message: err.response?.data?.message || 'Error submitting flag'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const credentials = getLabCredentials();
  const instructions = getLabInstructions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
      <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-green mx-auto mb-4"></div>
      <p className="text-cyber-green font-cyber">Starting your lab environment...</p>
      <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
      </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
      <div className="bg-cyber-card backdrop-blur-md border border-red-500/30 rounded-lg p-8 text-center max-w-md">
      <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-orbitron font-bold text-red-500 mb-4">Session Error</h2>
      <p className="text-gray-400 mb-6">{error}</p>
      <Link to="/labs" className="px-6 py-3 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg font-orbitron font-bold hover:shadow-lg transition-all">
      Back to Labs
      </Link>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900">
    {/* Header */}
    <div className="bg-cyber-card/80 backdrop-blur-md border-b border-cyber-green/30 sticky top-0 z-10">
    <div className="max-w-7xl mx-auto px-4 py-4">
    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
    <div className="flex items-center gap-4">
    <Link to="/labs" className="flex items-center gap-2 text-gray-400 hover:text-cyber-green transition-colors">
    <ArrowLeft className="w-5 h-5" />
    Back to Labs
    </Link>
    <div className="h-6 w-px bg-cyber-green/30 hidden md:block"></div>
    <div>
    <h1 className="text-xl font-orbitron font-bold text-cyber-green">{labTitle}</h1>
    <p className="text-xs text-gray-500">Lab Workspace</p>
    </div>
    </div>

    <div className="flex items-center gap-4">
    <div className="flex items-center gap-2 px-4 py-2 bg-cyber-dark/50 rounded-lg border border-cyber-green/30">
    <div className={`w-2 h-2 rounded-full ${
      containerStatus === 'running' ? 'bg-green-500 animate-pulse' :
      containerStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
    }`} />
    <span className="text-xs text-gray-400">
    {containerStatus === 'running' ? 'Lab Ready' :
      containerStatus === 'checking' ? 'Starting...' : 'Error'}
      </span>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 bg-cyber-dark/50 rounded-lg border border-cyber-green/30">
      <Clock className="w-4 h-4 text-cyber-green" />
      <span className="font-mono text-cyber-green">{formatTimeRemaining(timeLeft)}</span>
      <span className="text-xs text-gray-400">remaining</span>
      </div>

      <button
      onClick={handleOpenLab}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg font-cyber text-sm hover:shadow-lg transition-all"
      >
      <ExternalLink className="w-4 h-4" />
      Open Lab
      </button>

      <button
      onClick={handleStopLab}
      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all"
      >
      <Terminal className="w-4 h-4" />
      Stop Lab
      </button>
      </div>
      </div>
      </div>
      </div>

      {/* Lab URL Bar */}
      <div className="bg-cyber-dark/30 border-b border-cyber-green/20 px-4 py-2">
      <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
      <Server className="w-4 h-4 text-cyber-blue" />
      <span className="text-gray-400">Lab URL:</span>
      <code className="text-cyber-green bg-black/30 px-2 py-1 rounded">{labUrl}</code>
      <button onClick={() => navigator.clipboard.writeText(labUrl || '')} className="text-xs text-cyber-blue hover:text-cyber-green transition-colors">
      Copy
      </button>
      </div>
      </div>
      </div>
      </div>

      {/* Main Content - Lab Information Panel */}
      <div className="p-6">
      <div className="max-w-4xl mx-auto">
      {/* Container Status Card */}
      <div className="bg-cyber-card backdrop-blur-md border border-cyber-green/30 rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
      {containerStatus === 'running' ? (
        <Wifi className="w-6 h-6 text-cyber-green" />
      ) : (
        <WifiOff className="w-6 h-6 text-yellow-500" />
      )}
      <h2 className="text-xl font-orbitron font-bold text-cyber-green">
      {containerStatus === 'running' ? 'Lab Container Running' : 'Starting Lab Container...'}
      </h2>
      </div>
      <p className="text-gray-400">
      Your lab environment is ready! Click the <span className="text-cyber-green">"Open Lab"</span> button above to access it in a new tab.
      </p>
      </div>

      {/* Lab Credentials Card */}
      {credentials && (
        <div className="bg-cyber-card backdrop-blur-md border border-cyber-blue/30 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
        <Key className="w-6 h-6 text-cyber-blue" />
        <h2 className="text-xl font-orbitron font-bold text-cyber-blue">Lab Access</h2>
        </div>
        <p className="text-gray-400 mb-4">{credentials.instructions}</p>
        <div className="bg-black/30 rounded-lg p-4 space-y-2">
        <p className="text-gray-300">
        <span className="text-cyber-green">Lab Type:</span> {credentials.type}
        </p>
        <p className="text-gray-300">
        <span className="text-cyber-green">Username:</span> <code className="bg-cyber-dark/50 px-2 py-1 rounded text-cyber-blue">{credentials.username}</code>
        </p>
        <p className="text-gray-300">
        <span className="text-cyber-green">Password:</span> <code className="bg-cyber-dark/50 px-2 py-1 rounded text-cyber-blue">{credentials.password}</code>
        </p>
        <p className="text-gray-300">
        <span className="text-cyber-green">Login URL:</span> <code className="bg-cyber-dark/50 px-2 py-1 rounded text-cyber-blue">{credentials.loginUrl}</code>
        </p>
        </div>
        </div>
      )}

      {/* Lab Instructions Card */}
      {instructions && (
        <div className="bg-cyber-card backdrop-blur-md border border-cyber-purple/30 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
        <Target className="w-6 h-6 text-cyber-purple" />
        <h2 className="text-xl font-orbitron font-bold text-cyber-purple">Lab Objective</h2>
        </div>
        <p className="text-gray-400 mb-4">{instructions.objective}</p>
        <div className="bg-black/30 rounded-lg p-4">
        <h3 className="text-cyber-green font-cyber mb-2">Steps to Complete:</h3>
        <ul className="space-y-2">
        {instructions.steps.map((step, idx) => (
          <li key={idx} className="text-gray-300 flex items-start gap-2">
          <span className="text-cyber-green">{idx + 1}.</span>
          <span>{step}</span>
          </li>
        ))}
        </ul>
        </div>
        </div>
      )}

      {/* Flag Submission Card */}
      <div className="bg-cyber-card backdrop-blur-md border border-cyber-blue/20 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-6 h-6 text-cyber-blue" />
          <h2 className="text-xl font-orbitron font-bold text-cyber-blue">Submit Flag</h2>
        </div>
        <p className="text-gray-400 mb-4">Complete the lab objectives and submit the flag to earn points!</p>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Flag</label>
            <input
              type="text"
              value={submittedFlag}
              onChange={(e) => setSubmittedFlag(e.target.value)}
              placeholder="Enter the flag you found..."
              className="w-full bg-cyber-dark/50 border border-cyber-blue/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-cyber-blue focus:outline-none"
              disabled={submitting}
            />
          </div>

          <button
            onClick={handleSubmitFlag}
            disabled={submitting || !submittedFlag.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-cyber-blue to-cyber-purple rounded-lg font-orbitron font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Submitting...
              </div>
            ) : (
              'Submit Flag'
            )}
          </button>

          {submissionResult && (
            <div className={`p-4 rounded-lg border ${
              submissionResult.correct
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <div className="flex items-center gap-2">
                {submissionResult.correct ? (
                  <Unlock className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
                <span className="font-cyber">{submissionResult.message}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lab Details Card */}
      {labDetails && (
        <div className="bg-cyber-card backdrop-blur-md border border-cyber-green/20 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
        <BookOpen className="w-6 h-6 text-cyber-green" />
        <h2 className="text-xl font-orbitron font-bold text-cyber-green">About This Lab</h2>
        </div>
        <p className="text-gray-400 mb-4">{labDetails.description}</p>
        <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-cyber-purple" />
        <span className="text-gray-400">Points:</span>
        <span className="text-cyber-green">{labDetails.points} XP</span>
        </div>
        <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-cyber-blue" />
        <span className="text-gray-400">Estimated Time:</span>
        <span className="text-cyber-green">{labDetails.time}</span>
        </div>
        <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-cyber-purple" />
        <span className="text-gray-400">Difficulty:</span>
        <span className="text-cyber-green capitalize">{labDetails.difficulty}</span>
        </div>
        </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center mt-8">
      <button
      onClick={handleOpenLab}
      className="px-8 py-3 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg font-orbitron font-bold hover:shadow-lg hover:shadow-cyber-green/50 transition-all transform hover:scale-105"
      >
      <ExternalLink className="w-5 h-5 inline mr-2" />
      Open Lab in New Tab
      </button>
      <Link
      to="/labs"
      className="px-8 py-3 bg-cyber-dark/50 border border-cyber-green/30 rounded-lg font-orbitron font-bold hover:bg-cyber-green/20 transition-all"
      >
      Browse More Labs
      </Link>
      </div>
      </div>
      </div>
      </div>
  );
};

export default LabWorkspace;
