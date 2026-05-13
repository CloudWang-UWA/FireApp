import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchSiteInsights, type SiteInsightsApiResponse } from '../../api/risk'
import './HeritageSiteInsights.css'
import { InsightSidebar } from './InsightSidebar'
import { SiteInsightsMainPanels } from './SiteInsightsMainPanels'

export function HeritageSiteInsights({
  onBackToMap,
}: {
  onBackToMap?: () => void
}) {
  const [searchParams] = useSearchParams()
  const siteIdFromUrl = searchParams.get('siteId')

  const [insights, setInsights] = useState<SiteInsightsApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInsights = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setError(null)
    try {
      const api = await fetchSiteInsights({ siteId: siteIdFromUrl, signal })
      if (signal?.aborted) return
      setInsights(api)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      const message = e instanceof Error ? e.message : 'Failed to load site insights'
      if (!signal?.aborted) {
        setError(message)
        setInsights(null)
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [siteIdFromUrl])

  useEffect(() => {
    const controller = new AbortController()
    void loadInsights(controller.signal)
    return () => controller.abort()
  }, [loadInsights])

  return (
    <article className="si-page">
      {error ? (
        <div className="si-insights-error-banner" role="alert">
          <span>{error}</span>
          <button className="si-insights-retry" type="button" onClick={() => void loadInsights()}>
            Retry
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="si-insights-fetch-overlay" aria-busy="true" aria-live="polite">
          <p className="si-insights-fetch-message">Loading site insights…</p>
        </div>
      ) : null}

      <section className="si-layout">
        <InsightSidebar insights={insights} onBackToMap={onBackToMap} />

        <main className="si-main">
          {insights ? (
            <SiteInsightsMainPanels api={insights} />
          ) : !isLoading && error ? (
            <section className="si-card si-main-empty">
              <h2>Data unavailable</h2>
              <p>Site insights could not be loaded. Use Retry above, then return to the map.</p>
            </section>
          ) : null}
        </main>
      </section>
    </article>
  )
}
