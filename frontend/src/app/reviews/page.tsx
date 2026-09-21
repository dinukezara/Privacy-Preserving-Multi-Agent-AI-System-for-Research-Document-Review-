"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Search,
  Filter,
  FilePlus,
  ArrowUpRight,
  ChevronRight,
  Calendar,
  MoreVertical,
} from "lucide-react"

const allReviews = [
  { id: "rev-001", title: "Federated Learning with Differential Privacy for Medical Imaging", tier: "CORE A*", score: 8.1, verdict: "Accept", date: "2026-09-19" },
  { id: "rev-002", title: "Graph Neural Networks for Molecular Property Prediction", tier: "CORE A", score: 6.8, verdict: "Weak Accept", date: "2026-09-17" },
  { id: "rev-003", title: "Attention Mechanisms in Protein Structure Prediction", tier: "CORE B", score: 5.4, verdict: "Reject", date: "2026-09-14" },
  { id: "rev-004", title: "Transformer-based OCR for Low-Resource Languages", tier: "Thesis", score: 7.9, verdict: "Accept", date: "2026-09-10" },
  { id: "rev-005", title: "Energy-Efficient Edge Computing with Quantized Models", tier: "CORE A", score: 7.6, verdict: "Accept", date: "2026-09-05" },
  { id: "rev-006", title: "Reinforcement Learning for Robotic Grasping", tier: "CORE A*", score: 4.5, verdict: "Reject", date: "2026-08-28" },
  { id: "rev-007", title: "Self-Supervised Learning in Audio Event Detection", tier: "CORE C", score: 6.2, verdict: "Weak Accept", date: "2026-08-15" },
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

export default function ReviewsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredReviews = allReviews.filter((review) =>
    review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.tier.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Reviews</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and view all your past research paper reviews.</p>
        </div>
        <Link
          href="/review/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
        >
          <FilePlus className="w-4 h-4" />
          New Review
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, conference tier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full sm:w-auto">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Reviews Table/List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paper Title</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tier</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Verdict</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/review/${review.id}`} className="block">
                        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{review.title}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md">{review.tier}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {review.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{review.score}</span>
                        <span className="text-xs text-gray-400">/10</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <VerdictBadge verdict={review.verdict} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/review/${review.id}`}
                          className="p-2 rounded-lg text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                        <button className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No reviews found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
