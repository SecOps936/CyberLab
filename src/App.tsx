import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AnnouncementBar from './components/AnnouncementBar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Labs from './pages/Labs';
import LabDetails from './pages/LabDetails';
import LabWorkspace from './pages/LabWorkspace';
import Tournament from './pages/Tournament';
import OAuthCallback from './pages/OauthCallback';
import BackgroundAnimation from './components/BackgroundAnimation';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black relative overflow-hidden">
      <div className="relative z-10 text-center">
      <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-6 mx-auto shadow-lg shadow-cyan-400/50"></div>
      <div className="text-cyan-400 text-xl font-mono tracking-wider uppercase animate-pulse">Loading...</div>
      </div>
      </div>
    );
  }

  // Check if user is admin/staff (role === 'staff')
  const isAdmin = user?.role === 'staff';

  return (
    <>
    <BackgroundAnimation />
    <AnnouncementBar />
    <Navbar />
    <main className="relative z-10">
    <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    {/* Admin goes to AdminDashboard, regular users go to Dashboard */}
    <Route path="/dashboard" element={isAdmin ? <AdminDashboard /> : <Dashboard />} />
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/auth/callback/:provider" element={<OAuthCallback />} />
    <Route path="/labs" element={<Labs />} />
    <Route path="/lab/:id" element={<LabDetails />} />
    <Route path="/lab/:labId/workspace" element={<LabWorkspace />} />
    <Route path="/tournament" element={<Tournament />} />
    </Routes>
    </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
    <Router>
    <div className="min-h-screen bg-cyber-dark text-white relative overflow-hidden">
    <AppRoutes />
    </div>
    </Router>
    </AuthProvider>
  );
}

export default App;
