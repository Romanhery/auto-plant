import { BluetoothSetup } from "@/components/bluetooth-setup"
import { IconBluetooth } from "@tabler/icons-react"

export default function SetupPage() {
    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
            <header className="flex h-14 items-center border-b px-6 bg-background">
                <div className="flex items-center gap-2 font-semibold">
                    <IconBluetooth className="size-5" />
                    <span>Sage Garden Setup</span>
                </div>
            </header>
            <div className="flex flex-1 flex-col items-center justify-center p-4">
                <div className="mx-auto w-full max-w-md space-y-6">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tighter">Setup Your Device</h1>
                        <p className="text-muted-foreground">
                            Connect to your Sage Garden device via Bluetooth to get started.
                        </p>
                    </div>
                    <BluetoothSetup />
                </div>
            </div>
        </div>
    )
}
