'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { AuthGateway } from '../components/AuthGateway'
import GameCard from '../../components/GameCard'
import Navbar from '../../components/Navbar'
import type { Session } from '@supabase/supabase-js'
import gameData from '../../public/gameData.json'
import { Home, User, Settings as SettingsIcon, Sun, MonitorPlay, Cog } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white">Loading...</div>
  if (!session) return <AuthGateway onAuthSuccess={() => {}} />

  const games = gameData as any[]

  // --- TAB CONTENT ---
  const renderHome = () => (
    <div className="pb-24">
      <Navbar />
      {/* Horizontal Recent Scroll */}
      <section className="px-4 mt-6">
        <h2 className="text-lg font-bold text-slate-300 mb-3">Last Played</h2>
        <div className="flex overflow-x-auto space-x-4 pb-4">
          {games.slice(0, 5).map((game, i) => (
            <div key={i} className="shrink-0 w-40"><GameCard {...game} /></div>
          ))}
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 px-4">
        {games.map((game, index) => <GameCard key={index} {...game} />)}
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="p-6 pt-10 h-screen">
      <h2 className="text-2xl font-black mb-8">Menu</h2>
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
          <Sun size={32} className="text-amber-400" /> <span className="font-bold">Theme</span>
        </button>
        <Link href="/studio" className="bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
          <MonitorPlay size={32} className="text-amber-400" /> <span className="font-bold">Studio</span>
        </Link>
        <button className="col-span-2 bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
          <Cog size={32} className="text-slate-500" /> <span className="font-bold text-slate-500">Settings</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {activeTab === 'home' && renderHome()}
      {activeTab === 'avatar' && <div className="flex h-screen items-center justify-center">Avatar Tab</div>}
      {activeTab === 'settings' && renderSettings()}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-slate-950 border-t border-slate-800 p-2 z-50">
        <div className="flex justify-around">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center p-2 ${activeTab === 'home' ? 'text-amber-400' : 'text-slate-500'}`}>
            <Home size={24} /> <span className="text-[10px]">Home</span>
          </button>
          <button onClick={() => setActiveTab('avatar')} className={`flex flex-col items-center p-2 ${activeTab === 'avatar' ? 'text-amber-400' : 'text-slate-500'}`}>
            <User size={24} /> <span className="text-[10px]">Avatar</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center p-2 ${activeTab === 'settings' ? 'text-amber-400' : 'text-slate-500'}`}>
            <SettingsIcon size={24} /> <span className="text-[10px]">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
