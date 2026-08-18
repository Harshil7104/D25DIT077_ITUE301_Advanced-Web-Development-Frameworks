function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-container">
      <h2>Error</h2>
      <p>{message}</p>
      {onRetry && (
        <button className="retry-button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;