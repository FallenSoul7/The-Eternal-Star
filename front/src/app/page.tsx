'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { AuthGateway } from '../components/AuthGateway'
import GameCard from '../../components/GameCard'
import type { Session } from '@supabase/supabase-js'
import gameData from '../../public/gameData.json'
import { Home as HomeIcon, User, Settings as SettingsIcon, ChevronLeft, ChevronRight, Sun, MonitorPlay, Cog } from 'lucide-react'
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

// ── Avatar definitions ─────────────────────────────────────────────────────────
interface AvatarDef {
  id: string
  name: string
  build: (scene: THREE.Scene) => THREE.Group
}

function buildDefaultAvatar(): THREE.Group {
  const group = new THREE.Group()
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

  group.add(head, torso, lArm, rArm, lLeg, rLeg)
  // Center group so feet are at y=0
  group.position.y = 0.55
  return group
}

function build6PAvatar(): THREE.Group {
  const group = new THREE.Group()
  const skin = new THREE.MeshStandardMaterial({ color: 0xffd6a5 })
  const shirt = new THREE.MeshStandardMaterial({ color: 0xe74c3c })
  const pants = new THREE.MeshStandardMaterial({ color: 0x2c3e50 })

  const head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), skin)
  head.position.y = 1.5
  const torso = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), shirt)
  torso.position.y = 0.0
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2, 0.6), shirt)
  lArm.position.set(-1.3, 0.0, 0)
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2, 0.6), shirt)
  rArm.position.set(1.3, 0.0, 0)
  const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2, 0.85), pants)
  lLeg.position.set(-0.55, -2.0, 0)
  const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2, 0.85), pants)
  rLeg.position.set(0.55, -2.0, 0)

  group.add(head, torso, lArm, rArm, lLeg, rLeg)
  group.position.y = 1.0
  return group
}

const AVATARS: AvatarDef[] = [
  { id: 'default', name: 'Default', build: (s) => { const g = buildDefaultAvatar(); s.add(g); return g } },
  { id: '6p', name: '6P Classic', build: (s) => { const g = build6PAvatar(); s.add(g); return g } },
]

// ── 3D Avatar Viewer (large, for Avatar tab) ──────────────────────────────────
function AvatarViewer({ avatarIndex }: { avatarIndex: number }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    const W = el.clientWidth
    const H = el.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100)
    camera.position.set(0, 1.2, 5)
    camera.lookAt(0, 1, 0)

    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const dir = new THREE.DirectionalLight(0xffffff, 1.2)
    dir.position.set(3, 6, 4)
    dir.castShadow = true
    scene.add(dir)

    // Platform
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 0.08, 48),
      new THREE.MeshStandardMaterial({ color: 0x1a1a2e })
    )
    platform.position.y = -1.0
    platform.receiveShadow = true
    scene.add(platform)

    AVATARS[avatarIndex].build(scene)

    let angle = 0
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      angle += 0.008
      // Rotate avatar, not camera — smoother
      scene.children.forEach(c => {
        if (c instanceof THREE.Group) c.rotation.y = angle
      })
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [avatarIndex])

  return <div ref={mountRef} className="w-full h-full" />
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [avatarIndex, setAvatarIndex] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0f0f1a] text-white">Loading Account...</div>
  )

  if (!session) return <AuthGateway onLogin={() => {}} />

  const games = gameData as GameInfo[]
  const email = session.user.email ?? ''
  const username = email.split('@')[0]

  // ── HOME tab ───────────────────────────────────────────────────────────────
  const renderHome = () => (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-widest px-4 mb-2">Last Played</p>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
          {games.slice(0, 5).map((game, i) => (
            <div key={i} className="shrink-0 w-36"><GameCard game={game} /></div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-widest px-4 mb-2">Discover</p>
        <div className="grid grid-cols-2 gap-3 px-4">
          {games.map((game, i) => <GameCard key={i} game={game} />)}
        </div>
      </div>
    </div>
  )

  // ── AVATAR tab ─────────────────────────────────────────────────────────────
  const renderAvatar = () => (
    <div className="flex flex-col items-center gap-5 pb-24 px-4 pt-4">
      {/* 3D viewer — tall, fills most of screen */}
      <div className="w-full rounded-2xl border border-white/10 overflow-hidden bg-[#12122a]" style={{ height: '55vh' }}>
        <AvatarViewer avatarIndex={avatarIndex} />
      </div>

      {/* Selector arrows + name */}
      <div className="flex items-center justify-between w-full bg-white/5 rounded-2xl px-4 py-3 border border-white/10">
        <button
          onClick={() => setAvatarIndex(i => (i - 1 + AVATARS.length) % AVATARS.length)}
          className="p-2 bg-white/10 rounded-full active:scale-90"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center">
          <p className="text-white font-bold">{AVATARS[avatarIndex].name}</p>
          <p className="text-slate-500 text-xs">{avatarIndex + 1} / {AVATARS.length}</p>
        </div>
        <button
          onClick={() => setAvatarIndex(i => (i + 1) % AVATARS.length)}
          className="p-2 bg-white/10 rounded-full active:scale-90"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      <button className="w-full py-3 bg-amber-400 text-black font-bold rounded-xl active:scale-95 transition-transform">
        Equip
      </button>
    </div>
  )

  // ── SETTINGS tab ───────────────────────────────────────────────────────────
  const renderSettings = () => (
    <div className="flex flex-col gap-4 pb-24 px-4 pt-4">
      <p className="text-white font-bold text-xl">Menu</p>
      <div className="flex flex-col gap-2">
        <Link href="#" className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 text-white">
          <Sun className="w-5 h-5 text-amber-400" /> Theme
        </Link>
        <Link href="/studio" className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 text-white">
          <MonitorPlay className="w-5 h-5 text-amber-400" /> Studio
        </Link>
        <Link href="#" className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 text-white">
          <Cog className="w-5 h-5 text-amber-400" /> Settings
        </Link>
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-3 p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-400 font-semibold"
        >
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Profile bar — only on home tab */}
      {activeTab === 'home' && (
        <div className="sticky top-0 z-40 bg-[#0f0f1a]/95 backdrop-blur px-4 py-3 flex items-center gap-3 border-b border-white/5">
          <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-black font-bold text-sm shrink-0">
            {username[0]?.toUpperCase()}
          </div>
          <span className="text-white font-semibold text-sm">{username}</span>
        </div>
      )}

      {activeTab === 'home' && renderHome()}
      {activeTab === 'avatar' && renderAvatar()}
      {activeTab === 'settings' && renderSettings()}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0f0f1a]/95 backdrop-blur border-t border-white/10 flex justify-around py-3 z-50">
        {[
          { id: 'home', icon: <HomeIcon className="w-5 h-5" />, label: 'Home' },
          { id: 'avatar', icon: <User className="w-5 h-5" />, label: 'Avatar' },
          { id: 'settings', icon: <SettingsIcon className="w-5 h-5" />, label: 'Menu' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 px-5 py-1 rounded-xl transition-all ${activeTab === tab.id ? 'text-amber-400 scale-110' : 'text-slate-500'}`}
          >
            {tab.icon}
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
