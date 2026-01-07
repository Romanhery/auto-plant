"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Leaf, Droplets, Thermometer, Wind, Settings } from "lucide-react"

const tabs = [
  { label: "Dashboard", href: "/dashboard", icon: <Leaf className="w-5 h-5" /> },
  { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" /> },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-inner md:hidden">
      <ul className="flex justify-around">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center justify-center py-2 px-4 text-xs font-semibold transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.icon}
                <span className="mt-1">{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
