'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { AuthGateway } from '../components/AuthGateway'
import GameCard from '../../components/GameCard'
import type { Session } from '@supabase/supabase-js'
import gameData from '../../public/gameData.json'
import {
  Home as HomeIcon, User, Settings as SettingsIcon,
  Sun, MonitorPlay, Cog, Plus, Search, X, Check,
  UserMinus, ArrowLeft, Upload, Code2, ChevronLeft,
  ChevronRight, Loader2
} from 'lucide-react'
import Link from 'next/link'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export interface GameInfo {
  id: string
  title: string
  imageUrl: string
  slug: string
  websocketPort: number
  metaDescription: string
  markdown: string
  images?: { url: string; width: number; height: number; alt: string; type: string }[]
}

// ── Live 3D Avatar Asset List ────────────────────────────────────────────────
const AVATARS = [
  { 
    id: 'default', 
    name: 'Default Hero', 
    url: 'https://notbloxo.fra1.cdn.digitaloceanspaces.com/Notblox-Assets/character/Character.glb' 
  },
]

// ── 3D Avatar Viewer ──────────────────────────────────────────────────────────
function AvatarViewer({ index, size = 'large' }: { index: number; size?: 'large' | 'small' }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    setIsLoading(true)
    setLoadError(false)

    const W = el.clientWidth || (size === 'small' ? 64 : 300)
    const H = el.clientHeight || (size === 'small' ? 64 : 300)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
    
    // Position camera based on normalized asset size (height normalized to 2 units)
    if (size === 'small') {
      // Focused headshot close-up view
      camera.position.set(0, 1.45, 1.1)
      camera.lookAt(0, 1.45, 0)
    } else {
      // Full body framing
      camera.position.set(0, 1.1, 3.2)
      camera.lookAt(0, 1.0, 0)
    }

    // Lighting config
    scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const dir = new THREE.DirectionalLight(0xffffff, 1.6)
    dir.position.set(3, 8, 5)
    dir.castShadow = true
    scene.add(dir)

    if (size === 'large') {
      const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 0.05, 48),
        new THREE.MeshStandardMaterial({ color: 0x1e1e38, roughness: 0.5 })
      )
      platform.position.y = -0.01
      platform.receiveShadow = true
      scene.add(platform)
    }

    const avatarDef = AVATARS[index] ?? AVATARS[0]
    const loader = new GLTFLoader()
    let loadedModel: THREE.Group | null = null

    loader.load(
      avatarDef.url,
      (gltf) => {
        loadedModel = gltf.scene

        // Calculate exact boundaries to auto-scale assets perfectly
        const box = new THREE.Box3().setFromObject(loadedModel)
        const center = box.getCenter(new THREE.Vector3())
        const sizeBox = box.getSize(new THREE.Vector3())

        // Re-center model pivot points cleanly
        loadedModel.position.x -= center.x
        loadedModel.position.z -= center.z
        loadedModel.position.y -= box.min.y // Force feet to stick directly on Y = 0 ground level

        // Normalize scaling to a fixed height of 2 units tall
        const maxDim = Math.max(sizeBox.x, sizeBox.y, sizeBox.z)
        if (maxDim > 0) {
          const normScale = 2.0 / maxDim
          loadedModel.scale.set(normScale, normScale, normScale)
        }

        loadedModel.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
            // Prevent transparent asset parts from discarding depths
            if (child.material) child.material.depthWrite = true
          }
        })

        scene.add(loadedModel)
        setIsLoading(false)
      },
      undefined,
      (error) => {
        console.error('Failed to load character file asset from network layer:', error)
        setIsLoading(false)
        setLoadError(true)
      }
    )

    let angle = 0
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      if (loadedModel) {
        angle += 0.012
        loadedModel.rotation.y = angle
      }
      renderer.render(scene, camera)
    }
    animate()

    // Clean up context loops
    return () => {
      cancelAnimationFrame(animId)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [index, size])

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d1f]/60 z-10">
          <Loader2 className="animate-spin text-amber-400 w-5 h-5" />
        </div>
      )}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/20 z-10">
          <span className="text-[10px] text-red-400 font-bold">Error</span>
        </div>
      )}
      <div ref={mountRef} className="w-full h-full" />
    </div>
  )
}

// ── Friend circle ─────────────────────────────────────────────────────────────
function FriendCircle({ username, avatarId, onClick }: { username: string; avatarId: string; onClick?: () => void }) {
  const idx = AVATARS.findIndex(a => a.id === avatarId)
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 shrink-0 active:scale-95">
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 bg-[#12122a]">
        <AvatarViewer index={idx < 0 ? 0 : idx} size="small" />
      </div>
      <span className="text-white text-xs font-semibold max-w-[64px] truncate">{username}</span>
    </button>
  )
}

// ── Map Upload Page ───────────────────────────────────────────────────────────
function MapUploadPage({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [title, setTitle] = useState('')
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [mapFile, setMapFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const ALLOWED_ICON = ['image/png', 'image/jpeg', 'image/webp']
  const DANGEROUS = ['application/x-msdownload', 'application/x-sh', 'text/javascript',
    'application/javascript', 'application/x-executable', 'application/x-elf']

  function handleIcon(file: File) {
    if (DANGEROUS.includes(file.type)) { setError('Dangerous file type rejected.'); return }
    if (!ALLOWED_ICON.includes(file.type)) { setError('Icon must be PNG, JPG or WEBP.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Icon must be under 5MB.'); return }
    setError(null)
    setIconFile(file)
    setIconPreview(URL.createObjectURL(file))
  }

  function handleMap(file: File) {
    if (DANGEROUS.includes(file.type)) { setError('Dangerous file type rejected.'); return }
    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      setError('Map must be a .glb or .gltf file.')
      return
    }
    if (file.size > 100 * 1024 * 1024) { setError('Map must be under 100MB.'); return }
    setError(null)
    setMapFile(file)
  }

  async function handleCreate() {
    if (!title.trim()) { setError('Please enter a map title.'); return }
    if (!iconFile) { setError('Please upload a map icon.'); return }
    if (!mapFile) { setError('Please upload a map GLB file.'); return }

    setUploading(true)
    setError(null)

    try {
      const slug = title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

      // Upload icon
      const iconExt = iconFile.name.split('.').pop()
      const iconPath = `map-icons/${slug}-${Date.now()}.${iconExt}`
      const { error: iconErr } = await supabase.storage
        .from('game-assets').upload(iconPath, iconFile, { upsert: true })
      if (iconErr) throw iconErr

      const { data: iconData } = supabase.storage.from('game-assets').getPublicUrl(iconPath)

      // Upload map GLB
      const mapPath = `user-maps/${userId}/${slug}-${Date.now()}.glb`
      const { error: mapErr } = await supabase.storage
        .from('game-assets').upload(mapPath, mapFile, { upsert: true })
      if (mapErr) throw mapErr

      const { data: mapData } = supabase.storage.from('game-assets').getPublicUrl(mapPath)

      // Save to maps table
      const { error: dbErr } = await supabase.from('maps').insert({
        owner_id: userId,
        title: title.trim(),
        slug,
        icon_url: iconData.publicUrl,
        map_url: mapData.publicUrl,
        is_published: true,
      })
      if (dbErr) throw dbErr

      setSuccess(true)
      setTimeout(onBack, 1500)
    } catch (e: any) {
      setError(e.message ?? 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button onClick={onBack} className="p-2 rounded-full bg-white/10"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="font-bold text-lg">Upload Map</h2>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {error && <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 text-red-400 text-sm">{error}</div>}
        {success && <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-3 text-green-400 text-sm">Map created! Redirecting...</div>}

        <div>
          <label className="text-slate-400 text-xs uppercase tracking-widest mb-1 block">Map Title</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400"
            placeholder="My Awesome Map"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="text-slate-400 text-xs uppercase tracking-widest mb-1 block">Map Icon</label>
          <label className="block w-full border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 transition-colors"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleIcon(f) }}>
            {iconPreview
              ? <img src={iconPreview} className="w-24 h-24 rounded-xl mx-auto object-cover" />
              : <><Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-slate-400 text-sm">Drag & drop icon or tap to choose</p><p className="text-slate-600 text-xs mt-1">PNG, JPG, WEBP — max 5MB</p></>
            }
            <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.webp" onChange={e => { if (e.target.files?.[0]) handleIcon(e.target.files[0]) }} />
          </label>
        </div>

        <div>
          <label className="text-slate-400 text-xs uppercase tracking-widest mb-1 block">Map File (.glb)</label>
          <label className="block w-full border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 transition-colors"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleMap(f) }}>
            {mapFile
              ? <><div className="w-12 h-12 bg-amber-400/20 rounded-xl flex items-center justify-center mx-auto mb-2"><Upload className="w-6 h-6 text-amber-400" /></div><p className="text-white font-semibold text-sm">{mapFile.name}</p><p className="text-slate-400 text-xs">{(mapFile.size / 1024 / 1024).toFixed(1)} MB</p></>
              : <><Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" /><p className="text-slate-400 text-sm">Drag & drop .glb map file or tap</p><p className="text-slate-600 text-xs mt-1">GLB or GLTF — max 100MB</p></>
            }
            <input type="file" className="hidden" accept=".glb,.gltf" onChange={e => { if (e.target.files?.[0]) handleMap(e.target.files[0]) }} />
          </label>
        </div>

        <button
          onClick={handleCreate}
          disabled={uploading}
          className="w-full py-4 bg-amber-400 text-black font-bold rounded-xl active:scale-95 disabled:opacity-50 disabled:scale-100 transition-transform"
        >
          {uploading ? 'Uploading...' : 'Create Map'}
        </button>
      </div>
    </div>
  )
}

// ── Dev Tools Page ────────────────────────────────────────────────────────────
function DevToolsPage({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [myMaps, setMyMaps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('maps').select('*').eq('owner_id', userId).then(({ data }) => {
      setMyMaps(data ?? [])
      setLoading(false)
    })
  }, [userId])

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button onClick={onBack} className="p-2 rounded-full bg-white/10"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="font-bold text-lg">Dev Tools</h2>
      </div>

      <div className="p-4">
        {loading && <p className="text-slate-400 text-sm">Loading your maps...</p>}
        {!loading && myMaps.length === 0 && (
          <div className="text-center py-10">
            <Code2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No maps yet. Upload one first!</p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {myMaps.map(map => (
            <Link
              key={map.id}
              href={`/play/${map.slug}?dev=true`}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 active:scale-95 transition-transform"
            >
              {map.icon_url
                ? <img src={map.icon_url} className="w-14 h-14 rounded-xl object-cover" />
                : <div className="w-14 h-14 rounded-xl bg-amber-400/20 flex items-center justify-center"><Code2 className="w-6 h-6 text-amber-400" /></div>
              }
              <div className="flex-1">
                <p className="text-white font-bold">{map.title}</p>
                <p className="text-slate-400 text-xs">/{map.slug}</p>
                <p className="text-amber-400 text-xs mt-1">Tap to test solo →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Friends Panel ─────────────────────────────────────────────────────────────
function FriendsPanel({ session, onBack }: { session: Session; onBack: () => void }) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [pendingIn, setPendingIn] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  const uid = session.user.id

  const loadFriends = useCallback(async () => {
    const { data } = await supabase
      .from('friend_requests')
      .select('*, from:from_id(id,username,avatar_id), to:to_id(id,username,avatar_id)')
      .or(`from_id.eq.${uid},to_id.eq.${uid}`)
    if (!data) return
    setFriends(data.filter(r => r.status === 'accepted').map(r => r.from_id === uid ? r.to : r.from))
    setPendingIn(data.filter(r => r.status === 'pending' && r.to_id === uid).map(r => ({ ...r.from, requestId: r.id })))
  }, [uid])

  useEffect(() => { loadFriends() }, [loadFriends])

  async function searchUsers(q: string) {
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    const { data } = await supabase.from('profiles').select('id,username,avatar_id')
      .ilike('username', `%${q}%`).neq('id', uid).limit(10)
    setSearchResults(data ?? [])
    setSearching(false)
  }

  async function sendRequest(toId: string) {
    await supabase.from('friend_requests').insert({ from_id: uid, to_id: toId })
    setSearchResults(p => p.filter(u => u.id !== toId))
    loadFriends()
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
    await supabase.from('friend_requests').delete()
      .or(`and(from_id.eq.${uid},to_id.eq.${friendId}),and(from_id.eq.${friendId},to_id.eq.${uid})`)
    loadFriends()
  }

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button onClick={onBack} className="p-2 rounded-full bg-white/10"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="font-bold text-lg flex-1">Friends</h2>
        <button onClick={() => setShowSearch(s => !s)} className="p-2 rounded-full bg-amber-400 text-black">
          <Search className="w-5 h-5" />
        </button>
      </div>

      {showSearch && (
        <div className="p-4 border-b border-white/10">
          <input className="w-full bg-white/10 rounded-xl px-4 py-2 text-white outline-none"
            placeholder="Search username..." value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); searchUsers(e.target.value) }} />
          {searching && <p className="text-slate-400 text-sm mt-2">Searching...</p>}
          <div className="flex flex-col gap-2 mt-3">
            {searchResults.map(u => (
              <div key={u.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#12122a] border border-amber-400">
                  <AvatarViewer index={0} size="small" />
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

      {pendingIn.length > 0 && (
        <div className="p-4 border-b border-white/10">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">Requests ({pendingIn.length})</p>
          {pendingIn.map(u => (
            <div key={u.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 mb-2">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#12122a] border border-amber-400">
                <AvatarViewer index={0} size="small" />
              </div>
              <span className="flex-1 font-semibold">{u.username}</span>
              <button onClick={() => acceptRequest(u.requestId)} className="p-2 bg-green-500 rounded-full text-white mr-1"><Check className="w-4 h-4" /></button>
              <button onClick={() => rejectRequest(u.requestId)} className="p-2 bg-red-500 rounded-full text-white"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      <div className="p-4">
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">Friends ({friends.length})</p>
        {friends.length === 0 && <p className="text-slate-600 text-sm">No friends yet. Search to add some!</p>}
        {friends.map(f => (
          <div key={f.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 mb-2">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#12122a] border border-amber-400">
              <AvatarViewer index={0} size="small" />
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
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [avatarIndex, setAvatarIndex] = useState(0)
  const [friends, setFriends] = useState<any[]>([])
  const [uploadedMaps, setUploadedMaps] = useState<GameInfo[]>([])
  const [page, setPage] = useState<'main' | 'friends' | 'upload' | 'devtools'>('main')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    supabase
      .from('maps')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const formatted: GameInfo[] = data.map(map => ({
            id: map.id,
            title: map.title,
            slug: map.slug,
            imageUrl: map.icon_url || '', 
            websocketPort: 8080,
            metaDescription: `Created by user`,
            markdown: ''
          }))
          setUploadedMaps(formatted)
        }
      })
  }, [page])

  useEffect(() => {
    if (!session) return
    const uid = session.user.id
    supabase.from('friend_requests')
      .select('*, from:from_id(id,username,avatar_id), to:to_id(id,username,avatar_id)')
      .or(`from_id.eq.${uid},to_id.eq.${uid}`)
      .then(({ data }) => {
        if (!data) return
        setFriends(data.filter(r => r.status === 'accepted').map(r => r.from_id === uid ? r.to : r.from))
      })
  }, [session])

  if (loading) return (
    <div className="flex items-center justify-center w-screen h-screen bg-black text-white">
      <div className="text-xl font-bold animate-pulse">Loading Account...</div>
    </div>
  )

  if (!session) return <AuthGateway onAuthSuccess={() => {}} />

  const staticGames = gameData as GameInfo[]
  const allGames = [...uploadedMaps, ...staticGames]
  
  const email = session.user.email ?? ''
  const username = email.split('@')[0]
  const uid = session.user.id

  if (page === 'friends') return <FriendsPanel session={session} onBack={() => setPage('main')} />
  if (page === 'upload') return <MapUploadPage userId={uid} onBack={() => setPage('main')} />
  if (page === 'devtools') return <DevToolsPage userId={uid} onBack={() => setPage('main')} />

  // ── HOME tab ──────────────────────────────────────────────────────────────
  const renderHome = () => (
    <div className="pb-24">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <span className="text-white font-black text-lg tracking-tight">The Eternal Star</span>
      </div>

      <div className="px-4 mt-4 flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 bg-[#12122a]">
            <AvatarViewer index={avatarIndex} size="small" />
          </div>
          <span className="text-white text-xs font-semibold max-w-[64px] truncate">{username}</span>
        </div>

        {friends.map(f => (
          <FriendCircle key={f.id} username={f.username} avatarId={f.avatar_id ?? 'default'} />
        ))}

        <button onClick={() => setPage('friends')} className="flex flex-col items-center gap-1 shrink-0 active:scale-95">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center bg-white/5">
            <Plus className="w-6 h-6 text-slate-400" />
          </div>
          <span className="text-slate-500 text-xs">Add</span>
        </button>
      </div>

      <section className="px-4 mt-6">
        <h2 className="text-lg font-bold text-slate-300 mb-3">Last Played</h2>
        <div className="flex overflow-x-auto space-x-4 pb-4 no-scrollbar">
          {allGames.slice(0, 5).map((game, i) => (
            <div key={i} className="shrink-0 w-40"><GameCard {...game} /></div>
          ))}
        </div>
      </section>

      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-slate-300 mb-3">Discover</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {allGames.map((game, i) => (
            <div key={i} className={i === allGames.length - 1 && allGames.length % 2 !== 0 ? 'md:col-span-2' : ''}>
              <GameCard {...game} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── AVATAR tab ────────────────────────────────────────────────────────────
  const renderAvatar = () => (
    <div className="flex flex-col items-center gap-5 pb-24 px-4 pt-4">
      <div className="w-full rounded-2xl border border-white/10 overflow-hidden bg-[#12122a]" style={{ height: '55vh' }}>
        <AvatarViewer index={avatarIndex} size="large" />
      </div>
      <div className="flex items-center justify-between w-full bg-white/5 rounded-2xl px-4 py-3 border border-white/10">
        <button onClick={() => setAvatarIndex(i => (i - 1 + AVATARS.length) % AVATARS.length)}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-90">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-white font-bold">{AVATARS[avatarIndex].name}</p>
          <p className="text-slate-500 text-xs">{avatarIndex + 1} / {AVATARS.length}</p>
        </div>
        <button onClick={() => setAvatarIndex(i => (i + 1) % AVATARS.length)}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-90">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <button className="w-full py-3 bg-amber-400 text-black font-bold rounded-xl active:scale-95">Equip</button>
    </div>
  )

  // ── SETTINGS tab ──────────────────────────────────────────────────────────
  const renderSettings = () => (
    <div className="p-6 pt-10">
      <h2 className="text-2xl font-black mb-8">Menu</h2>
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3 active:scale-95 border border-slate-700">
          <Sun size={32} className="text-amber-400" />
          <span className="font-bold">Theme</span>
        </button>
        <Link href="/studio" className="bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3 active:scale-95 border border-slate-700">
          <MonitorPlay size={32} className="text-amber-400" />
          <span className="font-bold">Studio</span>
        </Link>
        <button onClick={() => setPage('upload')} className="bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3 active:scale-95 border border-slate-700">
          <Upload size={32} className="text-amber-400" />
          <span className="font-bold">Map Upload</span>
        </button>
        <button onClick={() => setPage('devtools')} className="bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3 active:scale-95 border border-slate-700">
          <Code2 size={32} className="text-amber-400" />
          <span className="font-bold">Dev Tools</span>
        </button>
        <button className="col-span-2 bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3 active:scale-95 border border-slate-700 opacity-50">
          <Cog size={32} className="text-slate-500" />
          <span className="font-bold text-slate-500">Settings</span>
        </button>
        <button onClick={() => supabase.auth.signOut()}
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

      <nav className="fixed bottom-0 w-full bg-slate-950/90 backdrop-blur-md border-t border-slate-800 p-2 z-50">
        <div className="flex justify-around max-w-md mx-auto">
          {[
            { id: 'home', icon: <HomeIcon size={24} />, label: 'Home' },
            { id: 'avatar', icon: <User size={24} />, label: 'Avatar' },
            { id: 'settings', icon: <SettingsIcon size={24} />, label: 'Menu' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center p-2 rounded-xl w-20 transition-all ${activeTab === tab.id ? 'text-amber-400 scale-110' : 'text-slate-500'}`}>
              {tab.icon}
              <span className="text-[10px] font-bold mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
