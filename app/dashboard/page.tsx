import { AppSidebar } from "@/components/nav/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import Devices from "@/components/page-components/devices"
import BottomNav from "@/components/nav/bottom-nav"

export default async function Page() {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  const supabase = await createClient()
  const { data } = await supabase
    .from("sensor_readings")
    .select("*")
    .order("timestamp", { ascending: false })

  const user = (await supabase.auth.getUser()).data.user

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar
        variant="inset"
        user={{
          name: user?.user_metadata?.full_name || "User",
          email: user?.email || "",
          avatar: user?.user_metadata?.avatar_url || "",
        }}
      />
      <SidebarInset>
        <div className="flex items-center justify-between border-b px-4 lg:px-6">
          <SiteHeader />
        </div>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <Devices />
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </SidebarProvider>
  )
}
