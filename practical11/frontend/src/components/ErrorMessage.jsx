function ErrorMessage({ message }) {
  return (
    <div className="error-message">
      <p>⚠️ <strong>Error:</strong> {message}</p>
    </div>
  );
}

export default ErrorMessage;
