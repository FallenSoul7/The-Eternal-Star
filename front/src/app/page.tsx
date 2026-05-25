'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/supabaseClient'
import { AuthGateway } from '@/components/AuthGateway'
import type { Session } from '@supabase/supabase-js'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

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

  // If authenticated, render the default NotBlox game interface
  // The original game component code will go here
  return null
}
