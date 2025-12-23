
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with Service Role to bypass RLS for device operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate Device via Token
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];

        // Find device by token
        const { data: device, error: deviceError } = await supabaseAdmin
            .from('devices')
            .select('id, user_id')
            .eq('token', token)
            .single();

        if (deviceError || !device) {
            return NextResponse.json({ error: 'Unauthorized Device' }, { status: 401 });
        }

        // 2. Parse Payload
        const body = await req.json();
        const { temperature, humidity, soil_moisture, mac_address } = body;

        // 3. Update Last Seen (Optional: can be optimized to not write every time)
        await supabaseAdmin
            .from('devices')
            .update({
                last_seen: new Date().toISOString(),
                // If MAC wasn't set during setup, set it now
                ...(mac_address ? { mac_address } : {})
            })
            .eq('id', device.id);

        // 4. Insert Sensor Reading
        const { error: insertError } = await supabaseAdmin
            .from('sensor_readings')
            .insert({
                device_id: device.id,
                temperature,
                humidity,
                soil_moisture
            });

        if (insertError) {
            console.error('Error saving reading:', insertError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // 5. Check for Pending Commands
        const { data: commands } = await supabaseAdmin
            .from('device_commands')
            .select('id, command, payload')
            .eq('device_id', device.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(1);

        let commandResponse = null;

        if (commands && commands.length > 0) {
            const cmd = commands[0];

            // Mark as executed
            await supabaseAdmin
                .from('device_commands')
                .update({ status: 'executed', executed_at: new Date().toISOString() })
                .eq('id', cmd.id);

            commandResponse = {
                command: cmd.command,
                payload: cmd.payload,
                id: cmd.id
            };
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            command: commandResponse
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
