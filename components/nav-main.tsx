"use client"

import { IconPlus, IconReceipt2, type Icon } from "@tabler/icons-react"
import Link from "next/link"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-3">

        {/* BUTTON 1: PRIMARY - ADD DEVICE (CLEAN GREEN) */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Add Device"
              className="h-10 bg-green-500 text-white hover:bg-green-600 hover:text-white"
            >
              <Link href="/setup" className="flex items-center gap-3 px-1">
                <IconPlus className="h-4 w-4 stroke-[3]" />
                <span className="font-bold text-[13px] uppercase tracking-wider">Add Device</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* BUTTON 2: SECONDARY - DASHBOARD (SOFT BLUE/CYAN) */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Dashboard"
            >
              <Link href="/dashboard" className="flex items-center gap-3 px-1">
                <span className="font-bold text-[13px] uppercase tracking-wider">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* BUTTON 3: TERTIARY - CONTROLS (PURPLE) */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Controls"
            >
              <Link href="/controls" className="flex items-center gap-3 px-1">
                <span className="font-bold text-[13px] uppercase tracking-wider">Controls</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

      </SidebarGroupContent>
    </SidebarGroup>
  )
}