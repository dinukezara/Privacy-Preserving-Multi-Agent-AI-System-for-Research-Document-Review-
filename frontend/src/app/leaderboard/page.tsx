"use client"

import { useState } from "react"
import { useUser } from "@/lib/use-user"
import { Trophy, Medal, Search, Star, TrendingUp, Users } from "lucide-react"

const topUsers = [
  { rank: 1, name: "Dr. Sarah Chen", institution: "MIT", score: 9850, reviews: 142, avgRating: 8.9, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&crop=face" },
  { rank: 2, name: "Prof. James Wilson", institution: "Stanford", score: 9200, reviews: 128, avgRating: 8.7, avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80&fit=crop&crop=face" },
  { rank: 3, name: "Dr. Elena Rodriguez", institution: "ETH Zurich", score: 8950, reviews: 115, avgRating: 9.1, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&crop=face" },
  { rank: 4, name: "David Kim", institution: "Berkeley", score: 8400, reviews: 102, avgRating: 8.5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&fit=crop&crop=face" },
  { rank: 5, name: "Alex Johnson", institution: "University of Colombo", score: 7200, reviews: 85, avgRating: 8.4, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80&fit=crop&crop=face", isCurrentUser: true },
  { rank: 6, name: "Dr. Emily Davis", institution: "Oxford", score: 6800, reviews: 76, avgRating: 8.6, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80&fit=crop&crop=face" },
  { rank: 7, name: "Michael Chang", institution: "Tsinghua University", score: 6500, reviews: 71, avgRating: 8.3, avatar: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&q=80&fit=crop&crop=face" },
]

export default function LeaderboardPage() {
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState("")

  const usersWithCurrent = topUsers.map(u =>
    u.isCurrentUser
      ? { ...u, name: user?.name || u.name, institution: user?.institution || u.institution }
      : u
  )

  const filteredUsers = usersWithCurrent.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.institution.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Global Leaderboard</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
            Recognizing the most active and highly-rated reviewers in the ScholarLens community. Climb the ranks by submitting quality reviews.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white dark:bg-gray-900 px-5 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm shrink-0">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Your Rank</p>
            <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">#5</p>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-800"></div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Your Score</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">7,200</p>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Rank 2 */}
        <div className="order-2 md:order-1 flex flex-col items-center mt-8 md:mt-12">
          <div className="relative mb-4">
            <img src={topUsers[1].avatar} alt="" className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-200 dark:ring-gray-700" />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-950 font-bold text-gray-700 dark:text-gray-300">2</div>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-center">{topUsers[1].name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{topUsers[1].institution}</p>
          <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300">{topUsers[1].score} pts</div>
        </div>

        {/* Rank 1 */}
        <div className="order-1 md:order-2 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
              <Trophy className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-md" />
            </div>
            <img src={topUsers[0].avatar} alt="" className="w-28 h-28 rounded-full object-cover ring-4 ring-amber-400" />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-950 font-black text-white text-lg">1</div>
          </div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-white text-center">{topUsers[0].name}</h3>
          <p className="text-sm text-amber-600 dark:text-amber-500 font-medium mb-3">{topUsers[0].institution}</p>
          <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 font-bold text-lg shadow-inner">{topUsers[0].score} pts</div>
        </div>

        {/* Rank 3 */}
        <div className="order-3 flex flex-col items-center mt-8 md:mt-16">
          <div className="relative mb-4">
            <img src={topUsers[2].avatar} alt="" className="w-16 h-16 rounded-full object-cover ring-4 ring-amber-700/50" />
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-7 h-7 bg-amber-700/50 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-950 font-bold text-white text-sm">3</div>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-center text-sm">{topUsers[2].name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{topUsers[2].institution}</p>
          <div className="px-2.5 py-1 bg-amber-900/10 rounded-lg text-xs font-semibold text-amber-900 dark:text-amber-600">{topUsers[2].score} pts</div>
        </div>
      </div>

      {/* List section */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mt-8">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" /> All Reviewers
          </h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search researchers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {filteredUsers.map((user) => (
            <div key={user.rank} className={`flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${user.isCurrentUser ? 'bg-purple-50/50 dark:bg-purple-900/10 relative overflow-hidden' : ''}`}>
              {user.isCurrentUser && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>}
              
              <div className="w-12 text-center font-bold text-gray-400 dark:text-gray-500 mr-4">
                #{user.rank}
              </div>
              
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {user.name}
                    {user.isCurrentUser && <span className="text-[10px] uppercase tracking-wider font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded">You</span>}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.institution}</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-8 mr-8">
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Reviews</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{user.reviews}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Avg Rating</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1">
                    {user.avgRating} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-base font-bold text-gray-900 dark:text-white">{user.score.toLocaleString()}</p>
                <p className="text-xs text-gray-400 flex items-center justify-end gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> pts</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
