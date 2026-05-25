import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { AuthGateway } from '../components/AuthGateway';
import type { Session } from '@supabase/supabase-js';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black text-white font-sans">
        <div className="text-xl font-bold tracking-widest uppercase animate-pulse">
          Loading Account...
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthGateway onAuthSuccess={() => {}} />;
  }

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-black text-white font-sans">
      <h1 className="text-2xl font-bold text-[#38bdf8] mb-4">Welcome to The Eternal Star</h1>
      <p className="text-gray-400">Your profile is safely authenticated.</p>
    </div>
  );
}
