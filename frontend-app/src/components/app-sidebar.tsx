"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboardIcon,
  CalendarCheck,
  CreditCard,
  Store,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Home,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Admin",
    email: "admin@smartlaundry.com",
    avatar: "/logo.png",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Bookings",
      url: "/dashboard/bookings",
      icon: CalendarCheck,
    },
    {
      title: "Payments",
      url: "/dashboard/payments",
      icon: CreditCard,
    },
    {
      title: "Stores",
      url: "/dashboard/stores",
      icon: Store,
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: Users,
    },
  ],
  navSecondary: [
    {
      title: "Back to Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
    {
      title: "Help",
      url: "#",
      icon: HelpCircle,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  // Add isActive to navMain based on current path
  const navMainWithActive = data.navMain.map(item => ({
    ...item,
    isActive: pathname === item.url || (item.url !== '/dashboard' && pathname.startsWith(item.url))
  }))

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard" className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="Smart Laundry"
                  width={28}
                  height={28}
                  className="object-contain"
                />
                <span className="text-base font-semibold text-[#FF385C]">Smart Laundry</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
