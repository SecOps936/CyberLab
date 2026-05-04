import React, { useState, useEffect } from 'react';
import { Clock, Trophy, Zap, Users, Target, Star, Crown, Medal, Award, RefreshCw, CheckCircle, XCircle, Download, FileText, Calendar, Award as AwardIcon } from 'lucide-react';
import apiClient from '../api';

interface TournamentData {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  prize_pool: number;
  total_participants: number;
  total_challenges: number;
  status: string;
  time_left?: number;
  time_until_start?: number;
}

interface Challenge {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  points: number;
  solved: number;
  solved_by_user: boolean;
  description: string;
  objectives: string[];
  author_name: string;
  status: string;
  file_url?: string;
  file_name?: string;
}

interface LeaderboardPlayer {
  rank: number;
  name: string;
  score: number;
  avatar: string;
  country: string;
  streak: number;
}

interface TournamentStats {
  total_participants: number;
  challenges_solved: number;
  total_challenges: number;
  prize_pool: number;
  your_rank: number;
  is_ended?: boolean;
}

const Tournament: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeDisplay, setTimeDisplay] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [submittedFlag, setSubmittedFlag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{correct: boolean, message: string} | null>(null);

  const fetchTournamentData = async () => {
    try {
      setRefreshing(true);
      const [tournamentRes, challengesRes, leaderboardRes, statsRes] = await Promise.all([
        apiClient.get('/tournament/active'),
                                                                                         apiClient.get('/tournament/challenges'),
                                                                                         apiClient.get('/tournament/leaderboard'),
                                                                                         apiClient.get('/tournament/stats')
      ]);
      setTournament(tournamentRes.data);
      setChallenges(challengesRes.data);
      setLeaderboard(leaderboardRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching tournament data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmitFlag = async (challengeId: string) => {
    if (!submittedFlag.trim()) {
      setSubmissionResult({ correct: false, message: 'Please enter a flag' });
      setTimeout(() => setSubmissionResult(null), 3000);
      return;
    }
    setSubmitting(true);
    try {
      const response = await apiClient.post('/flags/submit/tournament', {
        challenge_id: challengeId,
        flag: submittedFlag
      });
      setSubmissionResult(response.data);
      setSubmittedFlag('');
      if (response.data.correct) fetchTournamentData();
      setTimeout(() => setSubmissionResult(null), 5000);
    } catch (err) {
      setSubmissionResult({ correct: false, message: 'Error submitting flag' });
    } finally {
      setSubmitting(false);
    }
  };

  const joinTournament = async () => {
    try {
      await apiClient.post('/tournament/join');
      fetchTournamentData();
    } catch (err) {
      console.error('Error joining tournament:', err);
    }
  };

  const updateTimeDisplay = () => {
    if (!tournament) return;
    if (tournament.status === 'upcoming' && tournament.time_until_start) {
      const seconds = tournament.time_until_start;
      setTimeDisplay({
        days: Math.floor(seconds / 86400),
                     hours: Math.floor((seconds % 86400) / 3600),
                     minutes: Math.floor((seconds % 3600) / 60),
                     seconds: seconds % 60
      });
    } else if (tournament.status === 'active' && tournament.time_left) {
      const seconds = tournament.time_left;
      setTimeDisplay({
        days: Math.floor(seconds / 86400),
                     hours: Math.floor((seconds % 86400) / 3600),
                     minutes: Math.floor((seconds % 3600) / 60),
                     seconds: seconds % 60
      });
    }
  };

  useEffect(() => {
    fetchTournamentData();
  }, []);

  useEffect(() => {
    updateTimeDisplay();
    const timer = setInterval(() => {
      if (tournament?.status === 'upcoming' && tournament.time_until_start) {
        tournament.time_until_start--;
        updateTimeDisplay();
      } else if (tournament?.status === 'active' && tournament.time_left) {
        tournament.time_left--;
        updateTimeDisplay();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [tournament]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'cyber-green';
      case 'intermediate': return 'cyber-blue';
      case 'advanced': return 'cyber-purple';
      case 'expert': return 'red-500';
      default: return 'gray-400';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2: return <Medal className="w-5 h-5 text-gray-300" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-gray-400 font-bold">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
      <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-green mx-auto mb-4"></div>
      <p className="text-cyber-green font-cyber">Loading Tournament Data...</p>
      </div>
      </div>
    );
  }

  const selectedChallenge = selectedTask ? challenges.find(c => c.id === selectedTask) : null;
  const isTournamentActive = tournament?.status === 'active';
  const isTournamentUpcoming = tournament?.status === 'upcoming';
  const isTournamentEnded = tournament?.status === 'ended';

  return (
    <div className="min-h-screen py-20 px-4 bg-gradient-to-br from-black to-gray-900">
    <div className="max-w-7xl mx-auto">
    {/* Header */}
    <div className="text-center mb-12 animate-fade-in">
    <div className="flex items-center justify-center gap-3 mb-4">
    <div className="p-3 bg-gradient-to-br from-cyber-purple to-cyber-blue rounded-lg animate-pulse">
    <Trophy className="w-8 h-8 text-white" />
    </div>
    </div>
    <h1 className="text-5xl font-orbitron font-black mb-4 bg-gradient-to-r from-cyber-purple via-cyber-blue to-cyber-green bg-clip-text text-transparent">
    {tournament?.title || 'CYBER WARFARE CHAMPIONSHIP'}
    </h1>
    <p className="text-xl text-gray-300 font-cyber mb-2">{tournament?.description}</p>
    <p className="text-gray-400 font-cyber">Compete against the world's best ethical hackers</p>

    {/* Simple Ended Status - Clean design */}
    {isTournamentEnded && (
      <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full">
      <AwardIcon className="w-4 h-4 text-red-400" />
      <span className="text-red-400 font-cyber text-sm">Tournament Ended</span>
      </div>
    )}

    {isTournamentActive && (
      <button onClick={joinTournament} className="mt-4 px-6 py-2 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg font-cyber text-sm hover:shadow-lg transition-all">
      Join Tournament
      </button>
    )}
    </div>

    {/* Timer Display */}
    {isTournamentUpcoming && (
      <div className="bg-cyber-card backdrop-blur-md border border-cyber-blue/30 rounded-lg p-8 mb-12 text-center">
      <h2 className="text-2xl font-orbitron font-bold text-cyber-blue mb-4">Tournament Starts In</h2>
      <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
      {[
        { label: 'Days', value: timeDisplay.days },
        { label: 'Hours', value: timeDisplay.hours },
        { label: 'Minutes', value: timeDisplay.minutes },
        { label: 'Seconds', value: timeDisplay.seconds }
      ].map((time, index) => (
        <div key={index} className="bg-cyber-dark/50 border border-cyber-blue/30 rounded-lg p-4">
        <div className="text-3xl font-orbitron font-bold text-cyber-blue">{time.value.toString().padStart(2, '0')}</div>
        <div className="text-sm font-cyber text-gray-400 uppercase">{time.label}</div>
        </div>
      ))}
      </div>
      <p className="text-gray-400 mt-4">Challenges will appear when tournament starts!</p>
      </div>
    )}

    {isTournamentActive && (
      <div className="bg-cyber-card backdrop-blur-md border border-cyber-purple/30 rounded-lg p-8 mb-12 text-center">
      <h2 className="text-2xl font-orbitron font-bold text-cyber-purple mb-4">Tournament Ends In</h2>
      <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
      {[
        { label: 'Days', value: timeDisplay.days },
        { label: 'Hours', value: timeDisplay.hours },
        { label: 'Minutes', value: timeDisplay.minutes },
        { label: 'Seconds', value: timeDisplay.seconds }
      ].map((time, index) => (
        <div key={index} className="bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg p-4">
        <div className="text-3xl font-orbitron font-bold text-cyber-purple">{time.value.toString().padStart(2, '0')}</div>
        <div className="text-sm font-cyber text-gray-400 uppercase">{time.label}</div>
        </div>
      ))}
      </div>
      </div>
    )}

    {/* Simple ended info line - Clean and minimal */}
    {isTournamentEnded && (
      <div className="flex items-center justify-center gap-2 mb-8 text-gray-400">
      <Calendar className="w-4 h-4" />
      </div>
    )}

    <div className="grid lg:grid-cols-3 gap-8">
    {/* Challenges Grid - Hide when tournament ended */}
    <div className="lg:col-span-2">
    <h2 className="text-2xl font-orbitron font-bold text-cyber-blue flex items-center gap-2 mb-6">
    <Target className="w-6 h-6" /> Tournament Challenges
    </h2>
    {!isTournamentEnded && challenges.length > 0 ? (
      <div className="grid md:grid-cols-2 gap-6">
      {challenges.map((task) => (
        <div
        key={task.id}
        onClick={() => setSelectedTask(task.id)}
        className={`bg-cyber-card backdrop-blur-md border rounded-lg p-6 cursor-pointer transition-all transform hover:scale-105 hover:shadow-xl group ${
          task.solved_by_user
          ? 'border-cyber-green/50 bg-cyber-green/5'
          : 'border-cyber-green/20'
        }`}
        >
        <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
        <span className={`text-xs font-cyber px-2 py-1 rounded-full bg-${getDifficultyColor(task.difficulty)}/20 text-${getDifficultyColor(task.difficulty)} border border-${getDifficultyColor(task.difficulty)}/30`}>
        {task.difficulty.toUpperCase()}
        </span>
        <span className="text-xs font-cyber text-cyber-purple">
        by {task.author_name || 'Anonymous'}
        </span>
        </div>
        <div className="flex items-center gap-1 text-cyber-green font-cyber font-bold">
        <Zap className="w-4 h-4" /> {task.points}
        </div>
        </div>
        <h3 className="text-lg font-orbitron font-bold text-white mb-2 group-hover:text-cyber-blue transition-colors">
        {task.title}
        {task.solved_by_user && (
          <CheckCircle className="w-4 h-4 inline ml-2 text-cyber-green" />
        )}
        </h3>
        <p className="text-gray-400 font-cyber text-sm mb-4">{task.category}</p>
        <div className="flex items-center justify-between text-sm font-cyber text-gray-400">
        <div className="flex items-center gap-1">
        <Users className="w-4 h-4" />
        <span>{task.solved} users solved</span>
        </div>
        {task.solved_by_user && (
          <div className="flex items-center gap-1 text-cyber-green">
          <CheckCircle className="w-3 h-3" />
          <span className="text-xs">Completed</span>
          </div>
        )}
        </div>
        {task.file_url && (
          <div className="mt-2 text-xs text-cyber-blue flex items-center gap-1">
          <FileText className="w-3 h-3" /> File attached
          </div>
        )}
        </div>
      ))}
      </div>
    ) : !isTournamentEnded && challenges.length === 0 ? (
      <div className="text-center py-20 bg-cyber-card backdrop-blur-md rounded-lg">
      <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
      <p className="text-gray-400">No challenges available yet. {isTournamentUpcoming ? 'Tournament starting soon!' : 'Check back later!'}</p>
      </div>
    ) : null}

    {/* Show message when tournament ended - Clean design */}
    {isTournamentEnded && (
      <div className="text-center py-20 bg-cyber-card backdrop-blur-md rounded-lg border border-gray-700/30">
      <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-40" />
      <p className="text-gray-500 font-cyber">Challenges are no longer available</p>
      <p className="text-gray-600 text-sm mt-2">This tournament has ended</p>
      </div>
    )}
    </div>

    {/* Leaderboard - Always visible */}
    <div className="space-y-6">
    <div className="bg-cyber-card backdrop-blur-md border border-cyber-blue/20 rounded-lg p-6">
    <div className="flex items-center gap-2 mb-6">
    <Trophy className="w-5 h-5 text-cyber-blue" />
    <h2 className="text-xl font-orbitron font-bold">Leaderboard</h2>
    {isTournamentEnded && (
      <span className="ml-2 text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full">Final</span>
    )}
    <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse ml-auto"></div>
    </div>
    <div className="space-y-3">
    {leaderboard.slice(0, 10).map((player, index) => (
      <div key={index} className={`flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-cyber-dark/30 ${player.rank <= 3 ? 'bg-gradient-to-r from-cyber-dark/20 to-transparent border border-cyber-blue/20' : ''}`}>
      <div className="flex items-center justify-center w-8">{getRankIcon(player.rank)}</div>
      <div className="w-8 h-8 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-full flex items-center justify-center text-xs font-bold">{player.avatar}</div>
      <div className="flex-1"><p className="font-cyber font-bold text-white">{player.name}</p></div>
      <div className="text-cyber-green font-cyber text-sm font-bold">{player.score} pts</div>
      </div>
    ))}
    </div>
    </div>

    {stats && (
      <div className="bg-cyber-card backdrop-blur-md border border-cyber-purple/20 rounded-lg p-6">
      <h3 className="text-lg font-orbitron font-bold text-cyber-purple mb-4">Tournament Stats</h3>
      <div className="space-y-4">
      <div className="flex justify-between items-center">
      <span className="font-cyber text-gray-300">Total Participants</span>
      <span className="font-cyber font-bold text-cyber-purple">{stats.total_participants}</span>
      </div>
      <div className="flex justify-between items-center">
      <span className="font-cyber text-gray-300">Challenges Solved</span>
      <span className="font-cyber font-bold text-cyber-green">{stats.challenges_solved} / {stats.total_challenges}</span>
      </div>
      <div className="flex justify-between items-center">
      <span className="font-cyber text-gray-300">Prize Pool</span>
      <span className="font-cyber font-bold text-cyber-blue">${stats.prize_pool}</span>
      </div>
      <div className="flex justify-between items-center">
      <span className="font-cyber text-gray-300">Your Rank</span>
      <span className="font-cyber font-bold text-cyber-green">#{stats.your_rank}</span>
      </div>
      </div>
      </div>
    )}
    </div>
    </div>

    {/* Challenge Details Modal - Only show if tournament active */}
    {selectedChallenge && isTournamentActive && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-cyber-card backdrop-blur-md border border-cyber-green/20 rounded-lg p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-orbitron font-bold text-cyber-green">Challenge Details</h3>
      <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-cyber-green transition-colors text-2xl">✕</button>
      </div>
      <h4 className="font-orbitron font-bold text-white mb-2">{selectedChallenge.title}</h4>
      <p className="text-gray-400 text-sm mb-2">Created by: <span className="text-cyber-purple">{selectedChallenge.author_name || 'Anonymous'}</span></p>
      <p className="text-gray-300 font-cyber mb-4">{selectedChallenge.description}</p>

      {selectedChallenge.file_url && (
        <div className="mb-4 p-4 bg-cyber-dark/30 rounded-lg border border-cyber-blue/30">
        <h5 className="font-cyber font-bold text-cyber-blue mb-2 flex items-center gap-2">
        <Download className="w-4 h-4" /> Challenge Files
        </h5>
        <a
        href={selectedChallenge.file_url}
        download
        className="flex items-center gap-2 text-cyber-green hover:text-cyber-blue transition-colors"
        >
        <FileText className="w-4 h-4" />
        Download: {selectedChallenge.file_name || 'Challenge File'}
        </a>
        </div>
      )}

      <h5 className="font-cyber font-bold text-cyber-green mb-2">Objectives:</h5>
      <ul className="space-y-2 mb-6">
      {selectedChallenge.objectives.map((objective, index) => (
        <li key={index} className="flex items-start gap-2 text-gray-300 font-cyber text-sm">
        <div className="w-1.5 h-1.5 bg-cyber-green rounded-full mt-2 flex-shrink-0"></div>
        {objective}
        </li>
      ))}
      </ul>

      <div className="mb-4 p-3 bg-cyber-dark/30 rounded-lg">
      <p className="text-gray-400 text-sm flex items-center gap-2">
      <Users className="w-4 h-4" />
      <span>{selectedChallenge.solved} users have solved this challenge</span>
      </p>
      </div>

      <div className="mt-6 p-4 bg-cyber-dark/30 rounded-lg border border-cyber-purple/30">
      <h5 className="font-cyber font-bold text-cyber-purple mb-3">Submit Flag</h5>
      {selectedChallenge.status === 'completed' || selectedChallenge.solved_by_user ? (
        <div className="text-center text-cyber-green py-2">
        <CheckCircle className="w-6 h-6 inline mr-2" />
        You have already completed this challenge!
        </div>
      ) : (
        <>
        <div className="flex gap-3">
        <input
        type="text"
        placeholder="Enter the flag (format: flag{...})"
        value={submittedFlag}
        onChange={(e) => setSubmittedFlag(e.target.value)}
        className="flex-1 bg-cyber-dark/50 border border-cyber-green/30 rounded-lg px-4 py-2 text-white font-mono placeholder-gray-500 focus:border-cyber-purple focus:outline-none"
        />
        <button
        onClick={() => handleSubmitFlag(selectedChallenge.id)}
        disabled={submitting}
        className="px-6 py-2 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg font-cyber hover:shadow-lg transition-all disabled:opacity-50"
        >
        {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Submit Flag'}
        </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Hint: Find the flag within the challenge!</p>
        </>
      )}
      </div>
      {submissionResult && (
        <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${submissionResult.correct ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'}`}>
        {submissionResult.correct ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
        <p className={submissionResult.correct ? 'text-green-500' : 'text-red-500'}>{submissionResult.message}</p>
        </div>
      )}
      </div>
      </div>
    )}
    </div>
    </div>
  );
};

export default Tournament;
