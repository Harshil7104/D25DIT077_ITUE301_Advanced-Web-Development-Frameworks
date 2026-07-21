import { useState, useEffect } from "react";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";

function Projects() {

  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    fetch("https://api.github.com/users/Harshil7104/repos")
      .then((response) => {

        if (!response.ok) {
          throw new Error("Failed to fetch repositories.");
        }

        return response.json();
      })

      .then((data) => {
        setRepos(data);
      })

      .catch((err) => {
        setError(err.message);
      })

      .finally(() => {
        setLoading(false);
      });

  }, []);

  if (loading) return <Spinner />;

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="page">

      <h1>GitHub Projects</h1>

      <div className="repo-list">

        {repos.map((repo) => (

          <div className="repo-card" key={repo.id}>

            <h3>{repo.name}</h3>

            <div className="repo-info">
                <span>⭐ {repo.stargazers_count}</span>
            </div>

            <a
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
            >
              View Repository
            </a>

          </div>

        ))}

      </div>

    </div>
  );
}

export default Projects;