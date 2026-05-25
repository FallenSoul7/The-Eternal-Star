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
    setUsername('');
    setPassword('');
    setError('');
  };

  const validateUsername = (str: string): boolean => {
    // Counts how many hyphens are in the username string
    const hyphenCount = (str.match(/-/g) || []).length;
    if (hyphenCount > 1) return false;

    // Removes a single hyphen if it exists, then checks if the rest are purely letters
    const pureLetters = str.replace('-', '');
    const alphaRegex = /^[A-Za-z]+$/;
    return alphaRegex.test(pureLetters);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError('Please fill out all fields.');
      return;
    }

    // Strict validation check for username formatting
    if (!validateUsername(cleanUsername)) {
      setError('Username must contain only alphabets with only one "-" allowed.');
      return;
    }

    // Strict validation check for password length
    if (password.length < 6) {
      setError('Password must be at least 6 digits or letters long.');
      return;
    }

    setLoading(true);

    // Map username to a internal virtual email structure for Supabase Auth auth backend
    const formattedEmail = `${cleanUsername.toLowerCase()}@agentshire.local`;

    try {
      if (mode === 'signup') {
        // First check if the username profile record already exists in public profiles table
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (checkError) throw checkError;
        if (existingUser) {
          setError('Username already exists.');
          setLoading(false);
          return;
        }

        // Register the new authentication account credentials
        const { error: signUpError } = await supabase.auth.signUp({
          email: formattedEmail,
          password: password,
        });

        if (signUpError) throw signUpError;
        
        // Save the unique username record into profiles table database
        const { error: profileError } = await supabase.from('profiles').insert([
          { username: cleanUsername }
        ]);
        
        if (profileError) throw profileError;

      } else {
        // Authenticate existing login credentials
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formattedEmail,
          password: password,
        });

        if (signInError) {
          setError('Invalid username or password.');
          setLoading(false);
          return;
        }
      }

      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  if (screen === 'launch') {
    return (
      <div className="flex flex-col items-center justify-between w-screen h-screen bg-black text-white font-sans select-none pb-12 pt-24">
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-4xl font-black tracking-widest text-[#38bdf8] uppercase drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
            Agentshire
          </h1>
        </div>
        
        <div className="w-full max-w-sm px-6 space-y-4">
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
              placeholder="Alphabets and max one '-' allowed"
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
              placeholder="Minimum 6 characters"
              className="w-full bg-[#1a1a2e] text-white px-4 py-4 rounded-xl border border-[#2b2b40] focus:outline-none focus:border-[#38bdf8]"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm font-bold mt-4 p-3 bg-red-950/30 border border-red-900/50 rounded-lg">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-4 mt-8 text-black font-bold text-lg rounded-xl transition-transform ${
              loading ? 'bg-gray-500' : 'bg-[#38bdf8] active:scale-95'
            }`}
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
