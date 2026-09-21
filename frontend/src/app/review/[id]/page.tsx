"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getReview, type ReviewResult } from "@/lib/api"
import {
  ChevronRight,
  CheckCircle,
  XCircle,
  BookOpen,
  FlaskConical,
  BarChart2,
  Presentation,
  Crown,
  Download,
  Share2,
  RefreshCw,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

const defaultReviewData = {
  id: "rev-001",
  title: "Federated Learning with Differential Privacy for Medical Imaging",
  tier: "CORE A*",
  submittedAt: "2026-09-19",
  processingTime: "4m 12s",
  overallScore: 8.1,
  verdict: "Accept",
  verdictReason:
    "The paper presents a novel federated learning approach with rigorous differential privacy guarantees. Strong empirical results on multiple medical imaging benchmarks. Minor clarifications needed in the privacy budget analysis.",
  agents: [
    {
      id: "librarian",
      name: "Librarian Agent",
      icon: BookOpen,
      role: "Novelty & Literature",
      score: 8.0,
      color: "from-purple-500 to-violet-500",
      summary:
        "Strong novelty claims well-supported by literature. The differential privacy mechanism is distinct from prior work. Citation coverage is comprehensive with 47 references.",
      strengths: [
        "Clear positioning against state-of-the-art FL methods",
        "Identifies a genuine gap in privacy-preserving medical AI",
        "Proper attribution to foundational DP-SGD work",
      ],
      weaknesses: [
        "Related work section misses 2 recent concurrent papers (2026)",
        "Novelty claim about noise calibration could be stronger",
      ],
    },
    {
      id: "methodology",
      name: "Methodology Agent",
      icon: FlaskConical,
      role: "Theoretical Rigor",
      score: 7.5,
      color: "from-blue-500 to-indigo-500",
      summary:
        "Solid theoretical foundation with privacy-utility tradeoff proofs. The Rényi differential privacy composition theorem is correctly applied. Some notation inconsistencies in Section 4.",
      strengths: [
        "Formal privacy guarantees with (ε, δ)-DP proofs",
        "Convergence analysis under heterogeneous data distribution",
        "Well-defined threat model in Section 2.3",
      ],
      weaknesses: [
        "Notation inconsistency: ε used for both privacy budget and learning rate",
        "Assumption 3 in Theorem 2 is overly restrictive",
      ],
    },
    {
      id: "rigor",
      name: "Experimental Rigor Agent",
      icon: BarChart2,
      role: "Empirical Validation",
      score: 8.5,
      color: "from-emerald-500 to-teal-500",
      summary:
        "Excellent experimental design with 3 benchmark datasets and comprehensive ablation studies. Statistical significance tests included. Baseline selection is appropriate and fair.",
      strengths: [
        "3 diverse medical imaging datasets (ChestX-ray14, ISIC, BraTS)",
        "Ablation study covers all 4 hyperparameters",
        "5 random seed runs with reported standard deviations",
        "Comparison against 6 strong baselines",
      ],
      weaknesses: [
        "No wall-clock runtime comparison with centralized baseline",
        "Privacy budget sensitivity analysis limited to ε ∈ {1, 5, 10}",
      ],
    },
    {
      id: "presentation",
      name: "Presentation Agent",
      icon: Presentation,
      role: "Clarity & Writing",
      score: 8.0,
      color: "from-pink-500 to-rose-500",
      summary:
        "Well-structured paper with clear writing. Figures are high quality and informative. Abstract precisely summarizes contributions. Some dense notation in Section 4 could benefit from a notation table.",
      strengths: [
        "Clear and structured abstract with 4 explicit contributions",
        "Algorithm 1 pseudocode is clean and easy to follow",
        "Figure 3 effectively visualizes privacy-accuracy tradeoff",
      ],
      weaknesses: [
        "Section 4 notation density may challenge non-expert readers",
        "Conclusion lacks explicit limitations paragraph",
      ],
    },
    {
      id: "meta",
      name: "Meta-Reviewer",
      icon: Crown,
      role: "Synthesis & Verdict",
      score: 8.1,
      color: "from-amber-400 to-orange-500",
      summary:
        "Synthesizing all agent reviews, the paper makes a meaningful contribution to privacy-preserving federated learning for medical imaging. Conflicts between Methodology and Rigor scores resolved by weighting empirical evidence. Recommended for acceptance with minor revisions.",
      strengths: [
        "Strong empirical results carry significant weight at CORE A*",
        "Theoretical soundness meets top-venue bar",
        "Privacy-safety relevance is timely and impactful",
      ],
      weaknesses: [
        "Address notation inconsistency before camera-ready",
        "Add concurrent work citations",
      ],
    },
  ],
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100
  const color =
    score >= 7.5
      ? "from-emerald-500 to-teal-400"
      : score >= 5
      ? "from-amber-400 to-orange-400"
      : "from-red-500 to-rose-400"
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-900 dark:text-white w-8 text-right">{score}</span>
    </div>
  )
}

function AgentCard({ agent }: { agent: typeof defaultReviewData.agents[0] }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
        id={`agent-${agent.id}-toggle`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center`}>
            <agent.icon className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{agent.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{agent.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{agent.score}</p>
            <p className="text-xs text-gray-400">/10</p>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{agent.summary}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">Strengths</p>
              <ul className="space-y-1.5">
                {agent.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">Weaknesses</p>
              <ul className="space-y-1.5">
                {agent.weaknesses.map((w: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReviewResultPage() {
  const params = useParams<{ id: string }>()
  const [reviewData, setReviewData] = useState(defaultReviewData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    getReview(params.id)
      .then((review: ReviewResult) => {
        setReviewData({
          ...defaultReviewData,
          id: review._id,
          title: review.title,
          overallScore: review.weighted_score,
          verdict: review.recommendation,
          verdictReason: review.consolidated_summary,
          tier: review.tier,
          agents: defaultReviewData.agents.map((agent) => {
            const aliases: Record<string, string> = {
              librarian: "novelty",
              methodology: "rigor",
            }
            const critique = review.critiques?.find((item) => item.agent_name === (aliases[agent.id] || agent.id))
            return critique ? { ...agent, score: critique.score ?? agent.score, summary: critique.summary, strengths: critique.strengths ?? agent.strengths, weaknesses: critique.weaknesses ?? agent.weaknesses } : agent
          }),
        })
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not load this review."))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading review...</div>
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>

  const verdict = reviewData.verdict

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/dashboard" className="hover:text-gray-700 dark:hover:text-gray-300" id="breadcrumb-dashboard">Dashboard</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 dark:text-white font-medium truncate">{reviewData.title}</span>
      </div>

      {/* Header card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 px-2.5 py-0.5 rounded-full border border-purple-100 dark:border-purple-900/50">
                {reviewData.tier}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{reviewData.submittedAt}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">· {reviewData.processingTime}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">{reviewData.title}</h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" id="export-report">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" id="share-report">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>
        </div>

        {/* Score + verdict */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Big score */}
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
              {reviewData.overallScore}
            </span>
            <span className="text-xl text-gray-400 font-medium">/10</span>
          </div>

          {/* Verdict badge */}
          <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 ${verdict === "Accept" ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"}`}>
            {verdict === "Accept" ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            )}
            <div>
              <p className={`text-lg font-bold ${verdict === "Accept" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                {verdict}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Meta-Reviewer verdict</p>
            </div>
          </div>

          {/* Agent scores mini */}
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              {reviewData.agents.slice(0, 4).map((agent) => (
                <div key={agent.id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-28 truncate">{agent.name.replace(" Agent", "")}</span>
                  <ScoreBar score={agent.score} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Verdict reason */}
        <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{reviewData.verdictReason}</p>
          </div>
        </div>
      </div>

      {/* Agent reviews */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Agent-by-Agent Review</h2>
        <div className="space-y-3">
          {reviewData.agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Link
          href="/review/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
          id="review-new-paper"
        >
          <RefreshCw className="w-4 h-4" />
          Review Another Paper
        </Link>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          id="back-to-dashboard"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
