import { useState, type FormEvent } from 'react'

export function SidebarIntro() {
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(
      query.trim()
        ? 'Coordinate search is a placeholder (map jump coming next).'
        : 'Enter coordinates to search.',
    )
  }

  return (
    <section className="sidebar-intro">
      <div className="sidebar-intro-title">
        <h1>
          Fire Vulnerability
          <br />
          Decision Support
        </h1>
      </div>

      <form className="coord-search" onSubmit={handleSubmit}>
        <label className="coord-search-field">
          <span className="sr-only">Search by coordinates</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by coordinates"
            inputMode="text"
          />
        </label>
      </form>

      {message ? <p className="coord-search-message">{message}</p> : null}
    </section>
  )
}

