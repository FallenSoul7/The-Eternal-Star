import { useState } from 'react';
import { supabase } from '../supabaseClient';

interface AuthGatewayProps {
  onAuthSuccess: () => void;
}

export function AuthGateway({ onAuthSuccess }: AuthGatewayProps) {
  const [screen, setScreen] = useState<'launch' | 'form'>('launch');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLaunchClick = (selectedMode: 'login' | 'signup') => {
    setMode(selectedMode);
    setScreen('form');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please fill out all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    const formattedEmail = `${username.toLowerCase()}@agentshire.local`;

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: formattedEmail,
          password: password,
        });

        if (signUpError) throw signUpError;
        
        const { error: profileError } = await supabase.from('profiles').insert([
          { username: username }
        ]);
        
        if (profileError) throw profileError;

      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formattedEmail,
          password: password,
        });

        if (signInError) throw signInError;
      }

      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (screen === 'launch') {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-black text-white font-sans select-none">
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-4xl font-black tracking-widest text-[#38bdf8] uppercase drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
            Agentshire
          </h1>
        </div>
        
        <div className="w-full max-w-sm px-6 pb-12 space-y-4">
          <button 
            onClick={() => handleLaunchClick('login')}
            className="w-full py-4 bg-white text-black font-bold text-lg rounded-full active:scale-95 transition-transform"
          >
            Log In
          </button>
          
          <button 
            onClick={() => handleLaunchClick('signup')}
            className="w-full py-4 bg-[#1a1a2e] text-white border border-[#2b2b40] font-bold text-lg rounded-full active:scale-95 transition-transform"
          >
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start w-screen h-screen bg-black text-white font-sans pt-12">
      <div className="w-full max-w-sm px-6">
        <button 
          onClick={() => setScreen('launch')}
          className="text-gray-400 font-bold mb-8 active:text-white"
        >
          Back
        </button>

        <h2 className="text-3xl font-black mb-8">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              Username
            </label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter unique username..."
              className="w-full bg-[#1a1a2e] text-white px-4 py-4 rounded-xl border border-[#2b2b40] focus:outline-none focus:border-[#38bdf8]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              Password
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters..."
              className="w-full bg-[#1a1a2e] text-white px-4 py-4 rounded-xl border border-[#2b2b40] focus:outline-none focus:border-[#38bdf8]"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm font-bold mt-2">
              Error: {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-4 mt-8 text-black font-bold text-lg rounded-xl transition-transform ${
              loading ? 'bg-gray-500' : 'bg-[#38bdf8] active:scale-95'
            }`}
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}
