"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/bookings': 'Bookings Management',
  '/dashboard/payments': 'Payments Management',
  '/dashboard/stores': 'Stores Management',
  '/dashboard/users': 'Users Management',
  '/dashboard/settings': 'Settings',
}

export function SiteHeader() {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] || 'Smart Laundry Admin'

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}
