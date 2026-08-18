import { useState, useEffect } from "react";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";

function Projects() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRepos = () => {
    setLoading(true);
    setError(null);
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
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  if (loading) return <Spinner />;

  if (error) return <ErrorMessage message={error} onRetry={fetchRepos} />;

  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page">
      <h1>GitHub Projects</h1>

      <input
        type="text"
        placeholder="Search repositories by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />

      <div className="repo-list">
        {filteredRepos.length > 0 ? (
          filteredRepos.map((repo) => (
            <div className="repo-card" key={repo.id}>
              <h3 className="repo-title">
                <span className="repo-name">{repo.name}</span>
                <span className="repo-stars">⭐ {repo.stargazers_count}</span>
              </h3>

              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
              >
                View Repository
              </a>
            </div>
          ))
        ) : (
          <div className="no-repos">
            <p>No repositories found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Projects;