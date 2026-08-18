import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Projects({ theme, toggleTheme }) {
    return (
        <>
            <Navbar themeColor="#38bdf8" theme={theme} toggleTheme={toggleTheme} />
            <div className="page">

                <h1>Projects</h1>

                <h3>Royal Rasoi</h3>

                <p>
                    Restaurant Ordering System using
                    React, Node.js and MySQL.
                </p>

                <h3>Cyber Security Assistant</h3>

                <p>
                    AI based phishing detection system.
                </p>

            </div>
            <Footer />
        </>
    );
}

export default Projects;