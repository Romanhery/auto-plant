"use client"

import { useState, useEffect } from "react"
import { IconBluetooth, IconWifi, IconCheck, IconLoader, IconX } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { registerDevice } from "@/app/dashboard/setup/actions"

// UUIDs from the ESP32 code
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
const CHAR_UUID_CREDENTIALS = "beb5483e-36e1-4688-b7f5-ea07361b26a8"
const CHAR_UUID_STATUS = "53966527-2b0e-473d-888d-788c26c364c2"

export function BluetoothSetup() {
    const [device, setDevice] = useState<BluetoothDevice | null>(null)
    const [server, setServer] = useState<BluetoothRemoteGATTServer | null>(null)
    const [status, setStatus] = useState<string>("Disconnected")
    const [ssid, setSsid] = useState("")
    const [password, setPassword] = useState("")
    const [isConnecting, setIsConnecting] = useState(false)
    const [logs, setLogs] = useState<string[]>([])

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])

    const connectToDevice = async () => {
        try {
            setIsConnecting(true)
            addLog("Requesting Bluetooth Device...")

            const device = await navigator.bluetooth.requestDevice({
                filters: [{ name: "SAGE_GARDEN" }],
                optionalServices: [SERVICE_UUID]
            })

            setDevice(device)
            addLog(`Device selected: ${device.name}`)

            device.addEventListener('gattserverdisconnected', onDisconnected)

            addLog("Connecting to GATT Server...")
            const server = await device.gatt?.connect()
            setServer(server || null)

            if (!server) throw new Error("Could not connect to GATT Server")

            addLog("Getting Service...")
            const service = await server.getPrimaryService(SERVICE_UUID)

            addLog("Getting Status Characteristic...")
            const statusChar = await service.getCharacteristic(CHAR_UUID_STATUS)

            await statusChar.startNotifications()
            statusChar.addEventListener('characteristicvaluechanged', handleStatusChange)

            setStatus("Connected")
            toast.success("Connected to Sage Garden Device")
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (error.name === 'NotFoundError' || error.message?.includes('cancelled')) {
                addLog("Pairing cancelled by user")
                return
            }
            console.error(error)
            addLog(`Error: ${error.message}`)
            toast.error("Failed to connect: " + error.message)
        } finally {
            setIsConnecting(false)
        }
    }

    const onDisconnected = () => {
        setStatus("Disconnected")
        setDevice(null)
        setServer(null)
        addLog("Device Disconnected")
    }

    const handleStatusChange = async (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const value = new TextDecoder().decode(event.target.value)
        addLog(`Device Status: ${value}`)

        if (value.startsWith("SUCCESS:")) {
            const macAddress = value.split(":")[1]
            toast.success("Device connected to WiFi! Registering...")

            try {
                await registerDevice(macAddress)
                toast.success("Device successfully registered to your account!")
                setStatus("Registered")
            } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                toast.error("Failed to register device: " + error.message)
            }
        } else if (value.startsWith("ERROR:")) {
            toast.error("Device verification failed: " + value.split(":")[1])
        }
    }

    const sendCredentials = async () => {
        if (!server || !ssid || !password) return

        try {
            setIsConnecting(true)
            const service = await server.getPrimaryService(SERVICE_UUID)
            const credsChar = await service.getCharacteristic(CHAR_UUID_CREDENTIALS)

            const credentials = `${ssid}:${password}`
            await credsChar.writeValue(new TextEncoder().encode(credentials))
            addLog(`Sent credentials for ${ssid}`)
            toast.info("Sending WiFi credentials...")
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            addLog(`Error sending creds: ${error.message}`)
            toast.error("Failed to send credentials")
        } finally {
            setIsConnecting(false)
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Device Setup</CardTitle>
                <CardDescription>Pair your Sage Garden device via Bluetooth</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${status === "Connected" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                            <IconBluetooth size={24} />
                        </div>
                        <div>
                            <div className="font-medium">Status</div>
                            <div className="text-sm text-muted-foreground">
                                {isConnecting ? "Connecting..." : status}
                            </div>
                        </div>
                    </div>
                    {status === "Disconnected" && (
                        <Button onClick={connectToDevice} disabled={isConnecting}>
                            {isConnecting ? <IconLoader className="animate-spin mr-2" /> : "Pair"}
                        </Button>
                    )}
                </div>

                {status === "Connected" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="space-y-2">
                            <Label htmlFor="ssid">WiFi Network Name (SSID)</Label>
                            <Input
                                id="ssid"
                                value={ssid}
                                onChange={(e) => setSsid(e.target.value)}
                                placeholder="Enter WiFi Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">WiFi Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter WiFi Password"
                            />
                        </div>
                        <Button className="w-full" onClick={sendCredentials} disabled={!ssid || !password || isConnecting}>
                            <IconWifi className="mr-2 h-4 w-4" /> Connect to WiFi
                        </Button>
                    </div>
                )}

                {status === "Registered" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <IconCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium">Device Setup Complete!</h3>
                            <p className="text-sm text-muted-foreground">
                                Your device has been successfully registered and is sending data.
                            </p>
                        </div>
                        <Button className="w-full" asChild>
                            <a href="/dashboard">Go to Dashboard</a>
                        </Button>
                    </div>
                )}

                {logs.length > 0 && (
                    <div className="mt-4 p-2 bg-black/5 rounded text-xs font-mono h-32 overflow-y-auto">
                        {logs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}