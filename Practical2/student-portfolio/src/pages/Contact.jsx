import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Contact({ theme, toggleTheme }) {

    const [message, setMessage] = useState("");

    const [Submit, setSubmit] = useState(false);

    return (
        <>
            <Navbar themeColor="#38bdf8" theme={theme} toggleTheme={toggleTheme} />
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
            <Footer />
        </>
    );

}

export default Contact;