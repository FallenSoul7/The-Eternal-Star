'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
// AuthGateway is in front/src/components/, so go up 1 level
import { AuthGateway } from '../components/AuthGateway'
// GameCard and Navbar are in front/components/, so go up 2 levels
import GameCard from '../../components/GameCard'
import Navbar from '../../components/Navbar'
import type { Session } from '@supabase/supabase-js'
// gameData.json is in front/public/, so go up 2 levels
import gameData from '../../public/gameData.json'
import { Home as HomeIcon, User, Settings as SettingsIcon, Sun, MonitorPlay, Cog } from 'lucide-react'
import Link from 'next/link'

// Perfect type definition mapping your exact JSON layout
export interface GameInfo {
  title: string
  imageUrl: string
  slug: string
  websocketPort: number
  metaDescription: string
  markdown: string
  images: {
    url: string
    width: number
    height: number
    alt: string
    type: string
  }[]
}

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

  if (loading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black text-white font-sans">
        <div className="text-xl font-bold tracking-widest uppercase animate-pulse">
          Loading Account...
        </div>
      </div>
    )
  }

  if (!session) {
    return <AuthGateway onAuthSuccess={() => {}} />
  }

  // FIXED: Using capital G for GameInfo to match the interface above
  const games = gameData as GameInfo[]

  // --- TAB CONTENT ---
  const renderHome = () => (
    <div className="pb-24">
      <Navbar />
      {/* Horizontal Recent Scroll */}
      <section className="px-4 mt-6">
        <h2 className="text-lg font-bold text-slate-300 mb-3">Last Played</h2>
        <div className="flex overflow-x-auto space-x-4 pb-4">
          {games.slice(0, 5).map((game, i) => (
            <div key={i} className="shrink-0 w-40">
              <GameCard {...game} />
            </div>
          ))}
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 px-4 mt-6">
        <h2 className="text-lg font-bold text-slate-300 mb-2 col-span-1 md:col-span-2">Discover</h2>
        {games.map((game, index) => (
          <div
            className={`col-span-1 ${
              index === games.length - 1 && games.length % 2 !== 0 ? 'md:col-span-2' : ''
            }`}
            key={index}
          >
            <GameCard {...game} />
          </div>
        ))}
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="p-6 pt-10 h-screen">
      <h2 className="text-2xl font-black mb-8">Menu</h2>
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border border-slate-700">
          <Sun size={32} className="text-amber-400" /> 
          <span className="font-bold">Theme</span>
        </button>
        <Link href="/studio" className="bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border border-slate-700">
          <MonitorPlay size={32} className="text-amber-400" /> 
          <span className="font-bold">Studio</span>
        </Link>
        <button className="col-span-2 bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border border-slate-700">
          <Cog size={32} className="text-slate-500" /> 
          <span className="font-bold text-slate-500">Settings</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {activeTab === 'home' && renderHome()}
      
      {activeTab === 'avatar' && (
        <div className="flex flex-col h-screen items-center justify-center pb-20">
           <div className="h-64 w-64 bg-slate-800 rounded-2xl border-4 border-slate-600 shadow-xl flex items-center justify-center overflow-hidden">
            <User size={120} className="text-slate-500" />
          </div>
          <p className="mt-6 text-slate-400 font-bold tracking-widest uppercase">Default Avatar</p>
        </div>
      )}
      
      {activeTab === 'settings' && renderSettings()}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-slate-950/90 backdrop-blur-md border-t border-slate-800 p-2 z-50 pb-safe">
        <div className="flex justify-around max-w-md mx-auto">
          {/* FIXED: Using HomeIcon instead of Home to prevent naming conflicts */}
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center p-2 rounded-xl w-20 transition-all ${activeTab === 'home' ? 'text-amber-400 scale-110' : 'text-slate-500'}`}>
            <HomeIcon size={24} /> <span className="text-[10px] font-bold mt-1">Home</span>
          </button>
          <button onClick={() => setActiveTab('avatar')} className={`flex flex-col items-center p-2 rounded-xl w-20 transition-all ${activeTab === 'avatar' ? 'text-amber-400 scale-110' : 'text-slate-500'}`}>
            <User size={24} /> <span className="text-[10px] font-bold mt-1">Avatar</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center p-2 rounded-xl w-20 transition-all ${activeTab === 'settings' ? 'text-amber-400 scale-110' : 'text-slate-500'}`}>
            <SettingsIcon size={24} /> <span className="text-[10px] font-bold mt-1">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
