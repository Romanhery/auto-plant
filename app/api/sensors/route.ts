import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This endpoint receives sensor data from ESP32 and returns commands if auto mode is enabled
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Extract sensor data
    const { temperature, humidity, soil_moisture, mac_address, device_name, light } = body

    // Find device by MAC address or device_name
    let device
    if (mac_address) {
      const { data: devices } = await supabase
        .from('devices')
        .select('*')
        .eq('mac_address', mac_address)
        .maybeSingle()
      device = devices
    }

    if (!device && device_name) {
      const { data: devices } = await supabase
        .from('devices')
        .select('*')
        .eq('device_name', device_name)
        .maybeSingle()
      device = devices
    }

    if (!device) {
      return NextResponse.json({ 
        success: false, 
        error: 'Device not found' 
      }, { status: 404 })
    }

    // Save sensor reading to database
    const readingData: any = {
      device_name: device.device_name || device_name,
      device_id: device.device_id,
      temperature: temperature || null,
      humidity: humidity || null,
      moisture: soil_moisture || null,
      light: light || null,
    }

    const { error: insertError } = await supabase
      .from('sensor_readings')
      .insert(readingData)

    if (insertError) {
      console.error('Error saving sensor reading:', insertError)
    }

    // Check if auto mode is enabled
    const autoMode = device.auto_mode || false
    let command = null

    if (autoMode) {
      command = evaluateAutoMode({
        moisture: soil_moisture,
        temperature,
        humidity,
        light,
        device
      })
    }

    return NextResponse.json({
      success: true,
      command: command
    })

  } catch (error) {
    console.error('Error processing sensor data:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Auto mode evaluation logic
function evaluateAutoMode({
  moisture,
  temperature,
  humidity,
  light,
  device
}: {
  moisture?: number
  temperature?: number
  humidity?: number
  light?: number
  device: any
}) {
  const commands: string[] = []

  // Pump control based on moisture
  if (moisture !== undefined && moisture !== null) {
    const moistureThreshold = device.moisture_threshold || 30 // Default threshold: 30%
    const moistureHysteresis = 5 // Prevent rapid toggling

    // Check current pump state from device settings (if stored) or infer from recent readings
    const pumpOn = device.pump_state || false

    if (moisture < moistureThreshold && !pumpOn) {
      commands.push('PUMP_ON')
    } else if (moisture >= (moistureThreshold + moistureHysteresis) && pumpOn) {
      commands.push('PUMP_OFF')
    }
  }

  // LED control based on light levels
  if (light !== undefined && light !== null) {
    const lightThreshold = device.light_threshold || 20 // Default threshold: 20%
    const lightHysteresis = 5

    const ledOn = device.led_state || false

    if (light < lightThreshold && !ledOn) {
      commands.push('LED_ON')
    } else if (light >= (lightThreshold + lightHysteresis) && ledOn) {
      commands.push('LED_OFF')
    }
  } else {
    // If no light sensor, use time-based control (grow lights on during day)
    const hour = new Date().getHours()
    const ledOn = device.led_state || false
    
    // Turn LEDs on during 6 AM - 10 PM
    if (hour >= 6 && hour < 22 && !ledOn) {
      commands.push('LED_ON')
    } else if ((hour < 6 || hour >= 22) && ledOn) {
      commands.push('LED_OFF')
    }
  }

  // Return the first command (ESP32 handles one command at a time)
  // In practice, you might want to prioritize pump over LED
  if (commands.includes('PUMP_ON') || commands.includes('PUMP_OFF')) {
    return {
      command: commands.find(cmd => cmd.includes('PUMP')) || null
    }
  }

  if (commands.length > 0) {
    return {
      command: commands[0]
    }
  }

  return null
}

