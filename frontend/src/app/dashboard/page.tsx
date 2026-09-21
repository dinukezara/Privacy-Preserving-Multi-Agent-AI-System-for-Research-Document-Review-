"use client"

import Link from "next/link"
import { useUser } from "@/lib/use-user"
import {
  FilePlus,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowUpRight,
  BarChart2,
  Star,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from "lucide-react"

const stats = [
  {
    label: "Total Reviews",
    value: "24",
    change: "+3 this week",
    icon: FileText,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    label: "Avg. Score",
    value: "7.2",
    change: "+0.4 from last month",
    icon: Star,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    label: "Accept Rate",
    value: "71%",
    change: "17 of 24 papers",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    label: "Avg. Review Time",
    value: "3.8 min",
    change: "Under 5 min target",
    icon: Clock,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
]

const recentReviews = [
  {
    id: "rev-001",
    title: "Federated Learning with Differential Privacy for Medical Imaging",
    tier: "CORE A*",
    score: 8.1,
    verdict: "Accept",
    date: "2026-09-19",
    agents: { librarian: 8, methodology: 7.5, rigor: 8.5, presentation: 8, meta: 8.1 },
  },
  {
    id: "rev-002",
    title: "Graph Neural Networks for Molecular Property Prediction",
    tier: "CORE A",
    score: 6.8,
    verdict: "Weak Accept",
    date: "2026-09-17",
    agents: { librarian: 7, methodology: 6.5, rigor: 7, presentation: 6.5, meta: 6.8 },
  },
  {
    id: "rev-003",
    title: "Attention Mechanisms in Protein Structure Prediction",
    tier: "CORE B",
    score: 5.4,
    verdict: "Reject",
    date: "2026-09-14",
    agents: { librarian: 5, methodology: 5.5, rigor: 5, presentation: 6, meta: 5.4 },
  },
  {
    id: "rev-004",
    title: "Transformer-based OCR for Low-Resource Languages",
    tier: "Thesis",
    score: 7.9,
    verdict: "Accept",
    date: "2026-09-10",
    agents: { librarian: 8, methodology: 7.5, rigor: 8, presentation: 8, meta: 7.9 },
  },
]

function VerdictBadge({ verdict }: { verdict: string }) {
  const colors: Record<string, string> = {
    Accept: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    "Weak Accept": "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    "Weak Reject": "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    Reject: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[verdict] || colors["Weak Accept"]}`}>
      {verdict}
    </span>
  )
}

export default function DashboardPage() {
  const { user } = useUser()
  const firstName = user?.name ? user.name.split(" ")[0] : "Alex"

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome back, {firstName}. Here&apos;s your research review overview.</p>
        </div>
        <Link
          href="/review/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
          id="dashboard-new-review"
        >
          <FilePlus className="w-4 h-4" />
          New Review
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
              <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Recent reviews + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent reviews */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Reviews</h2>
            <Link href="/reviews" className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1" id="view-all-reviews">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentReviews.map((review) => (
              <Link
                key={review.id}
                href={`/review/${review.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                id={`review-${review.id}`}
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{review.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{review.tier}</span>
                    <span className="text-gray-300 dark:text-gray-700">·</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{review.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{review.score}</p>
                    <p className="text-xs text-gray-400">/10</p>
                  </div>
                  <VerdictBadge verdict={review.verdict} />
                  <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-700 group-hover:text-purple-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick actions + tips */}
        <div className="space-y-4">
          {/* Upload CTA */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl p-6 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Ready to review?</h3>
            <p className="text-sm text-white/80 mb-4 leading-relaxed">
              Upload your paper and get structured AI feedback in under 5 minutes.
            </p>
            <Link
              href="/review/new"
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-xl transition-colors"
              id="quick-new-review"
            >
              <FilePlus className="w-4 h-4" />
              Upload Paper
            </Link>
          </div>

          {/* Tips */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pro Tip</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Select the correct conference tier before submitting. CORE A* applies the strictest rubric and helps you spot weaknesses before top-venue submission.
            </p>
          </div>

          {/* Score chart placeholder */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Score Trend</h3>
            </div>
            <div className="flex items-end justify-between gap-1 h-20">
              {[5.5, 6.2, 5.8, 7.1, 6.8, 7.5, 8.1].map((score, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-purple-500 to-pink-400 rounded-sm opacity-80 hover:opacity-100 transition-opacity"
                    style={{ height: `${(score / 10) * 100}%` }}
                    title={`Score: ${score}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-400">Mar</span>
              <span className="text-xs text-gray-400">Sep</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
