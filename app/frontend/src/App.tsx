import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { useLocation, useNavigate } from 'react-router-dom'
import './App.css'

import type { ExportBounds } from './api/export'
import {
  bootstrapSession,
  clearStoredAuth,
  getStoredToken,
  login,
  logout,
  register,
} from './api/auth'
import { AboutPage } from './components/about/AboutPage'
import { Auth } from './components/auth/Auth'
import { Profile } from './components/auth/Profile'
import { Export } from './components/export/Export'
import { Basemap } from './components/map/Basemap'
import { Layers } from './components/map/Layers'
import { MapView } from './components/map/MapView'
import { Risk } from './components/risk/Risk'
import { SiteUpload } from './components/site-upload/SiteUpload'
import { HeritageSiteInsights } from './components/resources/HeritageSiteInsights'
import { LAYER_CONFIG } from './config/map'
import { AppRoutes } from './routes/AppRoutes'
import { fetchLayer, fetchOverlay } from './api/layers'
import type { AuthFormState, AuthMode, AuthUser } from './types/auth'
import type { BasemapKey, LayerKey, LayerState, LayerStateMap } from './types/map'
import { prepareLayerData } from './utils/geojson'

const EMPTY_AUTH_FORM: AuthFormState = {
  displayName: '',
  email: '',
  password: '',
  username: '',
  bio: '',
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const storedToken = getStoredToken()

  async function loadGeoJsonLayer(layerKey: LayerKey) {
    try {
      const data = prepareLayerData(layerKey, await fetchLayer(layerKey))
      setLayers((current) => ({
        ...current,
        [layerKey]: {
          ...current[layerKey],
          geojson: data,
          isLoading: false,
          error: null,
        },
      }))
    } catch (error) {
      setLayers((current) => ({
        ...current,
        [layerKey]: {
          ...current[layerKey],
          geojson: null,
          overlay: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unable to load layer',
        },
      }))
    }
  }

  const [layers, setLayers] = useState<LayerStateMap>(() =>
    Object.fromEntries(
      LAYER_CONFIG.map(({ key, kind }) => [
        key,
        {
          kind,
          geojson: null,
          overlay: null,
          isLoading: true,
          error: null,
        } satisfies LayerState,
      ]),
    ) as LayerStateMap,
  )
  const [visibleLayers, setVisibleLayers] = useState<Record<LayerKey, boolean>>({
    recorded_site_priority: true,
    precaution_zone: true,
    uploaded_site_priority: true,
    granite: false,
    fire_history: false,
    fuel: false,
    slope: false,
  })
  const [basemap, setBasemap] = useState<BasemapKey>('osm')
  const [mapBounds, setMapBounds] = useState<ExportBounds | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authToken, setAuthToken] = useState<string>(storedToken)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(storedToken))
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authForm, setAuthForm] = useState<AuthFormState>(EMPTY_AUTH_FORM)

  // Load all configured GIS layers after the user is authenticated
  useEffect(() => {
    if (!currentUser) {
      return
    }

    let isCancelled = false

    async function loadLayerOnce(layerKey: LayerKey) {
      try {
        const config = LAYER_CONFIG.find((layer) => layer.key === layerKey)
        if (!config) {
          return
        }

        if (config.kind === 'image_overlay') {
          const overlay =
            layerKey === 'fuel'
              ? await fetchOverlay('fuel')
              : layerKey === 'slope'
                ? await fetchOverlay('slope')
                : null

          if (!overlay) {
            throw new Error(`Unsupported overlay layer '${layerKey}'`)
          }
          if (!isCancelled) {
            setLayers((current) => ({
              ...current,
              [layerKey]: {
                ...current[layerKey],
                overlay,
                geojson: null,
                isLoading: false,
                error: null,
              },
            }))
          }
          return
        }

        const data = prepareLayerData(layerKey, await fetchLayer(layerKey))
        if (!isCancelled) {
          setLayers((current) => ({
            ...current,
            [layerKey]: {
              ...current[layerKey],
              geojson: data,
              overlay: null,
              isLoading: false,
              error: null,
            },
          }))
        }
      } catch (error) {
        if (!isCancelled) {
          setLayers((current) => ({
            ...current,
            [layerKey]: {
              ...current[layerKey],
              geojson: null,
              overlay: null,
              isLoading: false,
              error:
                error instanceof Error ? error.message : 'Unable to load layer',
            },
          }))
        }
      }
    }

    for (const { key } of LAYER_CONFIG) {
      void loadLayerOnce(key)
    }

    return () => {
      isCancelled = true
    }
  }, [currentUser])

  // Restore the saved user session from the stored token
  useEffect(() => {
    if (!authToken) {
      setCurrentUser(null)
      return
    }

    let isCancelled = false

    async function loadCurrentUser() {
      setIsAuthLoading(true)
      setAuthError('')

      try {
        const user = await bootstrapSession()

        if (!isCancelled) {
          setCurrentUser(user)

          if (!user) {
            setAuthToken('')
            setAuthError('Session expired')
          }
        }
      } catch (error) {
        if (!isCancelled) {
          clearStoredAuth()
          setCurrentUser(null)
          setAuthToken('')
          setAuthError(error instanceof Error ? error.message : 'Session expired')
        }
      } finally {
        if (!isCancelled) {
          setIsAuthLoading(false)
        }
      }
    }

    void loadCurrentUser()

    return () => {
      isCancelled = true
    }
  }, [authToken])

  // Handle login and registration with the same form flow
  async function submitAuthForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsAuthLoading(true)
    setAuthError('')
    setAuthMessage('')

    try {
      const result =
        authMode === 'login' ? await login(authForm) : await register(authForm)

      const token = result.token ?? ''

      setAuthToken(token)
      setCurrentUser(result.user ?? null)
      setAuthMessage(result.message ?? 'Success')
      setAuthForm(EMPTY_AUTH_FORM)
      navigate('/app', { replace: true })
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setIsAuthLoading(false)
    }
  }

  // Clear local auth state whether or not the logout request succeeds
  async function handleLogout() {
    setIsAuthLoading(true)
    setAuthError('')
    setAuthMessage('')

    try {
      if (authToken) {
        await logout(authToken)
      } else {
        clearStoredAuth()
      }
    } finally {
      setCurrentUser(null)
      setAuthToken('')
      setAuthMessage('Logged out')
      setIsAuthLoading(false)
      navigate('/login', { replace: true })
    }
  }

  const userInitial = (currentUser?.displayName || currentUser?.email || 'U')
    .trim()
    .charAt(0)
    .toUpperCase()

  if (authToken && isAuthLoading && !currentUser) {
    return (
      <main className="auth-shell">
        <section className="auth-gate-card auth-gate-card--compact">
          <p className="eyebrow">Karla Heritage Watch</p>
          <h1>Checking your session</h1>
          <p className="intro">Please wait while we restore your account.</p>
        </section>
      </main>
    )
  }

  const loginPage = (
    <main className="auth-shell">
      <section className="auth-gate-card">
        <div className="auth-gate-copy">
          <p className="eyebrow">Karla Heritage Watch</p>
          <h1>Sign in to continue</h1>
          <p className="intro">
            Access the heritage fire vulnerability map by signing in with your
            account first.
          </p>
        </div>

        <Auth
          authMode={authMode}
          setAuthMode={(mode) => {
            setAuthMode(mode)
            setAuthError('')
            setAuthMessage('')
          }}
          currentUser={currentUser}
          isAuthLoading={isAuthLoading}
          authError={authError}
          authMessage={authMessage}
          authForm={authForm}
          setAuthForm={setAuthForm}
          onSubmit={submitAuthForm}
          onLogout={() => void handleLogout()}
        />
      </section>
    </main>
  )

  const activePath = location.pathname
  const isActive = (path: string) => activePath === path

  const topbar = currentUser ? (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="topbar-brand"
          onClick={() => navigate('/app')}
          type="button"
        >

          <span className="topbar-brand-name">Karla Heritage Watch</span>
          <span className="topbar-brand-subtitle">Albany, WA Region</span>
        </button>
      </div>

      <nav className="topbar-center" aria-label="Primary navigation">
        <div className="topbar-nav-group">
          <button
            className={isActive('/app') ? 'topbar-nav is-active' : 'topbar-nav'}
            onClick={() => navigate('/app')}
            type="button"
          >
            Risk Map
          </button>

          <button
            className={
              isActive('/resources/heritage-site-insights')
                ? 'topbar-nav is-active'
                : 'topbar-nav'
            }
            onClick={() => navigate('/resources/heritage-site-insights')}
            type="button"
          >
            Site Insights
          </button>

          {/* Reports is hidden until its page route is fully implemented. */}
          {/* <button
            className={isActive('/reports') ? 'topbar-nav is-active' : 'topbar-nav'}
            onClick={() => navigate('/reports')}
            type="button"
          >
            Reports
          </button> */}

          <button
            className={isActive('/about') ? 'topbar-nav is-active' : 'topbar-nav'}
            onClick={() => navigate('/about')}
            type="button"
          >
            About
          </button>

          <button
            className={isActive('/site-upload') ? 'topbar-nav is-active' : 'topbar-nav'}
            onClick={() => navigate('/site-upload')}
            type="button"
          >
            Site Upload
          </button>
        </div>
      </nav>


      <button
        className="topbar-user"
        onClick={() => navigate('/profile')}
        type="button"
      >
        <span className="topbar-avatar">{userInitial}</span>
        <span className="topbar-user-text">
          <strong>{currentUser.displayName}</strong>
          <span>{currentUser.email}</span>
        </span>
      </button>
    </header>
  ) : null

  const mapPage = currentUser ? (
    <main className="map-shell">
      {topbar}
      <section className="map-body">
        <aside className="sidebar">
          <div className="sidebar-scroll">
            <Layers
              layers={layers}
              visibleLayers={visibleLayers}
              setVisibleLayers={setVisibleLayers}
            />
            <Basemap basemap={basemap} setBasemap={setBasemap} />
            <Risk />
            <Export mapBounds={mapBounds} />
          </div>
        </aside>

        <section className="map-stage">
          <MapView
            basemap={basemap}
            layers={layers}
            visibleLayers={visibleLayers}
            onBoundsChange={setMapBounds}
          />
        </section>
      </section>
    </main>
  ) : null

  const profilePage = currentUser ? (
    <main className="map-shell">
      {topbar}
      <section className="map-body map-body--profile">
        <Profile
          currentUser={currentUser}
          onBack={() => navigate('/app')}
          onLogout={() => void handleLogout()}
          isAuthLoading={isAuthLoading}
        />
      </section>
    </main>
  ) : null

  const adminPage =
    currentUser?.role === 'admin' ? (
      <main className="map-shell">
        {topbar}
        <section className="map-body map-body--profile">
          <section className="status-card">
            <h2>Admin Panel</h2>
            <p>Welcome, {currentUser.displayName}.</p>
            <p>This page is only available to users with the admin role.</p>

            <button
              className="primary-button"
              type="button"
              onClick={() => navigate('/app')}
            >
              Back to Map
            </button>
          </section>
        </section>
      </main>
    ) : null

  const siteUploadPage = currentUser ? (
    <SiteUpload
      authToken={authToken}
      onBack={() => navigate('/app')}
      onUploadSuccess={() => loadGeoJsonLayer('uploaded_site_priority')}
    />
  ) : null

const heritageSiteInsightsPage = currentUser ? (
  <main className="map-shell">
    {topbar}
    <section className="map-body map-body--insights">
      <section className="map-stage map-stage--insights">
        <HeritageSiteInsights onBackToMap={() => navigate('/app')} />
      </section>
    </section>
  </main>
) : null

const aboutPage = currentUser ? (
  <main className="map-shell">
    {topbar}
    <section className="map-body map-body--profile">
      <section className="profile-view">
        <div className="profile-card">
          <AboutPage />
          <div className="profile-actions">
            <button className="secondary-button" onClick={() => navigate('/app')} type="button">
              Back to map
            </button>
          </div>
        </div>
      </section>
    </section>
  </main>
) : null


return (
  <AppRoutes
    currentUser={currentUser}
      isAuthLoading={isAuthLoading}
      loginPage={loginPage}
      mapPage={mapPage}
      profilePage={profilePage}
    aboutPage={aboutPage}
    adminPage={adminPage}
    siteUploadPage={siteUploadPage}
    heritageSiteInsightsPage={heritageSiteInsightsPage}
    />
  )
}

export default App
