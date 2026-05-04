import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trophy, Target, Star, Activity, Award, Zap, BookOpen,
    LogOut, Users, Shield, Flag, Plus, Edit, Trash2, RefreshCw,
    Settings, BarChart, Calendar, CheckCircle, XCircle, Clock,
    Upload, FileText, Eye, EyeOff, Lock, Unlock, Crown, Medal,
    TrendingUp, AlertCircle, Server, Database, Terminal, Hash,
    Filter, Search, ChevronDown, ChevronUp, Download, Printer,
    UserPlus, UserCheck, UserX
} from 'lucide-react';
import apiClient from '../api';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [labs, setLabs] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [tournament, setTournament] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [challenges, setChallenges] = useState<any[]>([]);
    const [allFlags, setAllFlags] = useState<any[]>([]);
    const [showCreateLab, setShowCreateLab] = useState(false);
    const [showCreateChallenge, setShowCreateChallenge] = useState(false);
    const [showFlagModal, setShowFlagModal] = useState(false);
    const [showEditFlagModal, setShowEditFlagModal] = useState(false);
    const [editingFlag, setEditingFlag] = useState<any>(null);
    const [editedFlagValue, setEditedFlagValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userChallenges, setUserChallenges] = useState<any[]>([]);
    const [showUserDetails, setShowUserDetails] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [newLab, setNewLab] = useState({
        id: '',
        title: '',
        category: 'web',
        difficulty: 'beginner',
        points: 100,
        description: '',
        docker_image: 'vulnerables/web-dvwa:latest',
        docker_port: 80,
        tags: '',
        featured: false
    });

    const [newChallenge, setNewChallenge] = useState({
        title: '',
        category: 'web',
        difficulty: 'intermediate',
        points: 300,
        description: '',
        objectives: '',
        flag: '',
        author_name: ''
    });

    const [newFlag, setNewFlag] = useState({
        challenge_type: 'lab',
        challenge_id: '',
        flag: ''
    });

    useEffect(() => {
        checkAdminAccess();
        fetchDashboardData();
        fetchAllFlags();
    }, []);

    const checkAdminAccess = async () => {
        try {
            await apiClient.get('/staff/verify');
            console.log('Admin access verified');
        } catch (err) {
            console.error('Not authorized as admin');
            navigate('/dashboard');
        }
    };

    const fetchAllFlags = async () => {
        try {
            const response = await apiClient.get('/flags/admin/flags');
            setAllFlags(response.data || []);
        } catch (err) {
            console.error('Error fetching flags:', err);
        }
    };

    const fetchDashboardData = async () => {
        try {
            setRefreshing(true);
            setLoading(true);
            setError(null);

            console.log('Fetching dashboard data...');

            const [labsRes, usersRes, tournamentRes, leaderboardRes, challengesRes] = await Promise.all([
                apiClient.get('/staff/labs/all'),
                                                                                                        apiClient.get('/staff/users/all'),
                                                                                                        apiClient.get('/staff/tournaments/active'),
                                                                                                        apiClient.get('/tournament/leaderboard'),
                                                                                                        apiClient.get('/staff/tournament/challenges')
            ]);

            console.log('Labs response:', labsRes.data);
            console.log('Users response:', usersRes.data);
            console.log('Tournament response:', tournamentRes.data);
            console.log('Challenges response:', challengesRes.data);

            setLabs(labsRes.data || []);
            setUsers(usersRes.data || []);
            setTournament(tournamentRes.data);
            setLeaderboard(leaderboardRes.data || []);
            setChallenges(challengesRes.data || []);

            const totalParticipants = tournamentRes.data?.stats?.total_participants || 0;
            const totalSubmissions = tournamentRes.data?.stats?.total_submissions || 0;
            const correctSubmissions = tournamentRes.data?.stats?.correct_submissions || 0;

            setStats({
                totalLabs: (labsRes.data || []).length,
                     totalUsers: (usersRes.data || []).length,
                     staffCount: (usersRes.data || []).filter((u: any) => u.role === 'staff').length,
                     totalParticipants: totalParticipants,
                     totalSubmissions: totalSubmissions,
                     successRate: tournamentRes.data?.stats?.success_rate || 0,
                     activeTournament: !!tournamentRes.data?.tournament,
                     totalChallenges: (challengesRes.data || []).length
            });

        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchUserChallenges = async (userId: string) => {
        try {
            const response = await apiClient.get(`/staff/users/${userId}/challenges`);
            setUserChallenges(response.data || []);
        } catch (err) {
            console.error('Error fetching user challenges:', err);
            setUserChallenges([]);
        }
    };

    const handleViewUser = async (user: any) => {
        setSelectedUser(user);
        await fetchUserChallenges(user.id);
        setShowUserDetails(true);
    };

    const handleRefresh = () => {
        fetchDashboardData();
        fetchAllFlags();
    };

    const handleCreateLab = async () => {
        if (!newLab.title) {
            alert('Please enter a lab title');
            return;
        }

        try {
            const labData = {
                id: newLab.id || crypto.randomUUID(),
                title: newLab.title,
                category: newLab.category,
                difficulty: newLab.difficulty,
                points: newLab.points,
                description: newLab.description,
                docker_image: newLab.docker_image,
                docker_port: newLab.docker_port,
                tags: newLab.tags.split(',').map(t => t.trim()),
                time: '60 min',
                participants: 0,
                completed: false,
                featured: newLab.featured,
                long_description: newLab.description,
                objectives: ['Learn security concepts'],
                prerequisites: ['Basic knowledge'],
                hints: [],
                tools: ['Browser', 'Terminal'],
                environment: 'Docker container'
            };

            await apiClient.post('/staff/labs/create', labData);
            alert('Lab created successfully!');
            setShowCreateLab(false);
            setNewLab({
                id: '', title: '', category: 'web', difficulty: 'beginner',
                points: 100, description: '', docker_image: 'vulnerables/web-dvwa:latest',
                docker_port: 80, tags: '', featured: false
            });
            fetchDashboardData();
        } catch (err: any) {
            console.error('Error creating lab:', err);
            alert(err.response?.data?.detail || 'Failed to create lab');
        }
    };

    const handleAddFlag = async () => {
        if (!newFlag.challenge_id || !newFlag.flag) {
            alert('Please enter challenge ID and flag');
            return;
        }

        try {
            await apiClient.post(`/staff/labs/${newFlag.challenge_id}/flag`, {
                flag: newFlag.flag
            });
            alert('Flag added successfully!');
            setShowFlagModal(false);
            setNewFlag({ challenge_type: 'lab', challenge_id: '', flag: '' });
            fetchDashboardData();
        } catch (err) {
            console.error('Error adding flag:', err);
            alert('Failed to add flag');
        }
    };

    const handleUpdateUserRole = async (userId: string, role: string) => {
        try {
            await apiClient.put(`/users/${userId}/role`, { role });
            alert(`User role updated to ${role}`);
            fetchDashboardData();
        } catch (err) {
            console.error('Error updating role:', err);
            alert('Failed to update role');
        }
    };

    const handleEditFlag = async (flagId: string) => {
        if (!editedFlagValue) {
            alert('Please enter a flag value');
            return;
        }

        try {
            await apiClient.put(`/flags/admin/flags/${flagId}`, {
                flag: editedFlagValue
            });
            alert('Flag updated successfully!');
            setShowEditFlagModal(false);
            setEditingFlag(null);
            setEditedFlagValue('');
            fetchAllFlags();
            fetchDashboardData();
        } catch (err) {
            console.error('Error updating flag:', err);
            alert('Failed to update flag');
        }
    };

    const handleDeleteLab = async (labId: string, labTitle: string) => {
        if (confirm(`Are you sure you want to delete lab "${labTitle}"? This action cannot be undone!`)) {
            try {
                await apiClient.delete(`/staff/labs/${labId}`);
                alert('Lab deleted successfully!');
                fetchDashboardData();
            } catch (err: any) {
                console.error('Error deleting lab:', err);
                alert(err.response?.data?.detail || 'Failed to delete lab');
            }
        }
    };

    const handleDeleteChallenge = async (challengeId: string, challengeTitle: string) => {
        if (confirm(`Are you sure you want to delete challenge "${challengeTitle}"? This will also delete the flag!`)) {
            try {
                await apiClient.delete(`/staff/tournaments/challenges/${challengeId}`);
                alert('Challenge deleted successfully!');
                fetchDashboardData();
                fetchAllFlags();
            } catch (err: any) {
                console.error('Error deleting challenge:', err);
                alert(err.response?.data?.detail || 'Failed to delete challenge');
            }
        }
    };

    const handleDeleteTournament = async (tournamentId: string, tournamentTitle: string) => {
        if (confirm(` Are you sure you want to delete tournament "${tournamentTitle}"? This will delete ALL challenges, flags, and submissions! This cannot be undone!`)) {
            try {
                await apiClient.delete(`/staff/tournaments/${tournamentId}`);
                alert('Tournament deleted successfully!');
                fetchDashboardData();
            } catch (err: any) {
                console.error('Error deleting tournament:', err);
                alert(err.response?.data?.detail || 'Failed to delete tournament');
            }
        }
    };

    const handleCreateChallenge = async () => {
        if (!newChallenge.title || !newChallenge.description || !newChallenge.flag) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const tournamentId = tournament?.tournament?.id;
            if (!tournamentId) {
                alert('No active tournament found. Please create a tournament first.');
                return;
            }

            const formData = new FormData();
            formData.append('tournament_id', tournamentId);
            formData.append('title', newChallenge.title);
            formData.append('category', newChallenge.category);
            formData.append('difficulty', newChallenge.difficulty);
            formData.append('points', newChallenge.points.toString());
            formData.append('description', newChallenge.description);
            formData.append('objectives', newChallenge.objectives);
            formData.append('flag', newChallenge.flag);
            formData.append('author_name', newChallenge.author_name || 'Admin');

            const fileInput = document.getElementById('challengeFile') as HTMLInputElement;
            if (fileInput && fileInput.files && fileInput.files[0]) {
                formData.append('file', fileInput.files[0]);
            }

            const response = await apiClient.post('/staff/tournaments/challenges_with_file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.challenge_id) {
                alert('Challenge created successfully!');
                setShowCreateChallenge(false);
                setNewChallenge({
                    title: '', category: 'web', difficulty: 'intermediate',
                    points: 300, description: '', objectives: '', flag: '', author_name: ''
                });
                if (fileInput) fileInput.value = '';
                fetchDashboardData();
                fetchAllFlags();
            }
        } catch (err: any) {
            console.error('Error creating challenge:', err);
            alert(err.response?.data?.detail || 'Failed to create challenge');
        }
    };

    const createTournament = async () => {
        const title = (document.getElementById('tournamentTitle') as HTMLInputElement)?.value;
        const prizePool = (document.getElementById('prizePool') as HTMLInputElement)?.value;
        const startDate = (document.getElementById('tournamentStartDate') as HTMLInputElement)?.value;
        const endDate = (document.getElementById('tournamentEndDate') as HTMLInputElement)?.value;

        if (!title || !startDate || !endDate) {
            alert('Please fill in title, start date and end date');
            return;
        }

        try {
            console.log('Creating tournament with:', { title, prizePool, startDate, endDate });

            const response = await apiClient.post('/staff/tournaments/create', {
                title: title,
                description: 'Cybersecurity tournament',
                start_date: new Date(startDate).toISOString(),
                                                  end_date: new Date(endDate).toISOString(),
                                                  prize_pool: parseInt(prizePool) || 0
            });

            console.log('Tournament created:', response.data);
            alert('Tournament created successfully!');

            // Clear form
            (document.getElementById('tournamentTitle') as HTMLInputElement).value = '';
            (document.getElementById('prizePool') as HTMLInputElement).value = '';
            (document.getElementById('tournamentStartDate') as HTMLInputElement).value = '';
            (document.getElementById('tournamentEndDate') as HTMLInputElement).value = '';

            fetchDashboardData();
        } catch (err: any) {
            console.error('Error creating tournament:', err);
            alert(err.response?.data?.detail || 'Failed to create tournament');
        }
    };

    const startTournament = async (tournamentId: string) => {
        if (confirm('Are you sure you want to start the tournament? Challenges will become visible to all users.')) {
            try {
                const response = await apiClient.post(`/staff/tournaments/${tournamentId}/start`);
                alert('Tournament started successfully!');
                fetchDashboardData();
            } catch (err: any) {
                alert(err.response?.data?.detail || 'Failed to start tournament');
            }
        }
    };

    const extendTournament = async (tournamentId: string) => {
        const endDate = prompt('Enter new end date (YYYY-MM-DDTHH:MM:SS)');
        if (endDate) {
            try {
                await apiClient.post(`/staff/tournaments/${tournamentId}/extend`, {
                    new_end_date: new Date(endDate).toISOString()
                });
                alert('Tournament extended successfully!');
                fetchDashboardData();
            } catch (err) {
                alert('Failed to extend tournament');
            }
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
            <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-green mx-auto mb-4"></div>
            <p className="text-cyber-green font-cyber">Loading Admin Command Center...</p>
            </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-20 px-4 bg-gradient-to-br from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
        <div>
        <div className="flex items-center gap-3 mb-2">
        <Shield className="w-10 h-10 text-cyber-purple" />
        <h1 className="text-4xl font-orbitron font-bold bg-gradient-to-r from-cyber-purple via-cyber-blue to-cyber-green bg-clip-text text-transparent">
        Snowden's Admin
        </h1>
        </div>
        <p className="text-gray-400 font-cyber">Manage labs, tournaments, users, and flags</p>
        </div>
        </div>

        {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-500">Error: {error}</p>
            </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-cyber-green/30 pb-4">
        {[
            { id: 'overview', label: 'Overview', icon: <BarChart className="w-4 h-4" /> },
            { id: 'labs', label: 'Labs Management', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'tournament', label: 'Tournament', icon: <Trophy className="w-4 h-4" /> },
            { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
            { id: 'flags', label: 'Flags', icon: <Flag className="w-4 h-4" /> },
            { id: 'leaderboard', label: 'Live Leaderboard', icon: <Crown className="w-4 h-4" /> }
        ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-cyber transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-cyber-green to-cyber-blue text-black font-bold' : 'text-gray-400 hover:text-cyber-green'}`}>
            {tab.icon} {tab.label}
            </button>
        ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
            <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-blue/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2"><BookOpen className="w-6 h-6 text-cyber-green" /><h3 className="text-gray-400">Total Labs</h3></div>
            <p className="text-3xl font-orbitron font-bold text-cyber-green">{stats.totalLabs}</p>
            </div>
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-purple/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2"><Users className="w-6 h-6 text-cyber-purple" /><h3 className="text-gray-400">Total Users</h3></div>
            <p className="text-3xl font-orbitron font-bold text-cyber-purple">{stats.totalUsers}</p>
            <p className="text-sm text-gray-500 mt-1">Staff: {stats.staffCount}</p>
            </div>
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-blue/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2"><Trophy className="w-6 h-6 text-cyber-blue" /><h3 className="text-gray-400">Tournament</h3></div>
            <p className="text-3xl font-orbitron font-bold text-cyber-blue">{stats.activeTournament ? 'Active' : 'Inactive'}</p>
            {stats.activeTournament && <p className="text-sm text-gray-500 mt-1">{stats.totalParticipants} participants</p>}
            </div>
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-green/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2"><Target className="w-6 h-6 text-cyber-green" /><h3 className="text-gray-400">Success Rate</h3></div>
            <p className="text-3xl font-orbitron font-bold text-cyber-green">{stats.successRate}%</p>
            <p className="text-sm text-gray-500 mt-1">{stats.totalSubmissions} submissions</p>
            </div>
            </div>
            </div>
        )}

        {/* Labs Management Tab */}
        {activeTab === 'labs' && (
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-green/20 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-orbitron font-bold text-cyber-green">All Labs ({labs.length})</h2>
            <button onClick={() => setShowCreateLab(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg font-cyber text-sm hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> Add Lab
            </button>
            </div>
            {labs.length === 0 ? (
                <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-500 mx-auto mb-2 opacity-50" />
                <p className="text-gray-400">No labs found. Create your first lab!</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="border-b border-cyber-green/30">
                <tr className="text-left text-gray-400 font-cyber">
                <th className="pb-3">Title</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Difficulty</th>
                <th className="pb-3">Points</th>
                <th className="pb-3">Participants</th>
                <th className="pb-3">Actions</th>
                <th className="pb-3">Delete</th>
                </tr>
                </thead>
                <tbody>
                {labs.map((lab) => (
                    <tr key={lab.id} className="border-b border-cyber-green/10">
                    <td className="py-3 text-white">{lab.title}</td>
                    <td className="py-3 text-gray-400">{lab.category}</td>
                    <td className="py-3"><span className={`text-xs px-2 py-1 rounded ${lab.difficulty === 'beginner' ? 'bg-green-500/20 text-green-500' : lab.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}`}>{lab.difficulty}</span></td>
                    <td className="py-3 text-cyber-green">{lab.points}</td>
                    <td className="py-3 text-gray-400">{lab.participants || 0}</td>
                    <td className="py-3">
                    <button onClick={() => { setNewFlag({ challenge_type: 'lab', challenge_id: lab.id, flag: '' }); setShowFlagModal(true); }}
                    className="text-cyber-blue hover:text-cyber-green transition-colors">
                    <Flag className="w-4 h-4" />
                    </button>
                    </td>
                    <td className="py-3">
                    <button onClick={() => handleDeleteLab(lab.id, lab.title)}
                    className="text-red-500 hover:text-red-700 transition-colors">
                    <Trash2 className="w-4 h-4" />
                    </button>
                    </td>
                    </tr>
                ))}
                </tbody>
                </table>
                </div>
            )}
            </div>
        )}

        {/* Tournament Tab */}
        {activeTab === 'tournament' && (
            <div className="space-y-6">
            {/* Create Tournament Section */}
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-purple/20 rounded-lg p-6">
            <h2 className="text-xl font-orbitron font-bold text-cyber-purple mb-4">Create New Tournament</h2>
            <div className="grid md:grid-cols-2 gap-4">
            <div>
            <label className="block text-gray-400 text-sm mb-2">Tournament Title</label>
            <input type="text" id="tournamentTitle" className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg px-4 py-2 text-white" placeholder="Cyber Warfare Championship" />
            </div>
            <div>
            <label className="block text-gray-400 text-sm mb-2">Prize Pool ($)</label>
            <input type="number" id="prizePool" className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg px-4 py-2 text-white" placeholder="10000" />
            </div>
            <div>
            <label className="block text-gray-400 text-sm mb-2">Start Date & Time</label>
            <input type="datetime-local" id="tournamentStartDate" className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
            <label className="block text-gray-400 text-sm mb-2">End Date & Time</label>
            <input type="datetime-local" id="tournamentEndDate" className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg px-4 py-2 text-white" />
            </div>
            </div>
            <div className="flex gap-4 mt-4">
            <button onClick={createTournament} className="px-6 py-2 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg font-cyber hover:shadow-lg transition-all">
            Create Tournament
            </button>
            </div>
            </div>

            {/* Active Tournament Management */}
            {tournament?.tournament ? (
                <div className="bg-cyber-card backdrop-blur-md border border-cyber-purple/20 rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-orbitron font-bold text-cyber-purple">Active Tournament</h2>
                <div className="flex gap-3">
                {!tournament.tournament.has_started && (
                    <button onClick={() => startTournament(tournament.tournament.id)}
                    className="px-6 py-2 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg font-cyber hover:shadow-lg transition-all">
                    ▶ START TOURNAMENT
                    </button>
                )}
                <button onClick={() => extendTournament(tournament.tournament.id)}
                className="px-6 py-2 bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg font-cyber hover:bg-cyber-purple/20 transition-all">
                Extend Tournament
                </button>
                {/* NEW DELETE TOURNAMENT BUTTON */}
                <button onClick={() => handleDeleteTournament(tournament.tournament.id, tournament.tournament.title)}
                className="px-6 py-2 bg-red-500/20 border border-red-500 rounded-lg font-cyber text-red-500 hover:bg-red-500 hover:text-white transition-all">
                <Trash2 className="w-4 h-4 inline mr-1" /> Delete
                </button>
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-cyber-dark/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Tournament</p>
                <p className="text-cyber-purple font-bold">{tournament.tournament.title}</p>
                <p className="text-xs text-gray-500 mt-1">Status: {tournament.tournament.has_started ? '🟢 LIVE' : '⏳ WAITING'}</p>
                <p className="text-xs text-gray-500">Ends: {new Date(tournament.tournament.end_date).toLocaleString()}</p>
                </div>
                <div className="bg-cyber-dark/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Prize Pool</p>
                <p className="text-cyber-green font-bold">${tournament.tournament.prize_pool}</p>
                </div>
                <div className="bg-cyber-dark/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Participants</p>
                <p className="text-cyber-blue font-bold">{tournament.stats.total_participants}</p>
                </div>
                </div>

                <h3 className="font-orbitron font-bold text-cyber-green mb-3">Tournament Challenges ({challenges.length})</h3>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                {challenges.length > 0 ? challenges.map((challenge, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-cyber-dark/30 rounded-lg">
                    <div className="flex-1">
                    <div className="flex items-center gap-2">
                    <span className="text-white font-cyber">{challenge.title}</span>
                    <span className="text-xs text-cyber-purple">by {challenge.author_name || 'Anonymous'}</span>
                    </div>
                    <p className="text-xs text-gray-500">{challenge.category} • {challenge.points} pts</p>
                    {challenge.flag && (
                        <p className="text-xs text-cyber-green font-mono mt-1">
                        Flag: {challenge.flag.substring(0, 30)}...
                        </p>
                    )}
                    </div>
                    <button
                    onClick={() => {
                        setEditingFlag({
                            id: challenge.id,
                            challenge_title: challenge.title,
                            flag: challenge.flag
                        });
                        setEditedFlagValue(challenge.flag || '');
                        setShowEditFlagModal(true);
                    }}
                    className="text-cyber-blue hover:text-cyber-green transition-colors flex items-center gap-1"
                    >
                    <Edit className="w-4 h-4" /> Edit Flag
                    </button>
                    </div>
                )) : (
                    <p className="text-gray-400 text-center py-4">No challenges added yet.</p>
                )}
                </div>

                <div className="flex justify-center mt-6">
                <button
                onClick={() => setShowCreateChallenge(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-cyber-purple to-cyber-blue rounded-lg font-cyber hover:shadow-lg transition-all"
                >
                <Plus className="w-4 h-4" />
                Add Challenge
                </button>
                </div>
                </div>
            ) : (
                <div className="bg-cyber-card backdrop-blur-md border border-cyber-purple/20 rounded-lg p-6 text-center py-8">
                <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400">No active tournament. Create one above!</p>
                </div>
            )}
            </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-blue/20 rounded-lg p-6">
            <h2 className="text-xl font-orbitron font-bold text-cyber-blue mb-6 flex items-center gap-2">
            <Users className="w-6 h-6" /> Registered Users ({users.length})
            </h2>
            <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-cyber-dark/50 border border-cyber-blue/30 rounded-lg pl-10 pr-4 py-2 text-white" />
            </div>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
            className="bg-cyber-dark/50 border border-cyber-blue/30 rounded-lg px-4 py-2 text-white">
            <option value="all">All Roles</option>
            <option value="user">Regular Users</option>
            <option value="staff">Staff/Admin</option>
            </select>
            </div>
            {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-2 opacity-50" />
                <p className="text-gray-400">No users found</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="border-b border-cyber-blue/30">
                <tr className="text-left text-gray-400 font-cyber">
                <th className="pb-3">Username</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Total XP</th>
                <th className="pb-3">Actions</th>
                </tr>
                </thead>
                <tbody>
                {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-cyber-blue/10 hover:bg-cyber-dark/20 transition-all">
                    <td className="py-3 text-white font-cyber">{user.username}</td>
                    <td className="py-3 text-gray-400">{user.email}</td>
                    <td className="py-3">
                    <select value={user.role} onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded bg-cyber-dark/50 border ${user.role === 'staff' ? 'border-cyber-purple text-cyber-purple' : 'border-gray-500 text-gray-400'}`}>
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    </select>
                    </td>
                    <td className="py-3 text-cyber-green font-bold">{user.total_xp} XP</td>
                    <td className="py-3">
                    <button onClick={() => handleViewUser(user)}
                    className="text-cyber-blue hover:text-cyber-green transition-colors flex items-center gap-1">
                    <Eye className="w-4 h-4" /> Details
                    </button>
                    </td>
                    </tr>
                ))}
                </tbody>
                </table>
                </div>
            )}
            </div>
        )}

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-purple/30 rounded-lg p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-orbitron font-bold text-cyber-purple">User Details: {selectedUser.username}</h2>
            <button onClick={() => setShowUserDetails(false)} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
            </div>
            <div className="bg-cyber-dark/30 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
            <div><p className="text-gray-400 text-sm">Username</p><p className="text-white font-cyber">{selectedUser.username}</p></div>
            <div><p className="text-gray-400 text-sm">Email</p><p className="text-white font-cyber">{selectedUser.email}</p></div>
            <div><p className="text-gray-400 text-sm">Role</p><p className={`font-cyber ${selectedUser.role === 'staff' ? 'text-cyber-purple' : 'text-cyber-green'}`}>{selectedUser.role}</p></div>
            <div><p className="text-gray-400 text-sm">Total XP</p><p className="text-cyber-green font-bold">{selectedUser.total_xp} XP</p></div>
            <div><p className="text-gray-400 text-sm">Joined Date</p><p className="text-white">{new Date(selectedUser.joined_at).toLocaleDateString()}</p></div>
            </div>
            </div>
            <h3 className="text-lg font-orbitron font-bold text-cyber-green mb-4">Tournament Challenges Solved</h3>
            {userChallenges.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                {userChallenges.map((challenge, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-cyber-dark/30 rounded-lg">
                    <div>
                    <p className="text-white font-cyber">{challenge.title}</p>
                    <p className="text-xs text-gray-500">{challenge.category} • {challenge.points} points</p>
                    </div>
                    <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyber-green" />
                    <span className="text-cyber-green text-sm">Solved</span>
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                <div className="text-center py-8 bg-cyber-dark/30 rounded-lg">
                <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-2 opacity-50" />
                <p className="text-gray-400">This user hasn't solved any tournament challenges yet.</p>
                </div>
            )}
            <div className="flex justify-end mt-6">
            <button onClick={() => setShowUserDetails(false)} className="px-6 py-2 bg-gradient-to-r from-cyber-purple to-cyber-blue rounded-lg font-cyber hover:shadow-lg transition-all">Close</button>
            </div>
            </div>
            </div>
        )}

        {/* Flags Tab */}
        {activeTab === 'flags' && (
            <div className="space-y-8">
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-green/20 rounded-lg p-6">
            <h2 className="text-xl font-orbitron font-bold text-cyber-green mb-6">All Challenge Flags ({allFlags.length})</h2>
            {allFlags.length > 0 ? (
                <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="border-b border-cyber-green/30">
                <tr className="text-left text-gray-400 font-cyber">
                <th className="pb-3">Challenge Title</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Flag</th>
                <th className="pb-3">Actions</th>
                </tr>
                </thead>
                <tbody>
                {allFlags.map((flag) => (
                    <tr key={flag.id} className="border-b border-cyber-green/10">
                    <td className="py-3 text-white font-cyber">{flag.challenge_title}</td>
                    <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded ${flag.challenge_type === 'tournament' ? 'bg-cyber-purple/20 text-cyber-purple' : 'bg-cyber-green/20 text-cyber-green'}`}>
                    {flag.challenge_type}
                    </span>
                    </td>
                    <td className="py-3">
                    <code className="text-cyber-green font-mono text-sm bg-cyber-dark/30 px-2 py-1 rounded break-all">
                    {flag.flag}
                    </code>
                    </td>
                    <td className="py-3">
                    <button
                    onClick={() => {
                        setEditingFlag(flag);
                        setEditedFlagValue(flag.flag);
                        setShowEditFlagModal(true);
                    }}
                    className="flex items-center gap-2 text-cyber-blue hover:text-cyber-green transition-colors"
                    >
                    <Edit className="w-4 h-4" /> Edit Flag
                    </button>
                    </td>
                    </tr>
                ))}
                </tbody>
                </table>
                </div>
            ) : (
                <div className="text-center py-8">
                <Flag className="w-12 h-12 text-gray-500 mx-auto mb-2 opacity-50" />
                <p className="text-gray-400">No flags have been added yet</p>
                </div>
            )}
            </div>
            </div>
        )}

        {/* Live Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-purple/20 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-orbitron font-bold text-cyber-purple flex items-center gap-2"><Crown className="w-6 h-6" /> Live Tournament Leaderboard</h2>
            </div>
            {leaderboard.length > 0 ? (
                <div className="space-y-2">
                {leaderboard.map((player, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-4 rounded-lg transition-all ${idx < 3 ? 'bg-gradient-to-r from-cyber-purple/20 to-transparent border border-cyber-purple/30' : 'bg-cyber-dark/30 hover:bg-cyber-dark/50'}`}>
                    <div className="flex items-center gap-4">
                    <div className={`text-xl font-orbitron font-bold w-12 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-gray-500'}`}>#{player.rank}</div>
                    <div className="w-10 h-10 bg-gradient-to-br from-cyber-purple to-cyber-blue rounded-full flex items-center justify-center text-white font-bold">{player.avatar}</div>
                    <div><p className="font-cyber font-bold text-white">{player.name}</p><p className="text-xs text-gray-400">{player.score} points</p></div>
                    </div>
                    {idx < 3 && <div className="text-2xl">{idx === 0 && '👑'}{idx === 1 && '🥈'}{idx === 2 && '🥉'}</div>}
                    </div>
                ))}
                </div>
            ) : (<div className="text-center py-12"><Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" /><p className="text-gray-400">No leaderboard available</p></div>)}
            </div>
        )}
        </div>

        {/* Modals - Keep all the modal code from your original file */}
        {/* Create Lab Modal */}
        {showCreateLab && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-green/30 rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-orbitron font-bold text-cyber-green mb-6">Create New Lab</h2>
            <div className="space-y-4">
            <input type="text" placeholder="Lab ID (optional)" value={newLab.id} onChange={(e) => setNewLab({...newLab, id: e.target.value})} className="w-full bg-cyber-dark/50 border border-cyber-green/30 rounded-lg px-4 py-2 text-white" />
            <input type="text" placeholder="Title *" value={newLab.title} onChange={(e) => setNewLab({...newLab, title: e.target.value})} className="w-full bg-cyber-dark/50 border border-cyber-green/30 rounded-lg px-4 py-2 text-white" />
            <textarea placeholder="Description" value={newLab.description} onChange={(e) => setNewLab({...newLab, description: e.target.value})} rows={3} className="w-full bg-cyber-dark/50 border border-cyber-green/30 rounded-lg px-4 py-2 text-white" />
            <div className="grid grid-cols-2 gap-4">
            <select value={newLab.category} onChange={(e) => setNewLab({...newLab, category: e.target.value})} className="bg-cyber-dark/50 border border-cyber-green/30 rounded-lg px-4 py-2 text-white">
            <option value="web">Web Exploitation</option>
            <option value="crypto">Cryptography</option>
            <option value="osint">OSINT</option>
            <option value="forensics">Forensics</option>
            <option value="reverse">Reverse Engineering</option>
            </select>
            <select value={newLab.difficulty} onChange={(e) => setNewLab({...newLab, difficulty: e.target.value})} className="bg-cyber-dark/50 border border-cyber-green/30 rounded-lg px-4 py-2 text-white">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
            </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Points" value={newLab.points} onChange={(e) => setNewLab({...newLab, points: parseInt(e.target.value)})} className="bg-cyber-dark/50 border border-cyber-green/30 rounded-lg px-4 py-2 text-white" />
            <input type="text" placeholder="Docker Image" value={newLab.docker_image} onChange={(e) => setNewLab({...newLab, docker_image: e.target.value})} className="bg-cyber-dark/50 border border-cyber-green/30 rounded-lg px-4 py-2 text-white" />
            </div>
            <input type="text" placeholder="Tags (comma-separated)" value={newLab.tags} onChange={(e) => setNewLab({...newLab, tags: e.target.value})} className="w-full bg-cyber-dark/50 border border-cyber-green/30 rounded-lg px-4 py-2 text-white" />
            </div>
            <div className="flex gap-4 mt-6">
            <button onClick={handleCreateLab} className="flex-1 py-2 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg font-cyber hover:shadow-lg transition-all">Create Lab</button>
            <button onClick={() => setShowCreateLab(false)} className="flex-1 py-2 bg-red-500/20 border border-red-500 rounded-lg font-cyber text-red-500 hover:bg-red-500 hover:text-white transition-all">Cancel</button>
            </div>
            </div>
            </div>
        )}

        {/* Add Flag Modal */}
        {showFlagModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-green/30 rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-orbitron font-bold text-cyber-green mb-6">Add Flag</h2>
            <input type="text" placeholder="Challenge/Lab ID" value={newFlag.challenge_id} onChange={(e) => setNewFlag({...newFlag, challenge_id: e.target.value})} className="w-full bg-cyber-dark/50 border border-cyber-green/30 rounded-lg px-4 py-2 text-white mb-4" />
            <input type="text" placeholder="Flag" value={newFlag.flag} onChange={(e) => setNewFlag({...newFlag, flag: e.target.value})} className="w-full bg-cyber-dark/50 border border-cyber-green/30 rounded-lg px-4 py-2 text-white font-mono" />
            <div className="flex gap-4 mt-6">
            <button onClick={handleAddFlag} className="flex-1 py-2 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg font-cyber hover:shadow-lg transition-all">Add Flag</button>
            <button onClick={() => setShowFlagModal(false)} className="flex-1 py-2 bg-red-500/20 border border-red-500 rounded-lg font-cyber text-red-500 hover:bg-red-500 hover:text-white transition-all">Cancel</button>
            </div>
            </div>
            </div>
        )}

        {/* Create Challenge Modal */}
        {showCreateChallenge && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-purple/30 rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-orbitron font-bold text-cyber-purple mb-6">Add Tournament Challenge</h2>
            <div className="space-y-4">
            <input type="text" placeholder="Challenge Title" value={newChallenge.title} onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})} className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg px-4 py-2 text-white" />
            <input type="text" placeholder="Author Name (e.g., @hackerman)" value={newChallenge.author_name} onChange={(e) => setNewChallenge({...newChallenge, author_name: e.target.value})} className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg px-4 py-2 text-white" />
            <textarea placeholder="Description" value={newChallenge.description} onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})} rows={3} className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg px-4 py-2 text-white" />
            <div className="grid grid-cols-2 gap-4">
            <select value={newChallenge.category} onChange={(e) => setNewChallenge({...newChallenge, category: e.target.value})} className="bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg px-4 py-2 text-white">
            <option value="web">Web Exploitation</option>
            <option value="crypto">Cryptography</option>
            <option value="osint">OSINT</option>
            <option value="forensics">Forensics</option>
            <option value="reverse">Reverse Engineering</option>
            <option value="pwn">Binary Exploitation</option>
            </select>
            <select value={newChallenge.difficulty} onChange={(e) => setNewChallenge({...newChallenge, difficulty: e.target.value})} className="bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg px-4 py-2 text-white">
            <option value="beginner">Easy</option>
            <option value="intermediate">Medium</option>
            <option value="advanced">Hard</option>
            <option value="expert">Expert</option>
            </select>
            </div>
            <input type="number" placeholder="Points" value={newChallenge.points} onChange={(e) => setNewChallenge({...newChallenge, points: parseInt(e.target.value)})} className="bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg px-4 py-2 text-white" />
            <textarea placeholder="Objectives (one per line)" value={newChallenge.objectives} onChange={(e) => setNewChallenge({...newChallenge, objectives: e.target.value})} rows={3} className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg px-4 py-2 text-white" />
            <div>
            <label className="block text-gray-400 text-sm mb-2">Challenge File (Optional)</label>
            <input type="file" id="challengeFile" className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg px-4 py-2 text-white file:mr-2 file:py-1 file:px-3 file:rounded file:bg-cyber-purple/20 file:text-white file:border-0" />
            </div>
            <input type="text" placeholder="Flag (The correct answer - stored securely)" value={newChallenge.flag} onChange={(e) => setNewChallenge({...newChallenge, flag: e.target.value})} className="w-full bg-cyber-dark/50 border border-cyber-purple/30 rounded-lg px-4 py-2 text-white font-mono" />
            </div>
            <div className="flex gap-4 mt-6">
            <button onClick={handleCreateChallenge} className="flex-1 py-2 bg-gradient-to-r from-cyber-purple to-cyber-blue rounded-lg font-cyber hover:shadow-lg transition-all">Create Challenge</button>
            <button onClick={() => setShowCreateChallenge(false)} className="flex-1 py-2 bg-red-500/20 border border-red-500 rounded-lg font-cyber text-red-500 hover:bg-red-500 hover:text-white transition-all">Cancel</button>
            </div>
            </div>
            </div>
        )}

        {/* Edit Flag Modal */}
        {showEditFlagModal && editingFlag && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-cyber-card backdrop-blur-md border border-cyber-green/30 rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-orbitron font-bold text-cyber-green mb-6">Edit Flag</h2>
            <p className="text-gray-400 mb-4">Challenge: <span className="text-cyber-purple">{editingFlag.challenge_title}</span></p>
            <input type="text" placeholder="New Flag (e.g., flag{...})" value={editedFlagValue} onChange={(e) => setEditedFlagValue(e.target.value)} className="w-full bg-cyber-dark/50 border border-cyber-green/30 rounded-lg px-4 py-2 text-white font-mono mb-4" />
            <div className="flex gap-4">
            <button onClick={() => handleEditFlag(editingFlag.id)} className="flex-1 py-2 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg font-cyber hover:shadow-lg transition-all">Update Flag</button>
            <button onClick={() => { setShowEditFlagModal(false); setEditingFlag(null); setEditedFlagValue(''); }} className="flex-1 py-2 bg-red-500/20 border border-red-500 rounded-lg font-cyber text-red-500 hover:bg-red-500 hover:text-white transition-all">Cancel</button>
            </div>
            </div>
            </div>
        )}
        </div>
    );
};

export default AdminDashboard;
