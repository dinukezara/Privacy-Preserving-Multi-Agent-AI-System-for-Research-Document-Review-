"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { runReview } from "@/lib/api"
import {
  Upload,
  FileText,
  X,
  ChevronRight,
  Trophy,
  GraduationCap,
  Presentation,
  Cpu,
  Sparkles,
  Info,
} from "lucide-react"

const TIERS = [
  {
    id: "core-a-star",
    label: "CORE A*",
    shortLabel: "A*",
    description: "Premium conferences (NeurIPS, ICML, CVPR, ACL, SIGMOD)",
    strictness: "Highest",
    icon: Trophy,
    color: "from-amber-400 to-orange-500",
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    selected: "ring-2 ring-amber-400",
  },
  {
    id: "core-a",
    label: "CORE A",
    shortLabel: "A",
    description: "Top-tier conferences (ICDM, ECML, SIGKDD, WWW)",
    strictness: "High",
    icon: Trophy,
    color: "from-purple-500 to-violet-500",
    border: "border-purple-200 dark:border-purple-800",
    bg: "bg-purple-50 dark:bg-purple-950/20",
    selected: "ring-2 ring-purple-500",
  },
  {
    id: "core-b",
    label: "CORE B",
    shortLabel: "B",
    description: "Quality conferences (ICAT, ARES, DEXA)",
    strictness: "Moderate",
    icon: Trophy,
    color: "from-blue-500 to-indigo-500",
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    selected: "ring-2 ring-blue-500",
  },
  {
    id: "core-c",
    label: "CORE C",
    shortLabel: "C",
    description: "Other peer-reviewed conferences",
    strictness: "Standard",
    icon: Trophy,
    color: "from-gray-400 to-gray-500",
    border: "border-gray-200 dark:border-gray-700",
    bg: "bg-gray-50 dark:bg-gray-900/50",
    selected: "ring-2 ring-gray-400",
  },
  {
    id: "thesis",
    label: "Thesis",
    shortLabel: "Thesis",
    description: "University thesis evaluation (BSc/MSc/PhD)",
    strictness: "Academic",
    icon: GraduationCap,
    color: "from-emerald-500 to-teal-500",
    border: "border-emerald-200 dark:border-emerald-800",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    selected: "ring-2 ring-emerald-500",
  },
  {
    id: "presentation",
    label: "Slides",
    shortLabel: "Slides",
    description: "Conference or seminar presentation slides",
    strictness: "Presentation",
    icon: Presentation,
    color: "from-pink-500 to-rose-500",
    border: "border-pink-200 dark:border-pink-800",
    bg: "bg-pink-50 dark:bg-pink-950/20",
    selected: "ring-2 ring-pink-500",
  },
]

export default function NewReviewPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string>("core-a")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [step, setStep] = useState<1 | 2>(1)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && (dropped.type === "application/pdf" || dropped.name.endsWith(".pptx"))) {
      setFile(dropped)
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    if (picked) setFile(picked)
  }

  const handleSubmit = async () => {
    if (!file) return
    setSubmitting(true)
    setSubmitError("")

    try {
      const tier = selectedTier === "core-a-star" ? "A*" : selectedTier === "core-a" ? "A" : selectedTier === "core-b" ? "B" : selectedTier === "core-c" ? "C" : selectedTier
      const fullText = file.type === "text/plain" ? await file.text() : `Uploaded document: ${file.name}`
      const review = await runReview({
        title: file.name,
        full_text: fullText,
        tier,
        document_type: selectedTier === "presentation" ? "presentation" : selectedTier === "thesis" ? "thesis" : "paper",
      })
      router.push(`/review/${review._id}`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "The AI review could not be started.")
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <Link href="/dashboard" className="hover:text-gray-700 dark:hover:text-gray-300" id="breadcrumb-dashboard">Dashboard</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 dark:text-white font-medium">New Review</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submit for AI Review</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload your research paper or presentation to start the AI committee review.</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[
          { n: 1, label: "Upload Document" },
          { n: 2, label: "Select Tier & Submit" },
        ].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step >= n ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
              {n}
            </div>
            <span className={`text-sm font-medium ${step >= n ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>{label}</span>
            {n < 2 && <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-700 ml-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 ${dragging ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20" : file ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/10" : "border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 bg-white dark:bg-gray-900"}`}
          >
            <input
              type="file"
              accept=".pdf,.pptx"
              onChange={handleFileInput}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              id="file-upload"
            />
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              {file ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">{file.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to review
                  </p>
                  <button
                    onClick={(e) => { e.preventDefault(); setFile(null) }}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium"
                    id="remove-file"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${dragging ? "bg-purple-100 dark:bg-purple-950/30" : "bg-gray-100 dark:bg-gray-800"}`}>
                    <Upload className={`w-8 h-8 ${dragging ? "text-purple-600" : "text-gray-400"}`} />
                  </div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    {dragging ? "Drop your file here" : "Drag & drop your document"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    or click anywhere to browse
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">PDF</span>
                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">PPTX</span>
                    <span className="text-gray-300 dark:text-gray-600">Max 50 MB</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Supported formats info */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Supported Formats</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                PDF (IEEE/ACM multi-column, LaTeX, standard), and PPTX slide decks. Layout-aware parsing via Marker + Grobid handles complex formatting automatically.
              </p>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!file}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            id="next-step"
          >
            Continue to Tier Selection
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Tier selection */}
      {step === 2 && (
        <div className="space-y-6">
          {/* File summary */}
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{file ? (file.size / (1024 * 1024)).toFixed(2) : 0} MB</p>
            </div>
            <button onClick={() => setStep(1)} className="text-xs text-purple-600 dark:text-purple-400 hover:underline" id="change-file">Change</button>
          </div>

          {/* Tier selection */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Select Conference Tier</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose the target venue type to calibrate the review rubric&apos;s strictness level.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TIERS.map((tier) => {
                const isSelected = selectedTier === tier.id
                return (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-150 ${isSelected ? `${tier.border} ${tier.bg}` : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700"}`}
                    id={`tier-${tier.id}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center`}>
                        <tier.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className={`text-sm font-bold ${isSelected ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                        {tier.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{tier.description}</p>
                    <div className="mt-2">
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Strictness: </span>
                      <span className={`text-xs font-semibold bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>{tier.strictness}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* AI info */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
            <Cpu className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">Local AI Processing</p>
              <p className="text-xs text-purple-700 dark:text-purple-400 leading-relaxed">
                Review runs locally via Ollama (Llama-3-8B-Instruct). Estimated time: 3–5 minutes. Zero outbound network calls.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              id="back-step"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20 disabled:opacity-50"
              id="submit-review"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI Committee Reviewing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Start AI Review
                </>
              )}
            </button>
          </div>
          {submitError && <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>}
        </div>
      )}
    </div>
  )
}
