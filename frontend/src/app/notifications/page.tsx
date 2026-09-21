"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Trophy,
  Trash2,
  Check
} from "lucide-react"

type NotificationType = 'review_complete' | 'system' | 'achievement' | 'alert'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  time: string
  read: boolean
  link?: string
}

const initialNotifications: Notification[] = [
  {
    id: "notif-1",
    type: "review_complete",
    title: "Review Completed",
    message: "Your review for 'Federated Learning with Differential Privacy' is ready.",
    time: "2 hours ago",
    read: false,
    link: "/review/rev-001"
  },
  {
    id: "notif-2",
    type: "achievement",
    title: "Rank Up!",
    message: "Congratulations! You've reached Rank #5 on the Global Leaderboard.",
    time: "1 day ago",
    read: false,
    link: "/leaderboard"
  },
  {
    id: "notif-3",
    type: "system",
    title: "System Update",
    message: "ScholarLens engine updated to Llama-3-8B-Instruct with improved accuracy.",
    time: "2 days ago",
    read: true
  },
  {
    id: "notif-4",
    type: "review_complete",
    title: "Review Completed",
    message: "Your review for 'Graph Neural Networks' is ready.",
    time: "3 days ago",
    read: true,
    link: "/review/rev-002"
  },
  {
    id: "notif-5",
    type: "alert",
    title: "Action Required",
    message: "Please update your institutional email in settings.",
    time: "1 week ago",
    read: true,
    link: "/settings"
  }
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications)

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'review_complete':
        return <FileText className="w-5 h-5 text-purple-500" />
      case 'achievement':
        return <Trophy className="w-5 h-5 text-amber-500" />
      case 'system':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getBgColor = (type: NotificationType) => {
    switch (type) {
      case 'review_complete': return 'bg-purple-50 dark:bg-purple-500/10'
      case 'achievement': return 'bg-amber-50 dark:bg-amber-500/10'
      case 'system': return 'bg-emerald-50 dark:bg-emerald-500/10'
      case 'alert': return 'bg-red-50 dark:bg-red-500/10'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Stay updated with your review progress and system alerts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
          <button 
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Clear all
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No notifications</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">You're all caught up! Check back later.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`relative bg-white dark:bg-gray-900 rounded-2xl border transition-all ${
                notification.read 
                  ? 'border-gray-100 dark:border-gray-800 opacity-75' 
                  : 'border-purple-200 dark:border-purple-800/50 shadow-md shadow-purple-500/5'
              }`}
            >
              {!notification.read && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-12 bg-purple-500 rounded-r-full" />
              )}
              
              <div className="p-5 sm:p-6 flex gap-4 sm:gap-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getBgColor(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h3 className={`text-base font-semibold ${notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {notification.time}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-3 ${notification.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center gap-3">
                    {notification.link && (
                      <Link 
                        href={notification.link}
                        className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                        onClick={() => markAsRead(notification.id)}
                      >
                        View Details →
                      </Link>
                    )}
                    {!notification.read && (
                      <button 
                        onClick={() => markAsRead(notification.id)}
                        className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
