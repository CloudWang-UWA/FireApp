import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import {
  createSiteUpload,
  type SiteUploadResponse,
} from '../../api/siteUpload'
import { PLACE_TYPE_OPTIONS } from '../../config/placeTypes'

type SiteUploadProps = {
  authToken: string
}

type FormState = {
  name: string
  placeType: string
  notes: string
  latitude: string
  longitude: string
  siteSizeM: string
  locationSource: 'manual' | 'device_gps'
}

const EMPTY_FORM: FormState = {
  name: '',
  placeType: '',
  notes: '',
  latitude: '',
  longitude: '',
  siteSizeM: '350',
  locationSource: 'manual',
}

export function SiteUpload({ authToken }: SiteUploadProps) {
  const [siteForm, setSiteForm] = useState<FormState>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [locationMessage, setLocationMessage] = useState('')
  const [outOfAreaWarning, setOutOfAreaWarning] = useState('')
  const [uploadSummary, setUploadSummary] = useState<SiteUploadResponse | null>(null)

  function fillCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage('Location is not available in this browser')
      return
    }

    setIsGettingLocation(true)
    setLocationMessage('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSiteForm((current) => ({
          ...current,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
          locationSource: 'device_gps',
        }))
        setLocationMessage('Current location loaded')
        setIsGettingLocation(false)
      },
      () => {
        setSiteForm((current) => ({
          ...current,
          locationSource: 'manual',
        }))
        setLocationMessage('Could not get current location')
        setIsGettingLocation(false)
      },
    )
  }

  useEffect(() => {
    fillCurrentLocation()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')
    setSuccessMessage('')
    setOutOfAreaWarning('')

    const siteName = siteForm.name.trim()

    if (!siteName) {
      setSubmitError('Site name cannot be empty')
      setIsSubmitting(false)
      return
    }

    try {
      // Convert string inputs to numbers before sending to backend
      const uploadResult = await createSiteUpload(authToken, {
        name: siteName,
        placeType: siteForm.placeType,
        notes: siteForm.notes,
        latitude: Number(siteForm.latitude),
        longitude: Number(siteForm.longitude),
        siteSizeM: Number(siteForm.siteSizeM),
        locationSource: siteForm.locationSource,
      })

      setSuccessMessage('Site uploaded successfully')
      setUploadSummary(uploadResult)
      setOutOfAreaWarning(uploadResult.outOfAreaWarning ?? '')
      setSiteForm((current) => ({
        ...EMPTY_FORM,
        latitude: current.latitude,
        longitude: current.longitude,
        locationSource: current.locationSource,
      }))
    } catch (submitError) {
      setSubmitError(
        submitError instanceof Error ? submitError.message : 'Upload failed',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-gate-card">
        <div className="auth-gate-copy">
          <p className="eyebrow">Heritage Fire Watch</p>
          <h1>Site Upload</h1>
          <p className="intro">
            Record a newly identified heritage site for later review and risk
            assessment.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Site name</span>
            <input
              type="text"
              value={siteForm.name}
              onChange={(event) =>
                setSiteForm((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
          </label>

          <label className="auth-field">
            <span>Place type</span>
            <select
              value={siteForm.placeType}
              onChange={(event) =>
                setSiteForm((current) => ({
                  ...current,
                  placeType: event.target.value,
                }))
              }
              required
            >
              <option value="">Select a place type</option>
              {PLACE_TYPE_OPTIONS.map((placeType) => (
                <option key={placeType} value={placeType}>
                  {placeType}
                </option>
              ))}
            </select>
          </label>

          <label className="auth-field">
            <span>Notes</span>
            <textarea
              value={siteForm.notes}
              onChange={(event) =>
                setSiteForm((current) => ({ ...current, notes: event.target.value }))
              }
              rows={4}
            />
          </label>

          <label className="auth-field">
            <span>Latitude</span>
            <input
              type="number"
              step="any"
              value={siteForm.latitude}
              onChange={(event) =>
                setSiteForm((current) => ({
                  ...current,
                  latitude: event.target.value,
                  locationSource: 'manual',
                }))
              }
              required
            />
          </label>

          <label className="auth-field">
            <span>Longitude</span>
            <input
              type="number"
              step="any"
              value={siteForm.longitude}
              onChange={(event) =>
                setSiteForm((current) => ({
                  ...current,
                  longitude: event.target.value,
                  locationSource: 'manual',
                }))
              }
              required
            />
          </label>

          <label className="auth-field">
            <span>Site size (m)</span>
            <input
              type="number"
              min="1"
              step="any"
              value={siteForm.siteSizeM}
              onChange={(event) =>
                setSiteForm((current) => ({
                  ...current,
                  siteSizeM: event.target.value,
                }))
              }
              required
            />
            <small className="auth-help">
              Enter the approximate side length of the square site
            </small>
          </label>

          <button
            className="auth-submit"
            type="button"
            onClick={fillCurrentLocation}
            disabled={isGettingLocation || isSubmitting}
          >
            {isGettingLocation ? 'Getting location...' : 'Use current location'}
          </button>

          {locationMessage ? (
            <p className="auth-feedback">{locationMessage}</p>
          ) : null}

          {submitError ? (
            <p className="auth-feedback auth-feedback--error">{submitError}</p>
          ) : null}

          {successMessage ? (
            <p className="auth-feedback auth-feedback--success">
              {successMessage}
            </p>
          ) : null}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save site'}
          </button>
        </form>

        {outOfAreaWarning ? (
          <section className="upload-result upload-result--warning">
            <h2>Study Area Warning</h2>
            <p>{outOfAreaWarning}</p>
          </section>
        ) : null}

        {uploadSummary && !outOfAreaWarning ? (
          <section className="upload-result">
            <h2>Upload Summary</h2>
            <p>
              Site <strong>{uploadSummary.site.name}</strong> was saved at{' '}
              {uploadSummary.site.latitude}, {uploadSummary.site.longitude}.
            </p>
          </section>
        ) : null}
      </section>
    </main>
  )
}
