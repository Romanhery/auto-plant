import Controls from "@/components/page-components/controls"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default async function Page() {
    return (
        <div>
            <Controls />
            <Link href="/dashboard" className="absolute top-4 left-4 flex items-center text-green-600 hover:text-green-700 font-bold transition-all">
                <ChevronLeft className="w-5 h-5" />
                Back to Dashboard
            </Link>
        </div>
    )
}