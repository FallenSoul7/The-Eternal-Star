'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { AuthGateway } from '../components/AuthGateway'
import GameCard from '../../components/GameCard'
import Navbar from '../../components/Navbar'
import type { Session } from '@supabase/supabase-js'
import gameData from '../../public/gameData.json'
import {
  Home as HomeIcon, User, Settings as SettingsIcon,
  Sun, MonitorPlay, Cog, Plus, Search, X, Check, UserMinus, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import * as THREE from 'three'

export interface GameInfo {
  title: string
  imageUrl: string
  slug: string
  metaDescription: string
  markdown: string
  images: { url: string; width: number; height: number; alt: string; type: string }[]
}

// ── Avatar 3D ─────────────────────────────────────────────────────────────────
function buildDefaultAvatar(scene: THREE.Scene) {
  const g = new THREE.Group()
  const skin = new THREE.MeshStandardMaterial({ color: 0xffd6a5 })
  const shirt = new THREE.MeshStandardMaterial({ color: 0x4f8ef7 })
  const pants = new THREE.MeshStandardMaterial({ color: 0x223388 })
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), skin)
  head.position.y = 1.6
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.5), shirt)
  torso.position.y = 0.7
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 0.35), shirt)
  lArm.position.set(-0.67, 0.7, 0)
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 0.35), shirt)
  rArm.position.set(0.67, 0.7, 0)
  const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, 0.4), pants)
  lLeg.position.set(-0.27, -0.4, 0)
  const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, 0.4), pants)
  rLeg.position.set(0.27, -0.4, 0)
  g.add(head, torso, lArm, rArm, lLeg, rLeg)
  g.position.y = 0.55
  scene.add(g)
  return g
}

function build6PAvatar(scene: THREE.Scene) {
  const g = new THREE.Group()
  const skin = new THREE.MeshStandardMaterial({ color: 0xffd6a5 })
  const shirt = new THREE.MeshStandardMaterial({ color: 0xe74c3c })
  const pants = new THREE.MeshStandardMaterial({ color: 0x2c3e50 })
  const head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), skin)
  head.position.y = 1.5
  const torso = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), shirt)
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2, 0.6), shirt)
  lArm.position.set(-1.3, 0, 0)
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2, 0.6), shirt)
  rArm.position.set(1.3, 0, 0)
  const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2, 0.85), pants)
  lLeg.position.set(-0.55, -2, 0)
  const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2, 0.85), pants)
  rLeg.position.set(0.55, -2, 0)
  g.add(head, torso, lArm, rArm, lLeg, rLeg)
  g.position.y = 1.0
  scene.add(g)
  return g
}

const AVATARS = [
  { id: 'default', name: 'Default', build: buildDefaultAvatar },
  { id: '6p', name: '6P Classic', build: build6PAvatar },
]

function AvatarViewer({ index, size = 'large' }: { index: number; size?: 'large' | 'small' }) {
  const mountRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    const W = el.clientWidth, H = el.clientHeight
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(window.devicePixelRatio)
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100)
    camera.position.set(0, 1.2, size === 'small' ? 6 : 5)
    camera.lookAt(0, 1, 0)
    scene.add(new THREE.AmbientLight(0xffffff, 0.8))
    const dir = new THREE.DirectionalLight(0xffffff, 1.2)
    dir.position.set(3, 6, 4)
    scene.add(dir)
    if (size === 'large') {
      const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 0.08, 48),
        new THREE.MeshStandardMaterial({ color: 0x1a1a2e })
      )
      platform.position.y = -1.0
      scene.add(platform)
    }
    const group = AVATARS[index].build(scene)
    let angle = 0, animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      angle += 0.01
      group.rotation.y = angle
      renderer.render(scene, camera)
    }
    animate()
    return () => { cancelAnimationFrame(animId); renderer.dispose(); el.removeChild(renderer.domElement) }
  }, [index, size])
  return <div ref={mountRef} className="w-full h-full" />
}

// ── Friend avatar circle ───────────────────────────────────────────────────────
function FriendCircle({ username, avatarId, onClick }: { username: string; avatarId: string; onClick?: () => void }) {
  const idx = AVATARS.findIndex(a => a.id === avatarId) ?? 0
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 active:scale-95">
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 bg-[#12122a]">
        <AvatarViewer index={idx < 0 ? 0 : idx} size="small" />
      </div>
      <span className="text-white text-xs font-semibold max-w-16 truncate">{username}</span>
    </button>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [avatarIndex, setAvatarIndex] = useState(0)

  // Friends state
  const [showFriends, setShowFriends] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [pendingIn, setPendingIn] = useState<any[]>([])
  const [pendingOut, setPendingOut] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) loadFriends()
  }, [session])

  async function loadFriends() {
    const uid = session!.user.id
    const { data } = await supabase
      .from('friend_requests')
      .select('*, from:from_id(id,username,avatar_id), to:to_id(id,username,avatar_id)')
      .or(`from_id.eq.${uid},to_id.eq.${uid}`)
    if (!data) return
    const accepted = data.filter(r => r.status === 'accepted').map(r =>
      r.from_id === uid ? r.to : r.from
    )
    const inbound = data.filter(r => r.status === 'pending' && r.to_id === uid).map(r => ({ ...r.from, requestId: r.id }))
    const outbound = data.filter(r => r.status === 'pending' && r.from_id === uid).map(r => ({ ...r.to, requestId: r.id }))
    setFriends(accepted)
    setPendingIn(inbound)
    setPendingOut(outbound)
  }

  async function searchUsers(q: string) {
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id,username,avatar_id')
      .ilike('username', `%${q}%`)
      .neq('id', session!.user.id)
      .limit(10)
    setSearchResults(data ?? [])
    setSearching(false)
  }

  async function sendRequest(toId: string) {
    await supabase.from('friend_requests').insert({ from_id: session!.user.id, to_id: toId })
    loadFriends()
    setSearchResults(prev => prev.filter(u => u.id !== toId))
  }

  async function acceptRequest(requestId: string) {
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId)
    loadFriends()
  }

  async function rejectRequest(requestId: string) {
    await supabase.from('friend_requests').delete().eq('id', requestId)
    loadFriends()
  }

  async function removeFriend(friendId: string) {
    const uid = session!.user.id
    await supabase.from('friend_requests')
      .delete()
      .or(`and(from_id.eq.${uid},to_id.eq.${friendId}),and(from_id.eq.${friendId},to_id.eq.${uid})`)
    loadFriends()
  }

  if (loading) return (
    <div className="flex items-center justify-center w-screen h-screen bg-black text-white">
      <div className="text-xl font-bold animate-pulse">Loading Account...</div>
    </div>
  )

  if (!session) return <AuthGateway onAuthSuccess={() => {}} />

  const games = gameData as GameInfo[]
  const email = session.user.email ?? ''
  const username = email.split('@')[0]

  // ── Friends Panel ──────────────────────────────────────────────────────────
  if (showFriends) return (
    <div className="min-h-screen bg-black text-white pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button onClick={() => { setShowFriends(false); setShowSearch(false) }} className="p-2 rounded-full bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg flex-1">Friends</h2>
        <button onClick={() => setShowSearch(s => !s)} className="p-2 rounded-full bg-amber-400 text-black">
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="p-4 border-b border-white/10">
          <input
            className="w-full bg-white/10 rounded-xl px-4 py-2 text-white outline-none"
            placeholder="Search username..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); searchUsers(e.target.value) }}
          />
          {searching && <p className="text-slate-400 text-sm mt-2">Searching...</p>}
          <div className="flex flex-col gap-2 mt-3">
            {searchResults.map(u => (
              <div key={u.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#12122a] border border-amber-400">
                  <AvatarViewer index={AVATARS.findIndex(a => a.id === u.avatar_id) < 0 ? 0 : AVATARS.findIndex(a => a.id === u.avatar_id)} size="small" />
                </div>
                <span className="flex-1 font-semibold">{u.username}</span>
                <button onClick={() => sendRequest(u.id)} className="p-2 bg-amber-400 rounded-full text-black">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending incoming requests */}
      {pendingIn.length > 0 && (
        <div className="p-4 border-b border-white/10">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">Requests</p>
          {pendingIn.map(u => (
            <div key={u.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 mb-2">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#12122a] border border-amber-400">
                <AvatarViewer index={AVATARS.findIndex(a => a.id === u.avatar_id) < 0 ? 0 : AVATARS.findIndex(a => a.id === u.avatar_id)} size="small" />
              </div>
              <span className="flex-1 font-semibold">{u.username}</span>
              <button onClick={() => acceptRequest(u.requestId)} className="p-2 bg-green-500 rounded-full text-white mr-1">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => rejectRequest(u.requestId)} className="p-2 bg-red-500 rounded-full text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Friends list */}
      <div className="p-4">
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">Friends ({friends.length})</p>
        {friends.length === 0 && <p className="text-slate-600 text-sm">No friends yet. Search to add some!</p>}
        {friends.map(f => (
          <div key={f.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 mb-2">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#12122a] border border-amber-400">
              <AvatarViewer index={AVATARS.findIndex(a => a.id === f.avatar_id) < 0 ? 0 : AVATARS.findIndex(a => a.id === f.avatar_id)} size="small" />
            </div>
            <span className="flex-1 font-semibold">{f.username}</span>
            <button onClick={() => removeFriend(f.id)} className="p-2 bg-white/10 rounded-full text-red-400">
              <UserMinus className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  // ── HOME tab ───────────────────────────────────────────────────────────────
  const renderHome = () => (
    <div className="pb-24">
      <Navbar />

      {/* Profile row + friend circles */}
      <div className="px-4 mt-4 flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
        {/* My avatar circle */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 bg-[#12122a]">
            <AvatarViewer index={avatarIndex} size="small" />
          </div>
          <span className="text-white text-xs font-semibold max-w-16 truncate">{username}</span>
        </div>

        {/* Friend circles */}
        {friends.map(f => (
          <FriendCircle key={f.id} username={f.username} avatarId={f.avatar_id} />
        ))}

        {/* Add friend button */}
        <button
          onClick={() => setShowFriends(true)}
          className="flex flex-col items-center gap-1 shrink-0 active:scale-95"
        >
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center bg-white/5">
            <Plus className="w-6 h-6 text-slate-400" />
          </div>
          <span className="text-slate-500 text-xs">Add</span>
        </button>
      </div>

      {/* Last Played */}
      <section className="px-4 mt-6">
        <h2 className="text-lg font-bold text-slate-300 mb-3">Last Played</h2>
        <div className="flex overflow-x-auto space-x-4 pb-4 no-scrollbar">
          {games.slice(0, 5).map((game, i) => (
            <div key={i} className="shrink-0 w-40"><GameCard {...game} /></div>
          ))}
        </div>
      </section>

      {/* Discover */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 px-4 mt-6">
        <h2 className="text-lg font-bold text-slate-300 mb-2 col-span-1 md:col-span-2">Discover</h2>
        {games.map((game, index) => (
          <div className={`col-span-1 ${index === games.length - 1 && games.length % 2 !== 0 ? 'md:col-span-2' : ''}`} key={index}>
            <GameCard {...game} />
          </div>
        ))}
      </div>
    </div>
  )

  // ── AVATAR tab ─────────────────────────────────────────────────────────────
  const renderAvatar = () => (
    <div className="flex flex-col items-center gap-5 pb-24 px-4 pt-4">
      <div className="w-full rounded-2xl border border-white/10 overflow-hidden bg-[#12122a]" style={{ height: '55vh' }}>
        <AvatarViewer index={avatarIndex} size="large" />
      </div>
      <div className="flex items-center justify-between w-full bg-white/5 rounded-2xl px-4 py-3 border border-white/10">
        <button onClick={() => setAvatarIndex(i => (i - 1 + AVATARS.length) % AVATARS.length)}
          className="p-2 bg-white/10 rounded-full active:scale-90 text-white text-xl font-bold w-10 h-10 flex items-center justify-center">‹</button>
        <div className="text-center">
          <p className="text-white font-bold">{AVATARS[avatarIndex].name}</p>
          <p className="text-slate-500 text-xs">{avatarIndex + 1} / {AVATARS.length}</p>
        </div>
        <button onClick={() => setAvatarIndex(i => (i + 1) % AVATARS.length)}
          className="p-2 bg-white/10 rounded-full active:scale-90 text-white text-xl font-bold w-10 h-10 flex items-center justify-center">›</button>
      </div>
      <button className="w-full py-3 bg-amber-400 text-black font-bold rounded-xl active:scale-95">Equip</button>
    </div>
  )

  // ── SETTINGS tab ───────────────────────────────────────────────────────────
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
        <button
          onClick={() => supabase.auth.signOut()}
          className="col-span-2 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 font-bold active:scale-95">
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {activeTab === 'home' && renderHome()}
      {activeTab === 'avatar' && renderAvatar()}
      {activeTab === 'settings' && renderSettings()}

      <nav className="fixed bottom-0 w-full bg-slate-950/90 backdrop-blur-md border-t border-slate-800 p-2 z-50 pb-safe">
        <div className="flex justify-around max-w-md mx-auto">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center p-2 rounded-xl w-20 transition-all ${activeTab === 'home' ? 'text-amber-400 scale-110' : 'text-slate-500'}`}>
            <HomeIcon size={24} /><span className="text-[10px] font-bold mt-1">Home</span>
          </button>
          <button onClick={() => setActiveTab('avatar')} className={`flex flex-col items-center p-2 rounded-xl w-20 transition-all ${activeTab === 'avatar' ? 'text-amber-400 scale-110' : 'text-slate-500'}`}>
            <User size={24} /><span className="text-[10px] font-bold mt-1">Avatar</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center p-2 rounded-xl w-20 transition-all ${activeTab === 'settings' ? 'text-amber-400 scale-110' : 'text-slate-500'}`}>
            <SettingsIcon size={24} /><span className="text-[10px] font-bold mt-1">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
