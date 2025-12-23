//This means to import things from other directories or code form other people
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/server"

import { cookies } from "next/headers"
import DashboardDevices from "@/components/devices"

// export means to make this function available to other files async means to make this function wait for something to finish
export default async function Page() {
  //This means to get cookies from the browser
  const cookieStore = await cookies()
  //This means to get the value of the cookie
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  //This means to get the current time
  const referenceTime = new Date().getTime()

  const supabase = await createClient()
  //This means to get the data from the database
  const { data } = await supabase.from("sensor_readings").select("*").order("timestamp", { ascending: false })

  return (
    //This means to return the sidebar provider

    
    <SidebarProvider
      //This means to set the default open state of the sidebar
      defaultOpen={defaultOpen}
      //This means to set the style of the sidebar
      style={
        {
          //This means to set the width of the sidebar
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={{
        name: (await supabase.auth.getUser()).data.user?.user_metadata?.full_name || "User",
        email: (await supabase.auth.getUser()).data.user?.email || "",
        avatar: (await supabase.auth.getUser()).data.user?.user_metadata?.avatar_url || "",
      }} />
      <SidebarInset>
        <div className="flex items-center justify-between border-b px-4 lg:px-6">
          <SiteHeader />
        </div>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DashboardDevices />
              
             
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
