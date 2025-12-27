'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, QrCode } from 'lucide-react'
// 1. Import the Browser Client creator
import { createBrowserClient } from '@supabase/ssr'

export default function SetupPage() {
  const [deviceId, setDeviceId] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 2. Initialize Supabase for the Browser
  // We cannot use the '@/lib/supabase/server' client here because it uses cookies()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
  
  const router = useRouter()

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 3. Get Current User
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError("You must be logged in to claim a device.")
      setLoading(false)
      return
    }

    // 4. The Atomic Claim Operation
    const { data, error: updateError } = await supabase
      .from('devices')
      .update({ 
        user_id: user.id,          
        device_name: deviceName,   
        status: 'online'           
      })
      .eq('device_id', deviceId)   
      .is('user_id', null)         
      .select()

    if (updateError) {
      console.error(updateError)
      setError("Database error. Please try again.")
    } else if (!data || data.length === 0) {
      setError("Device not found or already claimed by someone else.")
    } else {
      router.push('/dashboard')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100">
        
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full shadow-inner">
            <QrCode className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-center text-slate-900 mb-2">Claim Device</h1>
        <p className="text-slate-500 text-center mb-8 font-medium">Enter the Serial ID found on your Smart Pot.</p>

        <form onSubmit={handleClaim} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
              Serial Number
            </label>
            <input 
              type="text" 
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value.toUpperCase())}
              placeholder="PLANT-01"
              className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-green-500 focus:ring-0 outline-none font-bold text-slate-700 placeholder:text-slate-300 transition-all uppercase"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
              Name Your Plant
            </label>
            <input 
              type="text" 
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g. Kitchen Basil"
              className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-green-500 focus:ring-0 outline-none font-bold text-slate-700 placeholder:text-slate-300 transition-all"
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-500 text-sm rounded-xl font-bold text-center border border-red-100">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black text-lg rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : "ACTIVATE DEVICE"}
          </button>

          <p className="text-center text-xs text-slate-400 font-medium mt-4">
            By activating, you agree to become the plant's guardian. 🌱
          </p>
        </form>
      </div>
    </div>
  )
}