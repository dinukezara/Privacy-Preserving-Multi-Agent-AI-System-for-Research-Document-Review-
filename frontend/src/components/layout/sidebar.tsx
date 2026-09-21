"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeLogo } from "@/components/ui/theme-logo"
import {
  LayoutDashboard,
  FilePlus,
  ClipboardList,
  FileText,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trophy,
} from "lucide-react"
import { useState } from "react"

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    id: "sidebar-dashboard",
  },
  {
    label: "Papers",
    href: "/papers",
    icon: FileText,
    id: "sidebar-papers",
  },
  {
    label: "New Review",
    href: "/review/new",
    icon: FilePlus,
    id: "sidebar-new-review",
  },
  {
    label: "My Reviews",
    href: "/reviews",
    icon: ClipboardList,
    id: "sidebar-reviews",
  },
  {
    label: "Leaderboard",
    href: "/leaderboard",
    icon: Trophy,
    id: "sidebar-leaderboard",
  },
]

const bottomNavItems = [
  {
    label: "Profile",
    href: "/profile",
    icon: User,
    id: "sidebar-profile",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    id: "sidebar-settings",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo area */}
      <div className={cn("flex items-center h-16 border-b border-gray-200 dark:border-gray-800 px-3", collapsed ? "justify-center" : "")}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-white font-black text-sm">SL</span>
          </div>
        ) : (
          <Link href="/" className="flex items-center">
            <ThemeLogo heightClass="h-9" />
          </Link>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              id={item.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                collapsed ? "justify-center" : "",
                isActive
                  ? "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn("flex-shrink-0", isActive ? "w-5 h-5 text-purple-600 dark:text-purple-400" : "w-5 h-5")} />
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* AI Badge */}
      {!collapsed && (
        <div className="mx-3 mb-4 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-100 dark:border-purple-900/50">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">AI-Powered</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            100% offline. Your research stays private.
          </p>
        </div>
      )}

      {/* Bottom nav */}
      <div className="border-t border-gray-200 dark:border-gray-800 py-4 px-2 space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              id={item.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                collapsed ? "justify-center" : "",
                isActive
                  ? "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && item.label}
            </Link>
          )
        })}

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150",
            collapsed ? "justify-center" : "",
          )}
          id="sidebar-collapse"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 flex-shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
