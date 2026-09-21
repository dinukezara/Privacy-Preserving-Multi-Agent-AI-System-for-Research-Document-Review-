import {
  Shield,
  Zap,
  Brain,
  FileText,
  BarChart3,
  Lock,
  Star,
  Trophy,
  Layers,
} from "lucide-react"

const features = [
  {
    icon: Lock,
    title: "100% Offline & Private",
    description:
      "Zero cloud calls. Your unpublished manuscripts never leave your machine — ideal for sensitive research before submission.",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-100 dark:border-emerald-900/30",
  },
  {
    icon: Brain,
    title: "5-Agent AI Committee",
    description:
      "Specialized agents for Novelty, Methodology, Experimental Rigor, Presentation, and a Meta-Reviewer synthesize a holistic verdict.",
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/20",
    border: "border-purple-100 dark:border-purple-900/30",
  },
  {
    icon: Trophy,
    title: "Conference Tier Calibration",
    description:
      "Adapts rubric strictness to CORE A*, A, B, C rankings, University Thesis guidelines, or Presentation slide decks automatically.",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-100 dark:border-amber-900/30",
  },
  {
    icon: Zap,
    title: "Fast — Under 5 Minutes",
    description:
      "A full 10-page paper review completes in under 5 minutes on a single consumer GPU (8GB VRAM) with quantized models.",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-100 dark:border-blue-900/30",
  },
  {
    icon: FileText,
    title: "Layout-Aware Parsing",
    description:
      "Handles complex IEEE/ACM multi-column papers, LaTeX-heavy documents, and PPTX slide decks with Marker and Grobid.",
    color: "text-pink-500",
    bg: "bg-pink-50 dark:bg-pink-950/20",
    border: "border-pink-100 dark:border-pink-900/30",
  },
  {
    icon: BarChart3,
    title: "Calibrated Scoring",
    description:
      "Scores calibrated against OpenReview and PeerRead benchmarks, approaching the ~0.42 human reviewer Spearman correlation.",
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
    border: "border-indigo-100 dark:border-indigo-900/30",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white dark:bg-black transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 mb-4">
            <Star className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
              Why ScholarLens
            </span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Research review,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
              reimagined
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Built for researchers who need fast, reliable, and private feedback before submitting to
            competitive venues.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`group p-6 rounded-2xl border ${feature.border} ${feature.bg} hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/30 transition-all duration-300 hover:-translate-y-0.5`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
