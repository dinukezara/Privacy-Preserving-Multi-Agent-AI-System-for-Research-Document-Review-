"use client"

import { useEffect, useState } from "react"
import { getCurrentUser, getMyReviews, updateProfile, type ReviewSummary, type UserProfile } from "@/lib/api"
import { notifyUserUpdated } from "@/lib/use-user"
import {
  User,
  Mail,
  Building2,
  Globe,
  Edit3,
  Save,
  FileText,
  CheckCircle,
  XCircle,
  BarChart2,
  Clock,
  Calendar,
} from "lucide-react"

const defaultUser = {
  name: "Alex Johnson",
  email: "alex.johnson@university.edu",
  institution: "University of Colombo, Sri Lanka",
  role: "PhD Researcher",
  website: "https://alexjohnson.ai",
  bio: "Researching privacy-preserving machine learning and federated learning for healthcare applications. 4th year PhD candidate.",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&fit=crop&crop=face",
  joinedDate: "2026-01-15",
  stats: {
    totalReviews: 24,
    acceptRate: "71%",
    avgScore: 7.2,
    avgTime: "3.8 min",
  },
}

const defaultReviewHistory = [
  { id: "rev-001", title: "Federated Learning with Differential Privacy for Medical Imaging", tier: "CORE A*", score: 8.1, verdict: "Accept", date: "2026-09-19" },
  { id: "rev-002", title: "Graph Neural Networks for Molecular Property Prediction", tier: "CORE A", score: 6.8, verdict: "Weak Accept", date: "2026-09-17" },
  { id: "rev-003", title: "Attention Mechanisms in Protein Structure Prediction", tier: "CORE B", score: 5.4, verdict: "Reject", date: "2026-09-14" },
  { id: "rev-004", title: "Transformer-based OCR for Low-Resource Languages", tier: "Thesis", score: 7.9, verdict: "Accept", date: "2026-09-10" },
  { id: "rev-005", title: "Energy-Efficient Edge Computing with Quantized Models", tier: "CORE A", score: 7.6, verdict: "Accept", date: "2026-09-05" },
]

function VerdictBadge({ verdict }: { verdict: string }) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
  if (verdict === "Accept") return <span className={`${base} bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800`}>{verdict}</span>
  if (verdict === "Weak Accept") return <span className={`${base} bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800`}>{verdict}</span>
  return <span className={`${base} bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800`}>{verdict}</span>
}

export default function ProfilePage() {
  const [user, setUser] = useState(defaultUser)
  const [reviewHistory, setReviewHistory] = useState(defaultReviewHistory)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: defaultUser.name, institution: defaultUser.institution, bio: defaultUser.bio, website: defaultUser.website, role: defaultUser.role })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("scholarlens-user")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUser((current) => ({ ...current, ...parsed }))
        setForm((current) => ({
          ...current,
          name: parsed.name ?? current.name,
          institution: parsed.institution ?? current.institution,
          bio: parsed.bio ?? current.bio,
          website: parsed.website ?? current.website,
          role: parsed.role ?? current.role,
        }))
      } catch {
        // ignore parse error
      }
    }

    Promise.all([getCurrentUser(), getMyReviews()])
      .then(([profile, reviews]) => {
        const nextUser = {
          ...defaultUser,
          ...profile,
          joinedDate: profile.createdAt,
          stats: {
            totalReviews: reviews.length,
            acceptRate: reviews.length ? `${Math.round((reviews.filter((review) => review.recommendation === "Accept").length / reviews.length) * 100)}%` : "0%",
            avgScore: reviews.length ? Number((reviews.reduce((sum, review) => sum + (review.weightedScore || 0), 0) / reviews.length).toFixed(1)) : 0,
            avgTime: "-",
          },
        }
        setUser(nextUser)
        setForm({ name: profile.name, institution: profile.institution, bio: profile.bio, website: profile.website, role: profile.role })
        setReviewHistory(reviews.map((review: ReviewSummary) => ({ id: review._id, title: review.title, tier: review.tier, score: review.weightedScore, verdict: review.recommendation, date: review.createdAt })))
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not load your profile."))
  }, [])

  async function saveProfile() {
    setSaving(true)
    setError("")
    try {
      const updated = await updateProfile(form)
      setUser((current) => ({ ...current, ...updated }))
      localStorage.setItem("scholarlens-user", JSON.stringify(updated))
      notifyUserUpdated(updated)
      setEditing(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save your profile.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profile</h1>
      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — profile card */}
        <div className="space-y-4">
          {/* Avatar + basic info */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 text-center">
            <div className="relative inline-block mb-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-purple-100 dark:ring-purple-900/50"
              />
              <button
                className="absolute -bottom-2 -right-2 w-7 h-7 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                id="change-avatar"
                aria-label="Change avatar"
              >
                <Edit3 className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.role}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{user.institution}</p>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 justify-center">
                <Calendar className="w-3.5 h-3.5" />
                Joined {new Date(user.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-500" />
              Review Statistics
            </h3>
            <div className="space-y-3">
              {[
                { label: "Total Reviews", value: user.stats.totalReviews, icon: FileText },
                { label: "Accept Rate", value: user.stats.acceptRate, icon: CheckCircle },
                { label: "Avg. Score", value: `${user.stats.avgScore}/10`, icon: BarChart2 },
                { label: "Avg. Time", value: user.stats.avgTime, icon: Clock },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Icon className="w-3.5 h-3.5 text-gray-400" />
                    {label}
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — details + history */}
        <div className="lg:col-span-2 space-y-5">
          {/* Edit form */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Personal Information</h3>
              <button
                onClick={() => editing ? saveProfile() : setEditing(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                id="edit-profile"
              >
                {editing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                {editing ? (saving ? "Saving..." : "Save") : "Edit"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Full Name", key: "name", icon: User, value: form.name },
                { label: "Email", key: "email", icon: Mail, value: user.email, disabled: true },
                { label: "Institution", key: "institution", icon: Building2, value: form.institution },
                { label: "Role / Title", key: "role", icon: User, value: form.role },
                { label: "Website", key: "website", icon: Globe, value: form.website },
              ].map(({ label, key, icon: Icon, value, disabled }) => (
                <div key={key} className={key === "website" ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={value}
                      disabled={!editing || disabled}
                      onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      id={`profile-${key}`}
                    />
                  </div>
                </div>
              ))}

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Bio</label>
                <textarea
                  value={form.bio}
                  disabled={!editing}
                  onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  id="profile-bio"
                />
              </div>
            </div>
          </div>

          {/* Review history */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Review History</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {reviewHistory.map((review) => (
                <div key={review.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{review.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{review.tier}</span>
                      <span className="text-gray-200 dark:text-gray-700">·</span>
                      <span className="text-xs text-gray-400">{review.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{review.score}</span>
                    <VerdictBadge verdict={review.verdict} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
