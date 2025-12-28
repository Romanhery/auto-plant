'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAutoMode(
  deviceName: string,
  autoMode: boolean,
  settings?: {
    moistureThreshold?: number
    lightThreshold?: number
  }
) {
  const supabase = await createClient()

  const updateData: any = {
    auto_mode: autoMode
  }

  if (settings?.moistureThreshold !== undefined) {
    updateData.moisture_threshold = settings.moistureThreshold
  }

  if (settings?.lightThreshold !== undefined) {
    updateData.light_threshold = settings.lightThreshold
  }

  const { error } = await supabase
    .from('devices')
    .update(updateData)
    .eq('device_name', deviceName)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/devices/${encodeURIComponent(deviceName)}`)
  return { success: true }
}

export async function getDeviceSettings(deviceName: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('devices')
    .select('auto_mode, moisture_threshold, light_threshold, pump_state, led_state')
    .eq('device_name', deviceName)
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

