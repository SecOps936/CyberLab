import React, { useEffect, useState } from 'react';
import { Bell, Zap } from 'lucide-react';
import axios from 'axios';

const AnnouncementBar: React.FC = () => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const getAnnouncements = async () => {
      const response = await axios.get('https://cyber.yit-agency.com/api/announcements');
      // console.log('Announcements:', response.data);
    };

    getAnnouncements();
  })


  return (
    <div className="bg-gradient-to-r from-cyber-purple to-cyber-blue text-white py-2 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2 text-sm font-cyber">
        <Bell className="w-4 h-4 animate-pulse" />
        <div className="flex items-center gap-4">
          <span className="animate-pulse-cyber">🏆 Weekly Tournament starts Monday - Register now!</span>
          <span className="text-cyber-green flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {/* New OSINT Labs Available */}
            Snowden Lab Official Launching
          </span>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
    </div>
  );
};

export default AnnouncementBar;