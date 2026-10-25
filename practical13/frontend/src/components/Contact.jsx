import { useState } from 'react';

function Contact() {
  const [message, setMessage] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  return (
    <section className="section">
      <h2>Contact Me</h2>

      <div className="contact-container">
        <button 
          className="btn-toggle" 
          onClick={() => setShowHelp(!showHelp)}
        >
          {showHelp ? "Hide Help Info" : "Show Help Info"}
        </button>

        {showHelp && (
          <div className="help-box">
            <p>💡 <strong>Help Tooltip:</strong> Type your message below to see live real-time state updates!</p>
          </div>
        )}

        <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="message-input">Message:</label>
          <input
            id="message-input"
            type="text"
            placeholder="Type a message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </form>

        <div className="live-preview">
          <h4>Real-Time Controlled Input Display:</h4>
          <p>{message ? message : "No message entered yet..."}</p>
        </div>
      </div>
    </section>
  );
}

export default Contact;
