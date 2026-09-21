import Image from "next/image"

interface ThemeLogoProps {
  /** Tailwind height class, e.g. "h-10" */
  heightClass?: string
  /** Extra className */
  className?: string
}

/**
 * Renders both logos and toggles visibility via CSS:
 * - Light mode → scholarlens-logo-light.jpg (dark version hidden)
 * - Dark mode  → scholarlens-logo-dark.png  (light version hidden)
 *
 * Using CSS-only approach (dark:hidden / dark:block) avoids any
 * SSR vs client hydration mismatch — both images are always in the DOM.
 */
export function ThemeLogo({ heightClass = "h-10", className = "" }: ThemeLogoProps) {
  return (
    <>
      {/* Light mode logo — hidden in dark mode */}
      <Image
        src="/scholarlens-logo-light.jpg"
        alt="ScholarLens — Your AI Research Review Committee"
        width={200}
        height={60}
        className={`${heightClass} w-auto object-contain block dark:hidden ${className}`}
        priority
      />
      {/* Dark mode logo — hidden in light mode */}
      <Image
        src="/scholarlens-logo-dark.png"
        alt="ScholarLens — Your AI Research Review Committee"
        width={200}
        height={60}
        className={`${heightClass} w-auto object-contain hidden dark:block ${className}`}
        priority
      />
    </>
  )
}
