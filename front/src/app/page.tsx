'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Home, User, Settings as SettingsIcon, Sun, MonitorPlay, Cog } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface GameMap {
  id: string
  title: string
  model_url?: string
  thumbnail_url: string
  isLocal?: boolean // Flag to know if it's your original GitHub maps
}

// 1. RESTORED YOUR ORIGINAL MAPS
const originalMaps: GameMap[] = [
  { id: 'test', title: 'Test World', thumbnail_url: '/placeholder-test.jpg', isLocal: true },
  { id: 'football', title: 'Football', thumbnail_url: '/placeholder-football.jpg', isLocal: true },
  { id: 'parkour', title: 'Obby Parkour', thumbnail_url: '/placeholder-parkour.jpg', isLocal: true },
]

export default function MainApp() {
  const [activeTab, setActiveTab] = useState('home')
  const [maps, setMaps] = useState<GameMap[]>(originalMaps)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMaps() {
      // Fetch new maps from Supabase and combine them with your original hardcoded ones
      const { data, error } = await supabase.from('game_maps').select('*')
      if (!error && data) {
        setMaps([...originalMaps, ...data])
      }
      setLoading(false)
    }
    fetchMaps()
  }, [])

  // --- TAB: HOME ---
  const renderHome = () => (
    <div className="p-4 space-y-6">
      
      {/* 2. RESTORED LOGIN AREA (No random title) */}
      <header className="flex justify-between items-center pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-500">
            <User size={20} className="text-slate-300" />
          </div>
          <span className="font-bold text-slate-300">Guest_Player</span>
        </div>
        <button className="bg-amber-500 text-slate-900 px-5 py-2 rounded-lg font-black text-sm transition active:scale-95">
          LOGIN
        </button>
      </header>

      {/* Recent Games: Horizontal Scroll */}
      <section>
        <h2 className="text-lg font-bold text-slate-300 mb-3">Continue Playing</h2>
        <div className="flex overflow-x-auto space-x-4 pb-4 snap-x">
          {maps.slice(0, 15).map((map) => (
            <Link 
              key={`recent-${map.id}`} 
              href={`/play/${map.id}`}
              className="snap-start shrink-0 w-48 overflow-hidden rounded-xl bg-slate-800 border border-slate-700"
            >
              <div className="h-28 bg-slate-950">
                <img src={map.thumbnail_url} alt={map.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-2 text-sm font-bold truncate">{map.title}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* All Games: 2-Column Grid */}
      <section>
        <h2 className="text-lg font-bold text-slate-300 mb-3">Discover</h2>
        <div className="grid grid-cols-2 gap-4">
          {maps.map((map) => (
            <div key={`all-${map.id}`} className="flex flex-col overflow-hidden rounded-xl bg-slate-800 border border-slate-700">
              {/* 3. RESTORED PHOTOS AND JOIN BUTTONS */}
              <div className="h-32 bg-slate-950 relative">
                <img src={map.thumbnail_url} alt={map.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-3 flex flex-col gap-2">
                <h3 className="text-sm font-bold truncate">{map.title}</h3>
                <Link 
                  href={`/play/${map.id}`}
                  className="w-full bg-emerald-500 text-slate-950 py-2 rounded-md font-black text-center text-sm active:scale-95 transition-transform"
                >
                  JOIN
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )

  // --- TAB: AVATAR ---
  const renderAvatar = () => (
    <div className="flex flex-col items-center justify-center h-full pt-20">
      <div className="h-64 w-64 bg-slate-800 rounded-2xl border-4 border-amber-400 shadow-xl flex items-center justify-center overflow-hidden relative">
        <User size={120} className="text-slate-500" />
      </div>
    </div>
  )

  // --- TAB: SETTINGS ---
  const renderSettings = () => (
    <div className="h-full flex flex-col p-4 pt-10">
      <h2 className="text-2xl font-black mb-6">Menu</h2>
      
      {/* 4. FIXED SETTINGS LAYOUT (Two-row box style grid) */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Box 1: Theme */}
        <button className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform">
          <Sun size={32} className="text-amber-400" />
          <span className="font-bold">Light/Dark</span>
        </button>

        {/* Box 2: Studio */}
        <Link href="/studio" className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform">
          <MonitorPlay size={32} className="text-amber-400" />
          <span className="font-bold">Studio</span>
        </Link>

        {/* Box 3: Empty Settings (Spans 2 columns to make a wide row box) */}
        <button className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center gap-3 col-span-2 active:scale-95 transition-transform">
          <Cog size={32} className="text-slate-500" />
          <span className="font-bold text-slate-500">Settings</span>
        </button>

      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24 h-screen overflow-y-auto">
      {/* Active Tab Logic */}
      {activeTab === 'home' && renderHome()}
      {activeTab === 'avatar' && renderAvatar()}
      {activeTab === 'settings' && renderSettings()}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full bg-slate-950/90 backdrop-blur-md border-t border-slate-800 pb-safe z-50">
        <div className="flex justify-around p-2 max-w-md mx-auto">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center p-2 rounded-xl w-20 transition-all ${activeTab === 'home' ? 'text-amber-400 scale-110' : 'text-slate-500'}`}>
            <Home size={24} />
            <span className="text-[10px] font-bold mt-1">Home</span>
          </button>
          <button onClick={() => setActiveTab('avatar')} className={`flex flex-col items-center p-2 rounded-xl w-20 transition-all ${activeTab === 'avatar' ? 'text-amber-400 scale-110' : 'text-slate-500'}`}>
            <User size={24} />
            <span className="text-[10px] font-bold mt-1">Avatar</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center p-2 rounded-xl w-20 transition-all ${activeTab === 'settings' ? 'text-amber-400 scale-110' : 'text-slate-500'}`}>
            <SettingsIcon size={24} />
            <span className="text-[10px] font-bold mt-1">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
