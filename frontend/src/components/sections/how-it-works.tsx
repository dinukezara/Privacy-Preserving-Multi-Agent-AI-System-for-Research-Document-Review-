import { Upload, SlidersHorizontal, Bot, FileCheck } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Your Document",
    description:
      "Drag and drop your PDF (IEEE, ACM, or thesis) or PPTX slide deck. Our layout-aware parser handles multi-column formats automatically.",
    color: "from-purple-500 to-violet-500",
    highlight: "PDF, PPTX supported",
  },
  {
    number: "02",
    icon: SlidersHorizontal,
    title: "Select Conference Tier",
    description:
      "Choose your target venue — CORE A*, A, B, C, University Thesis, or General Presentation. The AI calibrates its strictness accordingly.",
    color: "from-blue-500 to-indigo-500",
    highlight: "Dynamic rubric calibration",
  },
  {
    number: "03",
    icon: Bot,
    title: "AI Committee Reviews",
    description:
      "5 specialized agents analyze novelty, methodology, experimental rigor, and presentation quality — all running locally via Ollama.",
    color: "from-pink-500 to-rose-500",
    highlight: "Fully offline, no cloud",
  },
  {
    number: "04",
    icon: FileCheck,
    title: "Get Your Report",
    description:
      "Receive a structured report with per-agent scores, conflict resolutions, an overall 1–10 score, and an Accept/Reject recommendation.",
    color: "from-emerald-500 to-teal-500",
    highlight: "Detailed PDF/Markdown export",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-black border-y border-gray-200 dark:border-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            From upload to review in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
              4 simple steps
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No account sharing, no cloud uploads — just instant, rigorous academic feedback.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 transition-all duration-300"
            >
              {/* Step number */}
              <span className="absolute top-6 right-6 text-5xl font-black text-gray-200 dark:text-gray-800 select-none">
                {step.number}
              </span>

              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 shadow-lg`}>
                <step.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                {step.description}
              </p>

              {/* Highlight badge */}
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                {step.highlight}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
