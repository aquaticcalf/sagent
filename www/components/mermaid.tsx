"use client"

import mermaid from "mermaid"
import { useEffect, useMemo, useState } from "react"
import { useTheme } from "next-themes"

export function Mermaid({ chart }: { chart: string }) {
  const { resolvedTheme } = useTheme()
  const [svg, setSvg] = useState<string>("")

  const normalized = useMemo(() => chart.trim(), [chart])
  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    let cancelled = false

    // Clear old SVG immediately so we don't show stale colors while rendering.
    setSvg("")

    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "default",
    })

    void (async () => {
      try {
        // Use a random ID to bypass Mermaid's internal style cache.
        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`
        const { svg } = await mermaid.render(id, normalized)
        if (!cancelled) setSvg(svg)
      } catch (e) {
        if (!cancelled) {
          setSvg(
            `<pre style="white-space:pre-wrap">Failed to render Mermaid diagram.\n\n${escapeHtml(String(e))}\n\n${escapeHtml(normalized)}</pre>`,
          )
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [normalized, isDark])

  return (
    <div
      className="my-6 flex justify-center overflow-x-auto rounded-xl border bg-background p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
