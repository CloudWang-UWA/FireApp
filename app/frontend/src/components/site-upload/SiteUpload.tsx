import type { FormEvent } from 'react'
import { useRef, useState } from 'react'

import {
  createSiteUpload,
  type SiteUploadResponse,
  uploadSitePhoto,
} from '../../api/siteUpload'
import { PLACE_TYPE_OPTIONS } from '../../config/placeTypes'

type SiteUploadProps = {
  authToken: string
  onBack: () => void
  onUploadSuccess: () => Promise<void> | void
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

export function SiteUpload({
  authToken,
  onBack,
  onUploadSuccess,
}: SiteUploadProps) {
  const [siteForm, setSiteForm] = useState<FormState>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [locationMessage, setLocationMessage] = useState('')
  const [outOfAreaWarning, setOutOfAreaWarning] = useState('')
  const [uploadSummary, setUploadSummary] = useState<SiteUploadResponse | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const locationRequestId = useRef(0)
  const manualEditVersion = useRef(0)

  function getLocationErrorMessage(error: GeolocationPositionError) {
    if (error.code === error.PERMISSION_DENIED) {
      return 'Location permission was denied'
    }

    if (error.code === error.POSITION_UNAVAILABLE) {
      return 'Location is unavailable right now'
    }

    if (error.code === error.TIMEOUT) {
      return 'Location request timed out'
    }

    return error.message || 'Could not get current location'
  }

  function fillCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage('Location is not available in this browser')
      return
    }

    const requestId = locationRequestId.current + 1
    const editVersionAtRequest = manualEditVersion.current
    locationRequestId.current = requestId
    setIsGettingLocation(true)
    setLocationMessage('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (
          requestId !== locationRequestId.current ||
          editVersionAtRequest !== manualEditVersion.current
        ) {
          setLocationMessage('Kept manually entered coordinates')
          setIsGettingLocation(false)
          return
        }

        setSiteForm((current) => ({
          ...current,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
          locationSource: 'device_gps',
        }))
        setLocationMessage('Current location loaded')
        setIsGettingLocation(false)
      },
      (error) => {
        setSiteForm((current) => ({
          ...current,
          locationSource: 'manual',
        }))
        setLocationMessage(getLocationErrorMessage(error))
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      },
    )
  }

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

      if (selectedPhoto) {
        const updatedSite = await uploadSitePhoto(
          authToken,
          uploadResult.site.id,
          selectedPhoto,
        )
        uploadResult.site = updatedSite
      }

      setSuccessMessage('Site uploaded successfully')
      setUploadSummary(uploadResult)
      setOutOfAreaWarning(uploadResult.outOfAreaWarning ?? '')
      await onUploadSuccess()
      setSiteForm((current) => ({
        ...EMPTY_FORM,
        latitude: current.latitude,
        longitude: current.longitude,
        locationSource: current.locationSource,
      }))
      setSelectedPhoto(null)
    } catch (submitError) {
      setSubmitError(
        submitError instanceof Error ? submitError.message : 'Upload failed',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="site-upload-page">
      <section className="site-upload-header">
        <div>
          <p className="eyebrow">Heritage Fire Watch</p>
          <h1>Site Upload</h1>
          <p className="intro">
            Record a newly identified heritage site for later review and risk
            assessment.
          </p>
        </div>
      </section>

      <section className="site-upload-content">
        <form className="auth-form site-upload-form" onSubmit={handleSubmit}>
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
            <span>Reference photo (optional)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                setSelectedPhoto(event.target.files?.[0] ?? null)
              }}
            />
            <small className="auth-help">
              Upload one JPG, PNG, or WEBP image up to 5 MB
            </small>
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
              onInput={() => {
                manualEditVersion.current += 1
              }}
              onWheel={(event) => event.currentTarget.blur()}
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
              onInput={() => {
                manualEditVersion.current += 1
              }}
              onWheel={(event) => event.currentTarget.blur()}
              required
            />
          </label>

          <div className="site-upload-actions site-upload-actions--center">
            <button
              className="auth-submit"
              type="button"
              onClick={fillCurrentLocation}
              disabled={isGettingLocation || isSubmitting}
            >
              {isGettingLocation ? 'Getting location...' : 'Use current location'}
            </button>
          </div>

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

          <div className="site-upload-actions site-upload-actions--center">
            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save site'}
            </button>
          </div>

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
        </form>

        <aside className="site-upload-aside">
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
              {uploadSummary.site.photoFilename ? (
                <p>Photo attached: {uploadSummary.site.photoFilename}</p>
              ) : null}
            </section>
          ) : null}

          <section className="upload-guidance-card">
            <h2>Submission Review</h2>
            <p>
              Uploaded places are stored for review and added to the uploaded
              site priority layer after risk processing.
            </p>
          </section>

          <button
            className="secondary-button upload-back-button"
            onClick={onBack}
            type="button"
          >
            Back to Map
          </button>
        </aside>
      </section>
    </section>
  )
}
