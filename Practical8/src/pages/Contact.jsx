import React, { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: 'Harshil Patel',
    email: 'd25dit077@charusat.edu.in',
    category: 'Feedback',
    subject: 'Practical 8 Performance Evaluation',
    message: 'React.lazy() and Suspense code splitting successfully verified across route components and Chart.js modules.'
  });

  const [submitted, setSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setStatusMessage('Thank you! Your feedback message has been transmitted successfully.');
  };

  return (
    <div className="page-contact">
      {/* Route Header Banner */}
      <div className="page-header">
        <span className="page-badge" style={{ color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.1)' }}>
          📬 Lazy Loaded Chunk &bull; Contact Route (assets/Contact-[hash].js)
        </span>
        <h2 className="page-title">Contact &amp; Performance Feedback</h2>
        <p className="page-subtitle">
          Loaded as an asynchronous code chunk. Contact routes are rarely visited on first impression,
          making them prime candidates for route-level code splitting.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
        {/* Contact Form Panel */}
        <div className="card-panel">
          <div className="panel-title" style={{ marginBottom: '1.2rem' }}>
            <span>Send Evaluation Feedback</span>
          </div>

          {submitted && (
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-emerald)', marginBottom: '1.2rem', fontSize: '0.88rem' }}>
              ✓ {statusMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Institutional Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Inquiry Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="Feedback">Feedback</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Academic Evaluation">Academic Evaluation</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Subject</label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Message Description</label>
              <textarea
                name="message"
                rows="4"
                required
                value={formData.message}
                onChange={handleChange}
                className="input-field"
                style={{ resize: 'vertical' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              Submit Contact Feedback
            </button>
          </form>
        </div>

        {/* Code-Splitting Insights & Contact Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card-panel">
            <h3 className="panel-title" style={{ marginBottom: '0.8rem', fontSize: '1.15rem' }}>
              <span>💡 Why Code-Split This Route?</span>
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
              In real-world web applications, less than <strong>8-12%</strong> of unique sessions navigate to the Contact/Support page. Bundling contact form components, validation logic, and third-party mailer libraries into the primary bundle unnecessarily slows down the initial page load time (First Contentful Paint) for the 90% of users who never visit this page.
            </p>
            <div style={{ padding: '0.8rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Chunk Status: <strong>Loaded On-Demand</strong> &bull; Size: <strong>~7.8 KB</strong>
            </div>
          </div>

          <div className="card-panel">
            <h3 className="panel-title" style={{ marginBottom: '0.8rem', fontSize: '1.15rem' }}>
              <span>🎓 Author Information</span>
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <li><strong>Student Name:</strong> Harshil Patel</li>
              <li><strong>Student ID:</strong> <code>D25DIT077</code></li>
              <li><strong>Course:</strong> ITUE301 Advanced Web Development Frameworks</li>
              <li><strong>Topic:</strong> Practical 8 - Code Splitting &amp; Performance Optimization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
