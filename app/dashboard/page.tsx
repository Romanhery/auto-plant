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
import { SimulateDataButton } from "@/components/simulate-data-button"

import { cookies } from "next/headers"

export default async function Page() {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  // Use a stable reference time for initial render to avoid hydration mismatch
  const referenceTime = new Date().getTime()

  const supabase = await createClient()
  const { data } = await supabase.from("sensor_readings").select("*").order("timestamp", { ascending: false })

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
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
          <SimulateDataButton />
        </div>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards initialData={data || []} />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive initialData={data || []} referenceTime={referenceTime} />
              </div>
              <DataTable data={data || []} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
