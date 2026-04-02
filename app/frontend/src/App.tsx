import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { useNavigate } from 'react-router-dom'
import './App.css'

import { Auth } from './components/auth/Auth'
import { Profile } from './components/auth/Profile'
import { Basemap } from './components/map/Basemap'
import { Layers } from './components/map/Layers'
import { MapView } from './components/map/MapView'
import { Risk } from './components/risk/Risk'
import { LAYER_CONFIG } from './config/map'
import { AppRoutes } from './routes/AppRoutes'
import {
  getCurrentUser,
  getStoredToken,
  login,
  logout,
  register,
  storeToken,
} from './api/auth'
import { fetchLayer } from './api/layers'
import type { AuthFormState, AuthMode, AuthUser } from './types/auth'
import type { BasemapKey, LayerKey, LayerState, LayerStateMap } from './types/map'
import { prepareLayerData } from './utils/geojson'

const EMPTY_AUTH_FORM: AuthFormState = {
  displayName: '',
  email: '',
  password: '',
}

function App() {
  const navigate = useNavigate()
  const [layers, setLayers] = useState<LayerStateMap>(() =>
    Object.fromEntries(
      LAYER_CONFIG.map(({ key }) => [
        key,
        { data: null, isLoading: true, error: null } satisfies LayerState,
      ]),
    ) as LayerStateMap,
  )
  const [visibleLayers, setVisibleLayers] = useState<Record<LayerKey, boolean>>({
    site: true,
    granite: true,
    fuel: false,
    vegetation: false,
    slope: false,
  })
  const [basemap, setBasemap] = useState<BasemapKey>('osm')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authToken, setAuthToken] = useState<string>(() => getStoredToken())
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authForm, setAuthForm] = useState<AuthFormState>(EMPTY_AUTH_FORM)

  useEffect(() => {
    let isCancelled = false

    async function loadLayer(layerKey: LayerKey) {
      try {
        const data = prepareLayerData(layerKey, await fetchLayer(layerKey))
        if (!isCancelled) {
          setLayers((current) => ({
            ...current,
            [layerKey]: { data, isLoading: false, error: null },
          }))
        }
      } catch (error) {
        if (!isCancelled) {
          setLayers((current) => ({
            ...current,
            [layerKey]: {
              data: null,
              isLoading: false,
              error:
                error instanceof Error ? error.message : 'Unable to load layer',
            },
          }))
        }
      }
    }

    // Keep the sidebar counts and the map in sync from the same layer state.
    for (const { key } of LAYER_CONFIG) {
      void loadLayer(key)
    }

    return () => {
      isCancelled = true
    }
  }, [])

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
        const payload = await getCurrentUser(authToken)
        if (!isCancelled) {
          setCurrentUser(payload.user ?? null)
        }
      } catch (error) {
        if (!isCancelled) {
          setCurrentUser(null)
          setAuthToken('')
          storeToken('')
          setAuthError(error instanceof Error ? error.message : 'Session expired')
        }
      } finally {
        if (!isCancelled) {
          setIsAuthLoading(false)
        }
      }
    }

    // Try to restore the saved session before showing the workspace.
    void loadCurrentUser()

    return () => {
      isCancelled = true
    }
  }, [authToken])

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
      storeToken(token)
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

  async function handleLogout() {
    setIsAuthLoading(true)
    setAuthError('')
    setAuthMessage('')

    try {
      if (authToken) {
        await logout(authToken)
      }
    } finally {
      setCurrentUser(null)
      setAuthToken('')
      storeToken('')
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
          <p className="eyebrow">Heritage Fire Watch</p>
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
          <p className="eyebrow">Heritage Fire Watch</p>
          <h1>Sign in to continue</h1>
          <p className="intro">
            Access the heritage fire mapping workspace by signing in with your
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

  const topbar = currentUser ? (
    <header className="topbar">
      <button className="topbar-brand" onClick={() => navigate('/app')} type="button">
        Heritage Fire Watch
      </button>

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

  const workspacePage = currentUser ? (
    <main className="workspace-shell">
      {topbar}
      <section className="workspace-body">
        <aside className="sidebar">
          <div className="sidebar-scroll">
            <Layers
              layers={layers}
              visibleLayers={visibleLayers}
              setVisibleLayers={setVisibleLayers}
            />
            <Basemap basemap={basemap} setBasemap={setBasemap} />
            <Risk />
          </div>
        </aside>

        <section className="map-stage">
          <MapView basemap={basemap} layers={layers} visibleLayers={visibleLayers} />
        </section>
      </section>
    </main>
  ) : null

  const profilePage = currentUser ? (
    <main className="workspace-shell">
      {topbar}
      <section className="workspace-body workspace-body--profile">
        <Profile
          currentUser={currentUser}
          onBack={() => navigate('/app')}
          onLogout={() => void handleLogout()}
          isAuthLoading={isAuthLoading}
        />
      </section>
    </main>
  ) : null

  return (
    <AppRoutes
      currentUser={Boolean(currentUser)}
      loginPage={loginPage}
      workspacePage={workspacePage}
      profilePage={profilePage}
    />
  )
}

export default App
