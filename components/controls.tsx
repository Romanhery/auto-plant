'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Zap, ZapOff, Loader2, Droplets } from 'lucide-react'
import { sendCommand } from '@/app/devices/[id]/actions'
// import { toast } from 'sonner' // Assuming sonner is used, or basic alert

export default function Controls() {
    const [devices, setDevices] = useState<any[]>([])
    const [selectedDevice, setSelectedDevice] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )

    useEffect(() => {
        async function fetchDevices() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('devices')
                .select('*')
                .eq('user_id', user.id)

            if (data) {
                setDevices(data)
                if (data.length > 0) {
                    setSelectedDevice(data[0].device_name)
                }
            }
            setLoading(false)
        }
        fetchDevices()
    }, [])

    const handleCommand = async (command: string) => {
        if (!selectedDevice) return

        setActionLoading(command)
        try {
            // Optimistic update or just fire and forget with toast
            const result = await sendCommand(selectedDevice, command)

            if (result.success) {
                // toast.success(`Command ${command} sent!`)
                console.log("Command sent successfully via Server Action")
            } else {
                console.error("Failed to send command", result.error)
            }
        } catch (err) {
            console.error("Error invoking action:", err)
        } finally {
            // Simulate a small delay for better UX so user sees the loading state
            setTimeout(() => setActionLoading(null), 500)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        )
    }

    if (devices.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Droplets className="handleTurnOnt-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">No Devices Found</h3>
                <p className="text-slate-500 max-w-xs mt-2">You need to pair a device before you can control it.</p>
                <a href="/setup" className="mt-6 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors">
                    Add Device
                </a>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">

                {/* Header Section */}
                <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-black mb-2">Manual Control</h1>
                        <p className="text-slate-400 font-medium">Override auto-settings to control your pump directly.</p>
                    </div>
                </div>

                {/* Device Selector */}
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Target Device
                    </label>
                    <select
                        value={selectedDevice}
                        onChange={(e) => setSelectedDevice(e.target.value)}
                        className="w-full p-4 rounded-xl bg-white border-2 border-slate-200 focus:border-green-500 focus:ring-0 outline-none font-bold text-slate-700 transition-all cursor-pointer appearance-none"
                    >
                        {devices.map(d => (
                            <option key={d.id} value={d.device_name}>
                                {d.device_name} ({d.status || 'Offline'})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Action Buttons */}
                <div className="p-8 grid gap-6">

                    <button
                        onClick={() => handleCommand('PUMP_ON')}
                        disabled={!!actionLoading}
                        className={`
              group relative overflow-hidden w-full p-6 rounded-2xl border-2 transition-all duration-300
              ${actionLoading === 'PUMP_ON' ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/10'}
            `}
                    >
                        <div className="flex items-center gap-6">
                            <div className={`p-4 rounded-full transition-colors ${actionLoading === 'PUMP_ON' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600 group-hover:bg-green-500 group-hover:text-white'}`}>
                                {actionLoading === 'PUMP_ON' ? <Loader2 className="animate-spin h-8 w-8" /> : <Zap className="h-8 w-8" />}
                            </div>
                            <div className="text-left">
                                <h3 className={`text-xl font-black mb-1 transition-colors ${actionLoading === 'PUMP_ON' ? 'text-green-800' : 'text-slate-800 group-hover:text-green-700'}`}>
                                    TURN PUMP ON
                                </h3>
                                <p className="text-sm text-slate-500 font-medium">Force the water pump to start immediately.</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleCommand('PUMP_OFF')}
                        disabled={!!actionLoading}
                        className={`
              group relative overflow-hidden w-full p-6 rounded-2xl border-2 transition-all duration-300
              ${actionLoading === 'PUMP_OFF' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10'}
            `}
                    >
                        <div className="flex items-center gap-6">
                            <div className={`p-4 rounded-full transition-colors ${actionLoading === 'PUMP_OFF' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600 group-hover:bg-red-500 group-hover:text-white'}`}>
                                {actionLoading === 'PUMP_OFF' ? <Loader2 className="animate-spin h-8 w-8" /> : <ZapOff className="h-8 w-8" />}
                            </div>
                            <div className="text-left">
                                <h3 className={`text-xl font-black mb-1 transition-colors ${actionLoading === 'PUMP_OFF' ? 'text-red-800' : 'text-slate-800 group-hover:text-red-700'}`}>
                                    TURN PUMP OFF
                                </h3>
                                <p className="text-sm text-slate-500 font-medium">Deactivate the water pump immediately.</p>
                            </div>
                        </div>
                    </button>

                </div>

                <div className="px-8 pb-8 text-center text-xs text-slate-400 font-medium">
                    Note: Commands may take up to 30 seconds to be processed by your device.
                </div>

            </div>
        </div>
    )
}