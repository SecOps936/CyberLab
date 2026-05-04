import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Play, Clock, Star, Users, Trophy, Zap, Loader2 } from 'lucide-react';
import apiClient from '../api';

const Labs: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [startingLabId, setStartingLabId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  type Lab = {
    id: string;
    title: string;
    category: string;
    difficulty: string;
    time: string;
    points: number;
    participants: number;
    description: string;
    tags: string[];
    completed: boolean;
    featured: boolean;
    docker_image: string;
    docker_port: number;
  };

  const [labs, setLabs] = useState<Lab[]>([]);

  useEffect(() => {
    getLabs();
  }, []);

  const getLabs = () => {
    setLoading(true);
    setError(null);
    //FIXED: Your backend endpoint is '/labs' not '/labs'
    apiClient
    .get("/labs")
    .then((res) => res.data)
    .then((data) => {
      const transformedData = Array.isArray(data)
      ? data.map((lab: any) => ({
        ...lab,
        tags: typeof lab.tags === 'string'
      ? lab.tags.split(',').map((tag: string) => tag.trim())
      : lab.tags || [],
      time: lab.time || lab.time_estimate || '60 min',
      participants: lab.participants || 0,
      completed: lab.completed || false,
      featured: lab.featured || false
      }))
      : [];
      setLabs(transformedData);
    })
    .catch((err) => {
      console.error("Error fetching labs:", err);
      setError("Failed to load labs. Please try again.");
      setLabs([]);
    })
    .finally(() => {
      setLoading(false);
    });
  };

  // FIXED: Function to start a lab matching your backend API
  const handleStartLab = async (labId: string, labTitle: string) => {
    setStartingLabId(labId);
    setError(null);

    try {
      console.log(`Starting lab: ${labTitle} (ID: ${labId})`);

      //  Your backend uses PUT method, not POST
      const response = await apiClient.put(`/labs/start/${labId}`);

      console.log('Lab start response:', response.data);

      if (response.data) {
        // Store lab session info
        const labSession = {
          labId: labId,
          labTitle: labTitle,
          sessionId: response.data.session_id,
          url: response.data.url,
          expiresIn: response.data.expires_in,
          startedAt: new Date().toISOString()
        };

        localStorage.setItem(`lab_${labId}_session`, JSON.stringify(labSession));

        // Navigate to the lab workspace page with session info
        navigate(`/lab/${labId}/workspace`, {
          state: {
            labSession,
            lab: {
              title: labTitle,
              id: labId,
              url: response.data.url
            }
          }
        });
      }
    } catch (err: any) {
      console.error('Error starting lab:', err);

      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 404) {
        setError('Lab not found.');
      } else if (err.response?.status === 500) {
        setError('Docker service unavailable. Please try again later.');
      } else {
        setError(err.response?.data?.detail || 'Failed to start lab. Please try again.');
      }

      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setStartingLabId(null);
    }
  };

  const categories = [
    { id: 'all', name: 'All Categories', count: labs.length },
    { id: 'web', name: 'Web Exploitation', count: labs.filter(lab => lab.category === 'web').length },
    { id: 'crypto', name: 'Cryptography', count: labs.filter(lab => lab.category === 'crypto').length },
    { id: 'osint', name: 'OSINT', count: labs.filter(lab => lab.category === 'osint').length },
    { id: 'forensics', name: 'Digital Forensics', count: labs.filter(lab => lab.category === 'forensics').length },
    { id: 'reverse', name: 'Reverse Engineering', count: labs.filter(lab => lab.category === 'reverse').length },
  ];

  const difficulties = [
    { id: 'all', name: 'All Levels' },
    { id: 'beginner', name: 'Beginner', color: 'cyber-green' },
    { id: 'intermediate', name: 'Intermediate', color: 'cyber-blue' },
    { id: 'advanced', name: 'Advanced', color: 'cyber-purple' },
    { id: 'expert', name: 'Expert', color: 'red-500' }
  ];

  const getDifficultyColor = (difficulty: string) => {
    const diff = difficulties.find(d => d.id === difficulty);
    return diff?.color || 'gray-400';
  };

  const filteredLabs = labs.filter((lab) => {
    const matchesSearch = lab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lab.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lab.tags && lab.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesCategory = selectedCategory === 'all' || lab.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || lab.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-green mx-auto mb-4"></div>
      <p className="text-cyber-green font-cyber">Loading labs...</p>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
    <div className="max-w-7xl mx-auto">
    {/* Header */}
    <div className="flex justify-between items-center mb-12 animate-fade-in">
    <div>
    <h1 className="text-4xl font-orbitron font-bold text-cyber-green mb-2">Cyber Labs</h1>
    <p className="text-gray-400 font-cyber">Sharpen your skills with hands-on cybersecurity challenges</p>
    </div>
    </div>

    {/* Error Message */}
    {error && (
      <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-500 text-center animate-fade-in">
       {error}
      </div>
    )}

    {/* Search and Filters */}
    <div className="mb-8 animate-slide-up">
    <div className="flex flex-col lg:flex-row gap-4 mb-6">
    {/* Search */}
    <div className="flex-1 relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
    type="text"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    placeholder="Search labs, topics, or tags..."
    className="w-full bg-cyber-dark/50 border border-cyber-green/30 rounded-lg pl-10 pr-4 py-3 text-white font-cyber focus:border-cyber-green focus:outline-none focus:ring-2 focus:ring-cyber-green/20 transition-all"
    />
    </div>

    {/* Category Filter */}
    <select
    value={selectedCategory}
    onChange={(e) => setSelectedCategory(e.target.value)}
    className="bg-cyber-dark/50 border border-cyber-green/30 rounded-lg px-4 py-3 text-white font-cyber focus:border-cyber-green focus:outline-none focus:ring-2 focus:ring-cyber-green/20 transition-all"
    >
    {categories.map(category => (
      <option key={category.id} value={category.id} className="bg-cyber-dark">
      {category.name} ({category.count})
      </option>
    ))}
    </select>

    {/* Difficulty Filter */}
    <select
    value={selectedDifficulty}
    onChange={(e) => setSelectedDifficulty(e.target.value)}
    className="bg-cyber-dark/50 border border-cyber-green/30 rounded-lg px-4 py-3 text-white font-cyber focus:border-cyber-green focus:outline-none focus:ring-2 focus:ring-cyber-green/20 transition-all"
    >
    {difficulties.map(difficulty => (
      <option key={difficulty.id} value={difficulty.id} className="bg-cyber-dark">
      {difficulty.name}
      </option>
    ))}
    </select>
    </div>

    {/* Results Counter */}
    <div className="text-gray-400 font-cyber">
    Showing {filteredLabs.length} of {labs.length} labs
    </div>
    </div>

    {/* Labs Grid */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {filteredLabs.map((lab) => (
      <div
      key={lab.id}
      className={`bg-cyber-card backdrop-blur-md border rounded-lg p-6 hover:border-cyber-green/50 transition-all transform hover:scale-105 hover:shadow-xl hover:shadow-cyber-green/20 group relative ${
        lab.featured ? 'border-cyber-green/40' : 'border-cyber-green/20'
      }`}
      >
      {/* Featured Badge */}
      {lab.featured && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-cyber-blue to-cyber-purple p-2 rounded-full">
        <Star className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Completed Badge */}
      {lab.completed && (
        <div className="absolute top-4 right-4 bg-cyber-green p-1 rounded-full">
        <Trophy className="w-4 h-4 text-cyber-dark" />
        </div>
      )}

      {/* Lab Header */}
      <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
      <span className={`text-xs font-cyber px-2 py-1 rounded-full bg-${getDifficultyColor(lab.difficulty)}/20 text-${getDifficultyColor(lab.difficulty)} border border-${getDifficultyColor(lab.difficulty)}/30`}>
      {lab.difficulty.toUpperCase()}
      </span>
      <span className="text-xs font-cyber text-gray-400 uppercase">
      {categories.find(c => c.id === lab.category)?.name || lab.category}
      </span>
      </div>
      <h3 className="text-xl font-orbitron font-bold text-white mb-2 group-hover:text-cyber-green transition-colors">
      {lab.title}
      </h3>
      <p className="text-gray-400 font-cyber text-sm">
      {lab.description}
      </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
      {lab.tags && lab.tags.map((tag, index) => (
        <span
        key={index}
        className="text-xs font-cyber px-2 py-1 bg-cyber-dark/50 text-cyber-blue rounded border border-cyber-blue/30"
        >
        {tag}
        </span>
      ))}
      </div>

      {/* Lab Stats */}
      <div className="flex items-center justify-between mb-6 text-sm font-cyber text-gray-400">
      <div className="flex items-center gap-1">
      <Clock className="w-4 h-4" />
      {lab.time}
      </div>
      <div className="flex items-center gap-1">
      <Zap className="w-4 h-4" />
      {lab.points} XP
      </div>
      <div className="flex items-center gap-1">
      <Users className="w-4 h-4" />
      {lab.participants}
      </div>
      </div>

      {/* Start Button */}
      <button
      onClick={() => handleStartLab(lab.id, lab.title)}
      disabled={startingLabId === lab.id}
      className={`w-full py-3 rounded-lg font-orbitron font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
        lab.completed
        ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30 hover:bg-cyber-green hover:text-cyber-dark'
        : 'bg-gradient-to-r from-cyber-green to-cyber-blue hover:shadow-lg hover:shadow-cyber-green/50'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
      {startingLabId === lab.id ? (
        <>
        <Loader2 className="w-5 h-5 animate-spin" />
        Starting Container...
        </>
      ) : (
        <>
        <Play className="w-5 h-5" />
        {lab.completed ? 'Review Lab' : 'Start Lab'}
        </>
      )}
      </button>
      </div>
    ))}
    </div>

    {/* Empty State */}
    {filteredLabs.length === 0 && (
      <div className="text-center py-20">
      <div className="w-24 h-24 bg-cyber-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
      <Search className="w-12 h-12 text-cyber-green" />
      </div>
      <h3 className="text-xl font-orbitron font-bold text-gray-300 mb-2">No Labs Found</h3>
      <p className="text-gray-400 font-cyber">Try adjusting your search terms or filters</p>
      </div>
    )}
    </div>
    </div>
  );
};

export default Labs;
