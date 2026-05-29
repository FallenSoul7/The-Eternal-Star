'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, Image as ImageIcon, Box, Loader2 } from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function Studio() {
  const [title, setTitle] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title || !thumbnailFile || !modelFile) {
      setStatusMessage('⚠️ Please fill out all fields and attach both files.')
      return
    }

    setUploading(true)
    setStatusMessage('Uploading assets to Supabase...')

    try {
      // 1. Upload Thumbnail Image to the 'game-assets' bucket
      const thumbExt = thumbnailFile.name.split('.').pop()
      const thumbPath = `thumbnails/${Date.now()}_${Math.random().toString(36).substring(7)}.${thumbExt}`
      
      const { error: thumbError } = await supabase.storage
        .from('game-assets')
        .upload(thumbPath, thumbnailFile)

      if (thumbError) throw thumbError

      // 2. Upload 3D Model (.glb) to the 'game-assets' bucket
      setStatusMessage('Uploading 3D Model...')
      const modelPath = `models/${Date.now()}_${Math.random().toString(36).substring(7)}.glb`
      
      const { error: modelError } = await supabase.storage
        .from('game-assets')
        .upload(modelPath, modelFile)

      if (modelError) throw modelError

      // 3. Get Public URLs for both files
      const thumbUrl = supabase.storage.from('game-assets').getPublicUrl(thumbPath).data.publicUrl
      const modelUrl = supabase.storage.from('game-assets').getPublicUrl(modelPath).data.publicUrl

      // 4. Save to Database (assuming the table is named 'game_maps')
      setStatusMessage('Publishing map to database...')
      
      // We grab the user ID to link this map to the creator
      const { data: { session } } = await supabase.auth.getSession()
      
      const { error: dbError } = await supabase
        .from('game_maps')
        .insert([{ 
          title: title, 
          thumbnail_url: thumbUrl, 
          model_url: modelUrl,
          creator_id: session?.user.id 
        }])

      if (dbError) throw dbError

      // Reset form on success
      setStatusMessage('✅ Success! Map published to the network.')
      setTitle('')
      setThumbnailFile(null)
      setModelFile(null)
      
    } catch (error: any) {
      console.error('Upload failed:', error)
      setStatusMessage(`❌ Error: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 p-4 sticky top-0 z-10 flex items-center gap-4">
        <Link href="/" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
          <ArrowLeft size={20} className="text-amber-400" />
        </Link>
        <h1 className="text-xl font-black tracking-wide text-amber-400 uppercase">Creator Studio</h1>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-2xl mx-auto mt-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-2xl font-bold mb-2">Deploy New Map</h2>
          <p className="text-slate-400 text-sm mb-8">Upload a custom 3D environment to the server.</p>

          <form onSubmit={handleUpload} className="space-y-6">
            
            {/* Map Title */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Map Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cyber City Arena"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition"
                disabled={uploading}
              />
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Thumbnail Image (.jpg, .png)</label>
              <div className="relative flex items-center border-2 border-dashed border-slate-700 rounded-xl p-4 bg-slate-950/50 hover:border-amber-400 transition">
                <ImageIcon size={24} className="text-slate-500 mr-3" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <span className="text-sm text-slate-400 truncate">
                  {thumbnailFile ? thumbnailFile.name : 'Tap to select an image...'}
                </span>
              </div>
            </div>

            {/* 3D Model Upload */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">3D Environment (.glb)</label>
              <div className="relative flex items-center border-2 border-dashed border-slate-700 rounded-xl p-4 bg-slate-950/50 hover:border-amber-400 transition">
                <Box size={24} className="text-slate-500 mr-3" />
                <input
                  type="file"
                  accept=".glb"
                  onChange={(e) => setModelFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <span className="text-sm text-slate-400 truncate">
                  {modelFile ? modelFile.name : 'Tap to select a .glb file...'}
                </span>
              </div>
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className={`p-4 rounded-xl text-sm font-bold ${statusMessage.includes('❌') || statusMessage.includes('⚠️') ? 'bg-red-900/20 text-red-400 border border-red-900/50' : 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/50'}`}>
                {statusMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-amber-500 text-black font-black py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-amber-400 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {uploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  UPLOADING...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  PUBLISH MAP
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
