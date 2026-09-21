import { Navbar } from "@/components/layout/navbar"
import { HeroSection } from "@/components/blocks/hero-section-dark"
import { FeaturesSection } from "@/components/sections/features"
import { HowItWorksSection } from "@/components/sections/how-it-works"
import { Footer } from "@/components/sections/footer"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 transition-colors">
      <Navbar isAuthenticated={false} />
      <main className="flex-1 pt-16 bg-white dark:bg-black transition-colors">
        <HeroSection
          title="AI-Powered Academic Review"
          subtitle={{
            regular: "Review your research papers with ",
            gradient: "expert AI precision.",
          }}
          description="ScholarLens deploys a 5-agent AI committee to evaluate novelty, methodology, experimental rigor, and presentation — fully offline, fully private. Submit with confidence."
          ctaText="Start Free Review"
          ctaHref="/signup"
          gridOptions={{
            angle: 65,
            opacity: 0.4,
            cellSize: 50,
            lightLineColor: "#e5e7eb",
            darkLineColor: "#262626",
          }}
        />
        <FeaturesSection />
        <HowItWorksSection />

        {/* Stats section */}
        <section className="py-20 bg-gray-50 dark:bg-black border-y border-gray-200 dark:border-gray-900 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "ρ ≥ 0.40", label: "Spearman Correlation", sub: "vs human reviewers" },
                { value: "< 5 min", label: "Review Time", sub: "for 10-page papers" },
                { value: "0", label: "Cloud API Calls", sub: "100% offline runtime" },
                { value: "5", label: "AI Agents", sub: "specialist committee" },
              ].map((stat, i) => (
                <div key={i} className="group">
                  <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{stat.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-24 bg-gradient-to-br from-purple-900 via-gray-900 to-pink-900 dark:from-purple-950 dark:via-gray-950 dark:to-pink-950">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
              Ready to strengthen your research?
            </h2>
            <p className="text-lg text-gray-300 dark:text-gray-400 mb-10">
              Join researchers who use ScholarLens to get rigorous, private feedback before submission.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/signup"
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:opacity-90 transition-opacity shadow-xl shadow-purple-900/40"
                id="cta-get-started"
              >
                Get Started Free
              </a>
              <a
                href="#how-it-works"
                className="px-8 py-4 border border-white/20 text-white font-semibold rounded-full hover:bg-white/10 transition-colors"
                id="cta-learn-more"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
