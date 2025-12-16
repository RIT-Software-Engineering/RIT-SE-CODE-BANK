export default function HomePage() {
  return (
    <div className="home">
      <div className="home__card">
        <div className="home__accent" />

        <div className="home__content">
          <h1 className="home__title">Welcome to the Course Management Tool</h1>
          <p className="home__subtitle">Use the navigation above to get started.</p>

          <ul className="home__list">
            <li>
              <span className="home__label">Team Builder</span>
              <span className="home__dash">—</span>
              <span className="home__text">create and manage student teams</span>
            </li>
            <li>
              <span className="home__label">Calendar</span>
              <span className="home__dash">—</span>
              <span className="home__text">plan lectures, assignments, and exams</span>
            </li>
            <li>
              <span className="home__label">Course Builder</span>
              <span className="home__dash">—</span>
              <span className="home__text">manage course metadata</span>
            </li>
            <li>
              <span className="home__label">Create Template</span>
              <span className="home__dash">—</span>
              <span className="home__text">build reusable course templates</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
