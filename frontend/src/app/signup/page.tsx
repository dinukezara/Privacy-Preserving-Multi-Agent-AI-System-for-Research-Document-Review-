"use client"

import Link from "next/link"
import { useState } from "react"
import { ThemeLogo } from "@/components/ui/theme-logo"
import { signUp } from "@/lib/api"
import { notifyUserUpdated } from "@/lib/use-user"
import { useRouter } from "next/navigation"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Building2,
  Check,
} from "lucide-react"

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
]

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    institution: "",
    password: "",
    agree: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const result = await signUp({ name: form.name, email: form.email, institution: form.institution, password: form.password })
      localStorage.setItem("scholarlens-token", result.token)
      localStorage.setItem("scholarlens-user", JSON.stringify(result.user))
      notifyUserUpdated(result.user)
      router.push("/dashboard")
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Account creation failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-purple-950 via-gray-950 to-pink-950 overflow-hidden">
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,80,200,0.15),transparent_70%)]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center">
            <img
              src="/scholarlens-logo-dark.png"
              alt="ScholarLens"
              className="h-12 w-auto object-contain"
            />
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white leading-tight">
              Get peer-review quality feedback before you submit
            </h2>
            <div className="space-y-4">
              {[
                "5 specialized AI agents review your paper",
                "Adapts to CORE A*, A, B, C or Thesis guidelines",
                "Runs 100% offline — zero cloud exposure",
                "Structured report with scores and recommendations",
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-purple-400" />
                  </div>
                  <span className="text-sm text-gray-300">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 bg-white dark:bg-gray-950 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <ThemeLogo heightClass="h-10" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create your account</h1>
            <p className="text-gray-500 dark:text-gray-400">Start reviewing research in minutes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {/* Full name */}
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Dr. Jane Smith"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Academic Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@university.edu"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Institution */}
            <div>
              <label htmlFor="signup-institution" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Institution
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="signup-institution"
                  name="institution"
                  type="text"
                  value={form.institution}
                  onChange={handleChange}
                  placeholder="University of ..."
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  id="signup-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password requirements */}
              {form.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req) => {
                    const met = req.test(form.password)
                    return (
                      <div key={req.label} className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${met ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                          {met && <Check className="w-2 h-2 text-white" />}
                        </div>
                        <span className={`text-xs ${met ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}>
                          {req.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="signup-agree"
                name="agree"
                checked={form.agree}
                onChange={handleChange}
                required
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 mt-0.5"
              />
              <label htmlFor="signup-agree" className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                I agree to the{" "}
                <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !form.agree}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              id="signup-submit"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link href="/signin" className="text-purple-600 dark:text-purple-400 font-medium hover:underline" id="goto-signin">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
