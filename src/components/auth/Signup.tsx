/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { ShieldCheck, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import logo from '../../assets/logo.jpg';

interface SignupProps {
  onSwitchToLogin: () => void;
}

export function Signup({ onSwitchToLogin }: SignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Blurred background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative z-10"
      >
        <div className="p-8 bg-gray-800 flex flex-col items-center text-white">
          <div className="mb-6 h-12 sm:h-14 flex justify-center overflow-hidden">
            <img src={logo} alt="Logo" className="h-[250%] w-auto max-w-none object-cover object-left -mt-8 invert hue-rotate-180 mix-blend-screen" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Create Account</h2>
          <p className="text-gray-300 text-sm mt-1">Start securing your templates today</p>
        </div>

        <form onSubmit={handleSignup} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 shadow-sm">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-gray-600 transition-colors" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-gray-600 transition-colors" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 transition-all"
              />
            </div>
            <p className="text-[10px] text-gray-400 ml-1">Must be at least 6 characters</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Confirm Password</label>
            <div className="relative group">
              <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-gray-600 transition-colors" />
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-2xl shadow-lg shadow-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
          </button>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <button 
                type="button"
                onClick={onSwitchToLogin}
                className="text-gray-800 font-bold hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
