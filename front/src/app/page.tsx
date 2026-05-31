'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { AuthGateway } from '../components/AuthGateway'
import GameCard from '../../components/GameCard'
import type { Session } from '@supabase/supabase-js'
import gameData from '../../public/gameData.json'
import { Home as HomeIcon, User, Settings as SettingsIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import * as THREE from 'three'

export interface GameInfo {
  title: string
  imageUrl: string
  slug: string
  metaDescription: string
  markdown: string
  images: { url: string; width: number; height: number; alt: string; type: string }[]
}

// ─── Avatar definitions ───────────────────────────────────────────────────────

interface AvatarDef {
  id: string
  name: string
  build: (scene: THREE.Scene) => void
}

function buildDefaultAvatar(scene: THREE.Scene) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x4f8ef7 })
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffd6a5 })

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), skinMat)
  head.position.set(0, 2.1, 0)
  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.6), mat)
  torso.position.set(0, 1.1, 0)
  // Left arm
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 0.35), mat)
  lArm.position.set(-0.68, 1.1, 0)
  // Right arm
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 0.35), mat)
  rArm.position.set(0.68, 1.1, 0)
  // Left leg
  const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, 0.4), new THREE.MeshStandardMaterial({ color: 0x2244aa }))
  lLeg.position.set(-0.28, 0, 0)
  // Right leg
  const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, 0.4), new THREE.MeshStandardMaterial({ color: 0x2244aa }))
  rLeg.position.set(0.28, 0, 0)

  ;[head, torso, lArm, rArm, lLeg, rLeg].forEach(m => {
    m.castShadow = true
    scene.add(m)
  })
}

function build6PAvatar(scene: THREE.Scene) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xe74c3c })
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffd6a5 })
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 })

  const head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), skinMat)
  head.position.set(0, 2.5, 0)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), mat)
  torso.position.set(0, 1, 0)
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2, 0.65), mat)
  lArm.position.set(-1.32, 1, 0)
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2, 0.65), mat)
  rArm.position.set(1.32, 1, 0)
  const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2, 0.9), legMat)
  lLeg.position.set(-0.55, -1, 0)
  const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2, 0.9), legMat)
  rLeg.position.set(0.55, -1, 0)

  ;[head, torso, lArm, rArm, lLeg, rLeg].forEach(m => {
    m.castShadow = true
    scene.add(m)
  })
}

const AVATARS: AvatarDef[] = [
  { id: 'default', name: 'Default', build: buildDefaultAvatar },
  { id: '6p', name: '6P Classic', build: build6PAvatar },
]

// ─── 3D Avatar Viewer ─────────────────────────────────────────────────────────
function AvatarViewer({ avatarIndex }: { avatarIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<{ renderer: THREE.WebGLRenderer; animId: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const W = canvas.clientWidth || 280
    const H = canvas.clientHeight || 320

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
    camera.position.set(0, 1.5, 5)
    camera.lookAt(0, 1, 0)

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dir = new THREE.DirectionalLight(0xffffff, 1)
    dir.position.set(3, 5, 3)
    dir.castShadow = true
    scene.add(dir)

    // Floor
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2, 32),
      new THREE.MeshStandardMaterial({ color: 0x1a1a2e })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.56
    floor.receiveShadow = true
    scene.add(floor)

    AVATARS[avatarIndex].build(scene)

    let angle = 0
    const animate = () => {
      const animId = requestAnimationFrame(animate)
      sceneRef.current = { renderer, animId }
      angle += 0.01
      camera.position.x = Math.sin(angle) * 5
      camera.position.z = Math.cos(angle) * 5
      camera.lookAt(0, 1, 0)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      if (sceneRef.current) cancelAnimationFrame(sceneRef.current.animId)
      renderer.dispose()
    }
  }, [avatarIndex])

  return <canvas ref={canvasRef} className="w-full h-full" />
}

// ─── Profile Circle ───────────────────────────────────────────────────────────
function ProfileCircle({ email, avatarIndex }: { email: string; avatarIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(40, 40)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 1.5, 4)
    camera.lookAt(0, 1, 0)
    scene.add(new THREE.AmbientLight(0xffffff, 0.8))
    const dir = new THREE.DirectionalLight(0xffffff, 1)
    dir.position.set(2, 3, 2)
    scene.add(dir)
    AVATARS[avatarIndex].build(scene)
    let angle = 0
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      angle += 0.02
      camera.position.x = Math.sin(angle) * 4
      camera.position.z = Math.cos(angle) * 4
      camera.lookAt(0, 1, 0)
      renderer.render(scene, camera)
    }
    animate()
    return () => { cancelAnimationFrame(animId); renderer.dispose() }
  }, [avatarIndex])

  const username = email.split('@')[0]

  return (
    <div className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      <span className="text-white text-sm font-semibold">{username}</span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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
    <div className="flex items-center justify-center h-screen bg-[#0f0f1a] text-white">
      Loading Account...
    </div>
  )

  if (!session) return <AuthGateway onLogin={() => {}} />

  const games = gameData as GameInfo[]
  const email = session.user.email ?? 'player@game.com'
  const username = email.split('@')[0]

  const renderHome = () => (
    <div className="flex flex-col gap-6 pb-24 pt-16">
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-widest px-4 mb-2">Last Played</p>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
          {games.slice(0, 5).map((game, i) => (
            <div key={i} className="shrink-0 w-36">
              <GameCard game={game} />
            </div>
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

  const renderAvatar = () => (
    <div className="flex flex-col items-center gap-6 pb-24 pt-6 px-4">
      {/* Profile header */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-2xl font-bold text-black">
          {username[0].toUpperCase()}
        </div>
        <p className="text-white font-bold text-lg">{username}</p>
        <p className="text-slate-400 text-xs">{email}</p>
      </div>

      {/* 3D Avatar viewer */}
      <div className="w-full bg-[#12122a] rounded-2xl border border-white/10 overflow-hidden" style={{ height: 320 }}>
        <AvatarViewer avatarIndex={avatarIndex} />
      </div>

      {/* Avatar selector */}
      <div className="flex items-center gap-4 w-full justify-center">
        <button
          onClick={() => setAvatarIndex(i => (i - 1 + AVATARS.length) % AVATARS.length)}
          className="p-3 bg-white/10 rounded-full text-white active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-white font-bold text-lg">{AVATARS[avatarIndex].name}</p>
          <p className="text-slate-400 text-xs">{avatarIndex + 1} / {AVATARS.length}</p>
        </div>
        <button
          onClick={() => setAvatarIndex(i => (i + 1) % AVATARS.length)}
          className="p-3 bg-white/10 rounded-full text-white active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Equip button */}
      <button className="w-full py-3 bg-amber-400 text-black font-bold rounded-xl active:scale-95">
        Equip Avatar
      </button>
    </div>
  )

  const renderSettings = () => (
    <div className="flex flex-col gap-4 pb-24 pt-6 px-4">
      <p className="text-white font-bold text-xl">Settings</p>
      <div className="bg-white/5 rounded-2xl p-4 flex flex-col gap-3 border border-white/10">
        <div className="flex justify-between items-center">
          <p className="text-white text-sm">Signed in as</p>
          <p className="text-slate-400 text-xs">{email}</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full py-2 bg-red-500/20 text-red-400 rounded-xl text-sm font-semibold border border-red-500/30"
        >
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white relative">
      {/* Profile pill top left */}
      <ProfileCircle email={email} avatarIndex={avatarIndex} />

      {/* Tab content */}
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
