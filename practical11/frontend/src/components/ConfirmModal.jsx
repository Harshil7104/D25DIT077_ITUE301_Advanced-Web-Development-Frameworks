function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h4 className="modal-title">{title || "Confirm Action"}</h4>
        <p className="modal-message">{message || "Are you sure you want to proceed?"}</p>
        <div className="modal-actions">
          <button onClick={onCancel} className="btn-modal-cancel">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-modal-confirm">
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
