import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Star,
  Users,
  Zap,
  Play,
  Eye,
  EyeOff,
  Trophy,
  Target,
  Shield,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface Lab {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  time: string;
  points: number;
  participants: number;
  description: string;
  long_description: string;
  objectives: string[];
  prerequisites: string[];
  hints: string[];
  tags: string[];
  completed: boolean;
  featured: boolean;
  tools: string[];
  environment: string;
}

const LabDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hintsVisible, setHintsVisible] = useState(false);
  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLabDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`http://localhost:8000/labs/${id}`);
        setLab(response.data);
      } catch (err: any) {
        console.error('Error fetching lab details:', err);
        setError(err.response?.status === 404 ? 'Lab not found' : 'Failed to load lab details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLabDetails();
    }
  }, [id]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'cyber-green';
      case 'intermediate': return 'cyber-blue';
      case 'advanced': return 'cyber-purple';
      case 'expert': return 'red-500';
      default: return 'gray-400';
    }
  };

  const handleStartLab = () => async () => {
    if (!lab) return;

    console.log('Starting lab here:', id);
    const resp = await axios.put(`https://cyber.yit-agency.com/api/labs/start/${id}`, { userId: 1 });

    if (resp.status === 200) {
      console.log('Lab started successfully');
      window.open(resp.data.url, '_blank');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen py-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyber-green animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-cyber">Loading lab details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !lab) {
    return (
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/labs')}
            className="flex items-center gap-2 text-gray-400 hover:text-cyber-blue transition-colors mb-8 font-cyber"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Labs
          </button>
          <div className="bg-cyber-card backdrop-blur-md border border-red-500/20 rounded-lg p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-orbitron font-bold text-white mb-2">
              {error || 'Lab not found'}
            </h2>
            <p className="text-gray-400 font-cyber mb-6">
              The lab you're looking for doesn't exist or couldn't be loaded.
            </p>
            <button
              onClick={() => navigate('/labs')}
              className="bg-gradient-to-r from-cyber-green to-cyber-blue py-3 px-6 rounded-lg font-orbitron font-bold hover:shadow-lg hover:shadow-cyber-green/50 transition-all"
            >
              Browse All Labs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/labs')}
          className="flex items-center gap-2 text-gray-400 hover:text-cyber-blue transition-colors mb-8 font-cyber"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Labs
        </button>

        {/* Lab Header */}
        <div className="bg-cyber-card backdrop-blur-md border border-cyber-green/20 rounded-lg p-8 mb-8 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-xs font-cyber px-3 py-1 rounded-full bg-${getDifficultyColor(lab.difficulty)}/20 text-${getDifficultyColor(lab.difficulty)} border border-${getDifficultyColor(lab.difficulty)}/30`}>
                  {lab.difficulty.toUpperCase()}
                </span>
                <span className="text-xs font-cyber text-gray-400 uppercase">
                  {lab.category}
                </span>
                {lab.featured && (
                  <div className="bg-gradient-to-r from-cyber-blue to-cyber-purple p-1 rounded-full">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-orbitron font-bold text-white mb-4">
                {lab.title}
              </h1>

              <p className="text-gray-300 font-cyber text-lg mb-6">
                {lab.description}
              </p>

              {/* Lab Stats */}
              <div className="flex flex-wrap gap-6 text-sm font-cyber text-gray-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {lab.time}
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {lab.points} XP
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {lab.participants} completed
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Certificate eligible
                </div>
              </div>
            </div>

            {/* Start Lab Button */}
            <div className="lg:w-64">
              <button
                onClick={handleStartLab()}
                className="w-full bg-gradient-to-r from-cyber-green to-cyber-blue py-4 px-6 rounded-lg font-orbitron font-bold text-lg hover:shadow-lg hover:shadow-cyber-green/50 transition-all transform hover:scale-105 flex items-center justify-center gap-3 group mb-4"
              >
                <Play className="w-6 h-6" />
                Start Now
                <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-center text-sm font-cyber text-gray-400">
                <Shield className="w-4 h-4 inline mr-1" />
                Safe, isolated environment
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-blue/20 rounded-lg p-6">
              <h2 className="text-xl font-orbitron font-bold text-cyber-blue mb-4">About This Lab</h2>
              <div className="text-gray-300 font-cyber space-y-4">
                {lab.long_description.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-purple/20 rounded-lg p-6">
              <h2 className="text-xl font-orbitron font-bold text-cyber-purple mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Learning Objectives
              </h2>
              <ul className="space-y-3">
                {lab.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-300 font-cyber">
                    <div className="w-2 h-2 bg-cyber-purple rounded-full mt-2 flex-shrink-0"></div>
                    {objective}
                  </li>
                ))}
              </ul>
            </div>

            {/* Hints Section */}
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-green/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-orbitron font-bold text-cyber-green flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Hints & Tips
                </h2>
                <button
                  onClick={() => setHintsVisible(!hintsVisible)}
                  className="flex items-center gap-2 text-cyber-green hover:text-cyber-blue transition-colors font-cyber"
                >
                  {hintsVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {hintsVisible ? 'Hide Hints' : 'Show Hints'}
                </button>
              </div>

              {hintsVisible ? (
                <div className="space-y-3">
                  {lab.hints.map((hint, index) => (
                    <div key={index} className="bg-cyber-dark/30 p-4 rounded-lg border border-cyber-green/20">
                      <div className="flex items-start gap-3">
                        <span className="text-cyber-green font-cyber font-bold text-sm">
                          Hint #{index + 1}:
                        </span>
                        <span className="text-gray-300 font-cyber text-sm">{hint}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 font-cyber text-sm">
                  Click "Show Hints" to reveal helpful tips for completing this lab.
                  Try solving it on your own first!
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Prerequisites */}
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-blue/20 rounded-lg p-6">
              <h3 className="text-lg font-orbitron font-bold text-cyber-blue mb-4">Prerequisites</h3>
              <ul className="space-y-2">
                {lab.prerequisites.map((prereq, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-300 font-cyber text-sm">
                    <div className="w-1.5 h-1.5 bg-cyber-blue rounded-full mt-2 flex-shrink-0"></div>
                    {prereq}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tools */}
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-purple/20 rounded-lg p-6">
              <h3 className="text-lg font-orbitron font-bold text-cyber-purple mb-4">Tools Provided</h3>
              <div className="space-y-2">
                {lab.tools.map((tool, index) => (
                  <div key={index} className="bg-cyber-dark/30 px-3 py-2 rounded border border-cyber-purple/20">
                    <span className="text-gray-300 font-cyber text-sm">{tool}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Environment */}
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-green/20 rounded-lg p-6">
              <h3 className="text-lg font-orbitron font-bold text-cyber-green mb-4">Environment</h3>
              <p className="text-gray-300 font-cyber text-sm">{lab.environment}</p>
            </div>

            {/* Tags */}
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-blue/20 rounded-lg p-6">
              <h3 className="text-lg font-orbitron font-bold text-cyber-blue mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {lab.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs font-cyber px-2 py-1 bg-cyber-dark/50 text-cyber-blue rounded border border-cyber-blue/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabDetails;