"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signIn, signOut } from "next-auth/react"
import { LogOut, ChevronsUpDown } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BRAND, BRAND_COLORS, BRAND_FONTS } from "@/lib/config/brand"
import { NAV_GROUPS, SECONDARY_NAV, getNavForRole } from "@/lib/config/navigation"
import type { PlatformRole } from "@/lib/types"

const DEMO_ACCOUNTS = [
  { username: "yong", name: "Yong Choi", role: "Agent" },
  { username: "lex", name: "Lex Baum", role: "Marketing Manager" },
  { username: "marcus", name: "Marcus Chen", role: "Designer" },
  { username: "david", name: "David Kim", role: "Executive" },
] as const

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatRole(role: string): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function switchUser(username: string) {
  signIn("credentials", {
    username,
    password: username,
    callbackUrl: "/",
  })
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const user = session?.user
  const role = ((user as { role?: string } | undefined)?.role ?? "agent") as PlatformRole
  const userName = user?.name ?? "User"
  const userEmail = user?.email ?? ""

  const navGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: getNavForRole(g.items, role),
  }))
  const secondaryItems = getNavForRole(SECONDARY_NAV, role)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[slot=sidebar-menu-button]:p-2!"
              render={<Link href="/" />}
            >
              <div
                className="flex size-8 items-center justify-center rounded-md text-white"
                style={{ backgroundColor: BRAND_COLORS.navy }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ fontFamily: BRAND_FONTS.display }}
                >
                  {BRAND.initials}
                </span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span
                  className="truncate font-semibold"
                  style={{ fontFamily: BRAND_FONTS.display }}
                >
                  {BRAND.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {BRAND.tagline}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label || "_top"}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/")
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={active}
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={pathname === item.href}
                    render={item.href !== "#" ? <Link href={item.href} /> : undefined}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="aria-expanded:bg-muted"
                  />
                }
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback
                    className="rounded-lg text-white text-xs"
                    style={{ backgroundColor: BRAND_COLORS.navy }}
                  >
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {formatRole(role)}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-56"
                side="right"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    Switch Account
                  </DropdownMenuLabel>
                  {DEMO_ACCOUNTS.map((account) => {
                    const isCurrent = userName === account.name
                    return (
                      <DropdownMenuItem
                        key={account.username}
                        onClick={() => !isCurrent && switchUser(account.username)}
                        className={isCurrent ? "bg-muted" : ""}
                      >
                        <Avatar className="size-6 rounded-md">
                          <AvatarFallback
                            className="rounded-md text-white text-[10px]"
                            style={{ backgroundColor: BRAND_COLORS.navy }}
                          >
                            {getInitials(account.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left leading-tight">
                          <span className="truncate text-sm font-medium">{account.name}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {account.role}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
