import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AuthPageProps {
  userType: string;
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ userType, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, userType);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setResetError('');
    setResetMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
    if (error) {
      setResetError(error.message);
    } else {
      setResetMessage('Password reset email sent! Check your inbox.');
    }
  };

  const getUserTypeTitle = (type: string) => {
    const titles = {
      community: 'Community Member',
      ranger: 'Ranger',
      admin: 'Admin'
    };
    return titles[type as keyof typeof titles] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={onBack}
            className="flex items-center text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to user selection
          </button>
          
          <div className="text-center">
            <img
              src="/sentry_jamii_logo.png"
              alt="Sentry Jamii"
              className="w-16 h-16 mx-auto mb-4 rounded-xl shadow-lg"
            />
            <h1 className="text-2xl font-bold text-white mb-2">
              {getUserTypeTitle(userType)} {isLogin ? 'Login' : 'Sign Up'}
            </h1>
            <p className="text-white/70">
              {isLogin ? 'Welcome back!' : 'Create your account to get started'}
            </p>
          </div>
        </motion.div>

        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-white/70 hover:text-white transition-colors text-sm"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>

          <p className="text-right mt-2">
            <button
              type="button"
              className="text-emerald-500 hover:underline text-sm"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot Password?
            </button>
          </p>

          {showForgotPassword && (
            <div className="my-4 p-4 bg-white rounded shadow">
              <h3 className="font-bold mb-2 text-gray-900">Reset Password</h3>
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                className="border p-2 w-full mb-2 text-gray-900 bg-white"
              />
              <Button onClick={handleForgotPassword} variant="primary" size="sm">
                Send Reset Email
              </Button>
              <Button onClick={() => setShowForgotPassword(false)} variant="secondary" size="sm" className="ml-2">
                Cancel
              </Button>
              {resetMessage && <p className="text-green-700 mt-2">{resetMessage}</p>}
              {resetError && <p className="text-red-700 mt-2">{resetError}</p>}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};