import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar isAuthenticated={true} />
        <main className="flex-1 pt-16 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
