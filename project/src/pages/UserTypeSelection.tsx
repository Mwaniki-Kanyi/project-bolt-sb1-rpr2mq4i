import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserX, Shield, Settings } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

interface UserTypeSelectionProps {
  onSelectUserType: (userType: string) => void;
}

export const UserTypeSelection: React.FC<UserTypeSelectionProps> = ({ onSelectUserType }) => {
  const userTypes = [
    {
      id: 'community',
      title: 'Community Member',
      description: 'Report wildlife sightings and contribute to conservation',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      id: 'anonymous',
      title: 'Anonymous Member',
      description: 'Report wildlife without creating an account',
      icon: UserX,
      color: 'text-green-400'
    },
    {
      id: 'ranger',
      title: 'Ranger',
      description: 'Review and manage wildlife reports',
      icon: Shield,
      color: 'text-amber-400'
    },
    {
      id: 'admin',
      title: 'Admin',
      description: 'Full system access and analytics dashboard',
      icon: Settings,
      color: 'text-red-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <img
            src="/sentry_jamii_logo.png"
            alt="Sentry Jamii"
            className="w-20 h-20 mx-auto mb-6 rounded-xl shadow-lg"
          />
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to Sentry Jamii</h1>
          <p className="text-white/80 text-lg">Choose your role to get started</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userTypes.map((userType, index) => {
            const Icon = userType.icon;
            return (
              <motion.div
                key={userType.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard
                  onClick={() => onSelectUserType(userType.id)}
                  className="h-full hover:scale-105 transition-transform duration-300"
                >
                  <div className="text-center">
                    <div className={`inline-flex p-4 rounded-full bg-white/10 mb-4 ${userType.color}`}>
                      <Icon size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {userType.title}
                    </h3>
                    <p className="text-white/70">
                      {userType.description}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};