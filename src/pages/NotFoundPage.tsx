import { Link } from 'react-router'

/** Any address that isn't a page. The server sends it with a 404 status (dist/404.html). */
export function NotFoundPage() {
  return (
    <main className="notfound">
      <p className="notfound__code grad-blue" aria-hidden="true">
        404
      </p>
      <h1 className="notfound__title grad-silver">Page not found</h1>
      <p className="notfound__text">
        That address doesn't lead anywhere on this site. It may have been mistyped, or the page may have moved.
      </p>
      <div className="notfound__actions">
        <Link className="btn btn--blue notfound__home" to="/">
          BACK TO HOME
        </Link>
        <Link className="pill" to="/leaderboard">
          View Leaderboard
        </Link>
      </div>
    </main>
  )
}
