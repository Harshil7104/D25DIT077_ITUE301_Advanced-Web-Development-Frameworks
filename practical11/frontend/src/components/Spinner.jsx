function Spinner({ message = "Loading tasks..." }) {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
}

export default Spinner;
