"use client"

import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/lib/use-theme"
import { ThemeLogo } from "@/components/ui/theme-logo"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/use-user"
import {
  Menu,
  X,
  Moon,
  Sun,
  Bell,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react"

interface NavbarProps {
  isAuthenticated?: boolean
  userEmail?: string
  userName?: string
}

export function Navbar({
  isAuthenticated = false,
  userEmail,
  userName,
}: NavbarProps) {
  const router = useRouter()
  const { user, logout } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { isDark, toggleDark, mounted } = useTheme()

  const displayName = user?.name || userName || "Alex Johnson"
  const displayEmail = user?.email || userEmail || "alex@university.edu"
  const initial = (displayName.trim().charAt(0) || "A").toUpperCase()
  const firstName = displayName.split(" ")[0] || displayName

  const handleSignOut = () => {
    setUserMenuOpen(false)
    logout()
    router.push("/signin")
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <ThemeLogo heightClass="h-10" className="group-hover:opacity-90 transition-opacity" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/review/new"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  New Review
                </Link>
              </>
            ) : (
              <>
                <a
                  href="#features"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  How It Works
                </a>
              </>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label="Toggle dark mode"
              id="dark-mode-toggle"
              suppressHydrationWarning
            >
              {mounted && isDark ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Notifications"
                    id="notification-bell"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full" />
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl shadow-black/10 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">2 new</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <Link href="/review/rev-001" className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-50 dark:border-gray-800/50" onClick={() => setNotificationsOpen(false)}>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">Review Completed</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">Your review for 'Federated Learning...' is ready.</p>
                          <p className="text-[10px] text-gray-400 mt-1">2 hours ago</p>
                        </Link>
                        <Link href="/leaderboard" className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50" onClick={() => setNotificationsOpen(false)}>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">Rank Up!</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">You've reached Rank #5 on the Leaderboard.</p>
                          <p className="text-[10px] text-gray-400 mt-1">1 day ago</p>
                        </Link>
                      </div>
                      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 mt-1">
                        <Link 
                          href="/notifications" 
                          className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-center block"
                          onClick={() => setNotificationsOpen(false)}
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    id="user-menu-button"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                      {initial}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                      {firstName}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl shadow-black/10 py-1.5 z-50">
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{displayEmail}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                        id="menu-dashboard"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                        id="menu-profile"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                        id="menu-settings"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                          id="menu-signout"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/signin"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  id="nav-signin"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-500 rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
                  id="nav-signup"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
              id="mobile-menu-toggle"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-4 py-4 space-y-2">
          <Link href="/dashboard" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Dashboard</Link>
          <Link href="/review/new" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">New Review</Link>
          <Link href="/signin" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Sign In</Link>
          <Link href="/signup" className="block px-3 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-500 text-center">Get Started</Link>
        </div>
      )}
    </nav>
  )
}
