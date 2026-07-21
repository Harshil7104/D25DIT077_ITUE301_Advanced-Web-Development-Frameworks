import { useState } from "react";

function Contact() {

    const [message, setMessage] = useState("");

    const [Submit, setSubmit] = useState(false);

    return (

        <div className="page">

            <h1>Contact Me</h1>

            <input
                type="text"
                placeholder="Enter Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />

            <p>
                Message:
                {message}
            </p>

            <button
                onClick={() =>
                    setSubmit(!Submit)
                }
            >
                Submit
            </button>

            {Submit && (

                <p>
                    Message submitted.
                </p>

            )}

        </div>

    );

}

export default Contact;