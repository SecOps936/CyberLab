import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Trophy, Users, Zap, Star, Play, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LandingPage: React.FC = () => {
  // const {isAuthenticated} = React.useContext(AuthContext);
   const { isAuthenticated, loading } = useAuth();
  const benefits = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Hands-on Labs",
      description: "Practice with real-world cybersecurity challenges in our interactive lab environment."
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Weekly Hackathons",
      description: "Compete with peers in exciting weekly tournaments and climb the leaderboard."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Global Community",
      description: "Connect with cybersecurity professionals and enthusiasts from around the world."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-world Skills",
      description: "Develop practical skills that directly apply to your cybersecurity career."
    }
  ];

  const sponsors = [
    { name: "CyberCorp", logo: "YIT" },
    { name: "SecureNet", logo: "DIT" },
    { name: "HackPro", logo: "HP" },
    { name: "CyberGuard", logo: "CG" },
    { name: "InfoSec", logo: "IS" },
    { name: "NetShield", logo: "NS" }
  ];

  const announcements = [
    { title: "New Web Exploitation Labs Added", time: "2 hours ago", type: "new" },
    { title: "Monthly Tournament Winner: @cybermaster", time: "1 day ago", type: "winner" },
    { title: "OSINT Challenge Series Starting Soon", time: "3 days ago", type: "event" },
    { title: "Platform Update: Enhanced Lab Environment", time: "1 week ago", type: "update" }
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 relative">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-6xl md:text-8xl font-orbitron font-black mb-6 bg-gradient-to-r from-cyber-blue via-cyber-purple to-cyber-green bg-clip-text text-transparent">
              SNOWDEN LABS
            </h1>
            <p className="text-2xl md:text-4xl font-orbitron mb-8 text-gray-300">
              Train. Compete. Securex.
            </p>
            <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto font-cyber">
              Master cybersecurity through hands-on challenges, compete in tournaments, 
              and join a global community of ethical hackers and security professionals.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up">
            <Link
              to={isAuthenticated ? "/tournament" : "/register"}
              className="bg-gradient-to-r from-cyber-blue to-cyber-purple px-8 py-4 rounded-lg font-orbitron font-bold text-lg hover:shadow-2xl hover:shadow-cyber-blue/50 transition-all transform hover:scale-105 flex items-center gap-2 group"
            >
              Join Tournament
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to={isAuthenticated ? "/labs" : "/labs"}
              className="border-2 border-cyber-green px-8 py-4 rounded-lg font-orbitron font-bold text-lg text-cyber-green hover:bg-cyber-green hover:text-cyber-dark transition-all transform hover:scale-105 flex items-center gap-2 group"
            >
              <Play className="w-5 h-5" />
              Explore Labs
            </Link>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 border border-cyber-blue/30 rotate-45 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 border border-cyber-purple/30 rotate-12 animate-float" style={{ animationDelay: '2s' }}></div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-orbitron font-bold text-center mb-16 text-cyber-blue">
            Why Choose Snowden Labs?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-cyber-card backdrop-blur-md border border-cyber-blue/20 rounded-lg p-6 hover:border-cyber-blue/50 transition-all transform hover:scale-105 hover:shadow-xl hover:shadow-cyber-blue/20 group"
              >
                <div className="text-cyber-blue mb-4 group-hover:text-cyber-purple transition-colors">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-orbitron font-bold mb-3">{benefit.title}</h3>
                <p className="text-gray-400 font-cyber">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="py-20 px-4 bg-cyber-gray/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-orbitron font-bold text-center mb-12 text-cyber-purple">
            {/* Trusted by Industry Leaders */}
            Our Honorable sponsors
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-8">
            {sponsors.map((sponsor, index) => (
              <div
                key={index}
                className="bg-cyber-card backdrop-blur-md border border-cyber-purple/20 rounded-lg p-6 flex items-center justify-center hover:border-cyber-purple/50 transition-all transform hover:scale-110 group grayscale hover:grayscale-0"
              >
                <div className="text-2xl font-orbitron font-bold text-gray-500 group-hover:text-cyber-purple transition-colors">
                  {sponsor.logo}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-orbitron font-bold text-center mb-12 text-cyber-green">
            Latest Announcements
          </h2>
          <div className="space-y-4">
            {announcements.map((announcement, index) => (
              <div
                key={index}
                className="bg-cyber-card backdrop-blur-md border border-cyber-green/20 rounded-lg p-6 hover:border-cyber-green/50 transition-all transform hover:translate-x-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      announcement.type === 'new' ? 'bg-cyber-blue' :
                      announcement.type === 'winner' ? 'bg-cyber-purple' :
                      announcement.type === 'event' ? 'bg-cyber-green' : 'bg-gray-500'
                    } animate-pulse`}></div>
                    <h3 className="font-orbitron font-bold">{announcement.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 font-cyber text-sm">
                    <span>{announcement.time}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-cyber-blue/10 to-cyber-purple/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-orbitron font-bold mb-6">Ready to Begin Your Journey?</h2>
          <p className="text-xl text-gray-300 mb-8 font-cyber">
            Join thousands of cybersecurity professionals advancing their skills at Snowden Labs.
          </p>
          <Link
            to={isAuthenticated ? "/labs" : "/register"}
            className="bg-gradient-to-r from-cyber-purple to-cyber-blue px-12 py-4 rounded-lg font-orbitron font-bold text-xl hover:shadow-2xl hover:shadow-cyber-purple/50 transition-all transform hover:scale-105 inline-flex items-center gap-3 group"
          >
            <Star className="w-6 h-6" />
            Start Training Now
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;