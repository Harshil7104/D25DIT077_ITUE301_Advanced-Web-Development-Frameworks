import { useState, useEffect } from "react";
import Spinner from "./Spinner";

/**
 * DelayedFallback Component
 * Solves the UI flicker problem on fast connections by delaying the appearance
 * of the loading spinner by 300ms. If the lazy-loaded chunk completes within 300ms,
 * no fallback is ever shown. If loading exceeds 300ms, the fallback gracefully appears.
 */
function DelayedFallback({ message = "Loading...", delay = 300 }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) {
    // Return null during the first 300ms to eliminate visual flashing on fast connections
    return null;
  }

  return (
    <div className="delayed-fallback-container">
      <Spinner message={message} />
    </div>
  );
}

export default DelayedFallback;
