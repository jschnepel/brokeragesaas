import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { RightPanel } from "@/components/features/RightPanel"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SSEProvider } from "@/components/features/SSEProvider"
import { Toaster } from "@/components/ui/sonner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
            <SSEProvider>
              {children}
            </SSEProvider>
          </div>
        </div>
      </SidebarInset>
      <RightPanel />
      <Toaster position="bottom-right" />
    </SidebarProvider>
  )
}
