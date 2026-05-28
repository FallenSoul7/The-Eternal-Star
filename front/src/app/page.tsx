'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Home, User, Settings, Moon, Sun, MonitorPlay, Cog } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface GameMap {
  id: string
  title: string
  model_url: string
  thumbnail_url: string
}

export default function MainApp() {
  const [activeTab, setActiveTab] = useState('home')
  const [settingsTab, setSettingsTab] = useState('theme')
  const [maps, setMaps] = useState<GameMap[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMaps() {
      const { data, error } = await supabase.from('game_maps').select('*')
      if (!error && data) {
        setMaps(data)
      }
      setLoading(false)
    }
    fetchMaps()
  }, [])

  // --- TAB: HOME ---
  const renderHome = () => (
    <div className="p-4 space-y-6">
      <header className="pt-4 pb-2">
        <h1 className="text-3xl font-black tracking-wide text-amber-400">THE ETERNAL STAR</h1>
      </header>

      {/* Recent Games: Horizontal Scroll */}
      <section>
        <h2 className="text-lg font-bold text-slate-300 mb-3">Continue Playing</h2>
        {loading ? (
          <div className="h-32 bg-slate-800 animate-pulse rounded-xl"></div>
        ) : (
          <div className="flex overflow-x-auto space-x-4 pb-4 snap-x">
            {/* Slicing to simulate the 'Last 15' logic */}
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
        )}
      </section>

      {/* All Games: 2-Column Grid */}
      <section>
        <h2 className="text-lg font-bold text-slate-300 mb-3">Discover</h2>
        <div className="grid grid-cols-2 gap-4">
          {maps.map((map) => (
            <Link 
              key={`all-${map.id}`} 
              href={`/play/${map.id}`}
              className="overflow-hidden rounded-xl bg-slate-800 border border-slate-700 active:scale-95 transition-transform"
            >
              <div className="h-32 bg-slate-950">
                <img src={map.thumbnail_url} alt={map.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-2">
                <h3 className="text-sm font-bold truncate">{map.title}</h3>
                <span className="text-xs text-slate-400">0 Playing</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )

  // --- TAB: AVATAR ---
  const renderAvatar = () => (
    <div className="flex flex-col items-center justify-center h-full pt-20">
      <h2 className="text-2xl font-bold mb-8">Customize Avatar</h2>
      {/* Default Player Avatar Placeholder */}
      <div className="h-64 w-64 bg-slate-800 rounded-2xl border-4 border-amber-400 shadow-xl flex items-center justify-center overflow-hidden relative">
        <User size={120} className="text-slate-500" />
        <div className="absolute bottom-2 bg-black/50 px-3 py-1 rounded-full text-xs font-bold">Default Mesh</div>
      </div>
    </div>
  )

  // --- TAB: SETTINGS (Nested) ---
  const renderSettings = () => (
    <div className="h-full flex flex-col p-4">
      <h2 className="text-2xl font-bold mb-6 pt-4">Menu</h2>
      
      {/* Nested Tabs */}
      <div className="flex bg-slate-800 rounded-lg p-1 mb-6">
        <button onClick={() => setSettingsTab('theme')} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 ${settingsTab === 'theme' ? 'bg-amber-500 text-slate-900' : 'text-slate-400'}`}>
          <Sun size={16} /> Theme
        </button>
        <button onClick={() => setSettingsTab('studio')} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 ${settingsTab === 'studio' ? 'bg-amber-500 text-slate-900' : 'text-slate-400'}`}>
          <MonitorPlay size={16} /> Studio
        </button>
        <button onClick={() => setSettingsTab('general')} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 ${settingsTab === 'general' ? 'bg-amber-500 text-slate-900' : 'text-slate-400'}`}>
          <Cog size={16} /> Settings
        </button>
      </div>

      {/* Nested Tab Content */}
      <div className="bg-slate-800 rounded-xl p-6 flex-1">
        {settingsTab === 'theme' && (
          <div className="flex items-center justify-between">
            <span className="font-bold">Dark Mode</span>
            <button className="bg-amber-500 text-slate-900 px-4 py-2 rounded-lg font-bold">Toggle</button>
          </div>
        )}
        {settingsTab === 'studio' && (
          <div className="flex flex-col items-center text-center mt-10">
            <MonitorPlay size={48} className="text-amber-400 mb-4" />
            <h3 className="font-bold text-lg mb-2">Creator Studio</h3>
            <p className="text-slate-400 text-sm mb-6">Upload 3D models and deploy new maps instantly.</p>
            <Link href="/studio" className="bg-amber-500 text-slate-900 px-6 py-3 rounded-xl font-bold w-full">
              Open Studio Dashboard
            </Link>
          </div>
        )}
        {settingsTab === 'general' && (
          <div className="text-slate-400 text-center mt-10 italic">
            Advanced settings coming soon...
          </div>
        )}
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
      <nav className="fixed bottom-0 w-full bg-slate-950/90 backdrop-blur-md border-t border-slate-800 pb-safe">
        <div className="flex justify-around p-2 max-w-md mx-auto">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center p-2 rounded-xl w-20 transition-all ${activeTab === 'home' ? 'text-amber-400 scale-110' : 'text-slate-500'}`}
          >
            <Home size={24} />
            <span className="text-[10px] font-bold mt-1">Home</span>
          </button>

          <button 
            onClick={() => setActiveTab('avatar')}
            className={`flex flex-col items-center p-2 rounded-xl w-20 transition-all ${activeTab === 'avatar' ? 'text-amber-400 scale-110' : 'text-slate-500'}`}
          >
            <User size={24} />
            <span className="text-[10px] font-bold mt-1">Avatar</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center p-2 rounded-xl w-20 transition-all ${activeTab === 'settings' ? 'text-amber-400 scale-110' : 'text-slate-500'}`}
          >
            <Settings size={24} />
            <span className="text-[10px] font-bold mt-1">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
