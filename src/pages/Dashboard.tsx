import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Target, Star, TrendingUp, Activity, Award, Zap, BookOpen, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api';

interface ActivityItem {
  id: string;
  action: string;
  item_name: string;
  time_ago: string;
  xp_gained: number;
}

interface LeaderboardPlayer {
  rank: number;
  username: string;
  xp: number;
  avatar: string;
  highlight?: boolean;
}

interface UserStats {
  id: string;
  username: string;
  email: string;
  xps: number;
  labs_completed: number;
  current_streak: number;
  avatar_url: string | null;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user stats
      const userRes = await apiClient.get('/users/me');
      setUserStats(userRes.data);

      // Fetch leaderboard
      const leaderboardRes = await apiClient.get('/users/leaderboard');
      const leaderboardData = leaderboardRes.data.map((player: any) => ({
        ...player,
        highlight: player.username === user?.username
      }));
      setLeaderboard(leaderboardData);

      // Fetch activities
      const activitiesRes = await apiClient.get('/users/me/activities');
      setActivities(activitiesRes.data);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRank = leaderboard.findIndex(player => player.username === user?.username) + 1 || 0;

  const stats = [
    { label: 'Rank', value: userRank, icon: <Trophy className="w-5 h-5" />, color: 'cyber-blue' },
    { label: 'XP Points', value: userStats?.xps || 0, icon: <Star className="w-5 h-5" />, color: 'cyber-purple' },
    { label: 'Labs Completed', value: userStats?.labs_completed || 0, icon: <Target className="w-5 h-5" />, color: 'cyber-green' },
    { label: 'Streak', value: `${userStats?.current_streak || 0} days`, icon: <Zap className="w-5 h-5" />, color: 'cyber-blue' }
  ];

  // Badges based on actual achievements
  const badges = [
    {
      name: 'First Blood',
      description: 'Complete your first lab',
      color: 'bg-red-500',
      earned: (userStats?.labs_completed || 0) >= 1
    },
    {
      name: 'Speed Runner',
      description: 'Complete 10 labs',
      color: 'bg-cyber-blue',
      earned: (userStats?.labs_completed || 0) >= 10
    },
    {
      name: 'XP Hunter',
      description: 'Earn 1000 XP points',
      color: 'bg-cyber-green',
      earned: (userStats?.xps || 0) >= 1000
    },
    {
      name: 'Streak Master',
      description: '7 day streak',
      color: 'bg-cyber-purple',
      earned: (userStats?.current_streak || 0) >= 7
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
      <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-green mx-auto mb-4"></div>
      <p className="text-cyber-green font-cyber">Loading Mission Control...</p>
      </div>
      </div>
    );
  }

  if (!userStats) {
    return null;
  }

  return (
    <div className="min-h-screen py-20 px-4 bg-gradient-to-br from-black to-gray-900">
    <div className="max-w-7xl mx-auto">
    {/* Header */}
    <div className="flex justify-between items-center mb-12 animate-fade-in">
    <div>
    <h1 className="text-4xl font-orbitron font-bold text-cyber-blue mb-2">
    Mission Control
    </h1>
    <p className="text-gray-400 font-cyber">
    Welcome back, {userStats.username}! Track your progress and dominate the leaderboard
    </p>
    </div>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-slide-up">
    {stats.map((stat, index) => (
      <div
      key={index}
      className={`bg-cyber-card backdrop-blur-md border border-${stat.color}/20 rounded-lg p-6 hover:border-${stat.color}/50 transition-all transform hover:scale-105`}
      >
      <div className={`text-${stat.color} mb-3`}>
      {stat.icon}
      </div>
      <div className="text-3xl font-orbitron font-bold mb-1">{stat.value}</div>
      <div className="text-gray-400 font-cyber text-sm">{stat.label}</div>
      </div>
    ))}
    </div>

    <div className="grid lg:grid-cols-3 gap-8">
    {/* Recent Activity */}
    <div className="lg:col-span-2">
    <div className="bg-cyber-card backdrop-blur-md border border-cyber-blue/20 rounded-lg p-6">
    <div className="flex items-center gap-2 mb-6">
    <Activity className="w-5 h-5 text-cyber-blue" />
    <h2 className="text-xl font-orbitron font-bold">Recent Activity</h2>
    </div>
    <div className="space-y-4">
    {activities.length > 0 ? (
      activities.map((activity) => (
        <div
        key={activity.id}
        className="flex items-center justify-between p-4 bg-cyber-dark/30 rounded-lg hover:bg-cyber-dark/50 transition-all"
        >
        <div className="flex items-center gap-4">
        <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
        <div>
        <p className="font-cyber">
        <span className="text-cyber-blue">{activity.action}</span> {activity.item_name}
        </p>
        <p className="text-gray-500 text-sm">{activity.time_ago}</p>
        </div>
        </div>
        {activity.xp_gained > 0 && (
          <div className="text-cyber-green font-cyber font-bold">+{activity.xp_gained} XP</div>
        )}
        </div>
      ))
    ) : (
      <p className="text-gray-400 text-center py-8">
      No recent activity yet. Start completing labs!
      </p>
    )}
    </div>
    </div>

    {/* Progress Overview */}
    <div className="bg-cyber-card backdrop-blur-md border border-cyber-purple/20 rounded-lg p-6 mt-8">
    <div className="flex items-center gap-2 mb-6">
    <TrendingUp className="w-5 h-5 text-cyber-purple" />
    <h2 className="text-xl font-orbitron font-bold">Progress Overview</h2>
    </div>
    <div className="space-y-6">
    <div>
    <div className="flex justify-between mb-2">
    <span className="font-cyber">Overall Progress</span>
    <span className="text-cyber-purple font-cyber">
    {Math.min(Math.round(((userStats.labs_completed || 0) / 20) * 100), 100)}%
    </span>
    </div>
    <div className="w-full bg-cyber-dark/50 rounded-full h-2">
    <div
    className="bg-gradient-to-r from-cyber-purple to-cyber-blue h-2 rounded-full transition-all"
    style={{ width: `${Math.min(((userStats.labs_completed || 0) / 20) * 100, 100)}%` }}
    ></div>
    </div>
    </div>
    <div>
    <div className="flex justify-between mb-2">
    <span className="font-cyber">XP Progress</span>
    <span className="text-cyber-green font-cyber">
    {Math.min(Math.round(((userStats.xps || 0) / 5000) * 100), 100)}%
    </span>
    </div>
    <div className="w-full bg-cyber-dark/50 rounded-full h-2">
    <div
    className="bg-gradient-to-r from-cyber-green to-cyber-blue h-2 rounded-full transition-all"
    style={{ width: `${Math.min(((userStats.xps || 0) / 5000) * 100, 100)}%` }}
    ></div>
    </div>
    </div>
    </div>
    </div>
    </div>

    {/* Sidebar */}
    <div className="space-y-8">
    {/* Badges */}
    <div className="bg-cyber-card backdrop-blur-md border border-cyber-green/20 rounded-lg p-6">
    <div className="flex items-center gap-2 mb-6">
    <Award className="w-5 h-5 text-cyber-green" />
    <h2 className="text-xl font-orbitron font-bold">Achievements</h2>
    </div>
    <div className="space-y-4">
    {badges.map((badge, index) => (
      <div key={index} className={`flex items-center gap-3 ${!badge.earned ? 'opacity-50 grayscale' : ''}`}>
      <div className={`w-8 h-8 ${badge.color} rounded-full flex items-center justify-center`}>
      <Award className="w-4 h-4 text-white" />
      </div>
      <div>
      <p className="font-cyber font-bold">{badge.name}</p>
      <p className="text-gray-400 text-sm">{badge.description}</p>
      </div>
      {badge.earned && <div className="ml-auto text-cyber-green text-xs">✓</div>}
      </div>
    ))}
    </div>
    </div>

    {/* Leaderboard */}
    <div className="bg-cyber-card backdrop-blur-md border border-cyber-blue/20 rounded-lg p-6">
    <div className="flex items-center gap-2 mb-6">
    <Trophy className="w-5 h-5 text-cyber-blue" />
    <h2 className="text-xl font-orbitron font-bold">Leaderboard</h2>
    <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse ml-auto"></div>
    </div>
    <div className="space-y-3 max-h-96 overflow-y-auto">
    {leaderboard.length > 0 ? (
      leaderboard.map((player, index) => (
        <div
        key={index}
        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
          player.highlight
          ? 'bg-cyber-blue/20 border border-cyber-blue/50'
          : 'bg-cyber-dark/30 hover:bg-cyber-dark/50'
        }`}
        >
        <div className={`text-sm font-bold ${player.rank <= 3 ? 'text-cyber-green' : 'text-gray-400'}`}>
        #{player.rank}
        </div>
        <div className="w-8 h-8 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-full flex items-center justify-center text-xs font-bold">
        {player.avatar}
        </div>
        <div className="flex-1">
        <p className="font-cyber font-bold">{player.username}</p>
        </div>
        <div className="text-cyber-green font-cyber text-sm font-bold">{player.xp} XP</div>
        </div>
      ))
    ) : (
      <p className="text-gray-400 text-center py-4">No leaderboard data yet</p>
    )}
    </div>
    </div>
    </div>
    </div>
    </div>
    </div>
  );
};

export default Dashboard;
