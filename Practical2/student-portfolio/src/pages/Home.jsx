import Header from "../components/Header";
import About from "../components/About";
import Skills from "../components/Skills";
import Footer from "../components/Footer";

function Home({ theme, toggleTheme }) {

    const skills = [
        "HTML",
        "CSS",
        "JavaScript",
        "React",
        "Node.js",
        "MySQL"
    ];

    return (
        <>
            <Header
                name="Harshil Patel"
                themeColor="#38bdf8"
                theme={theme}
                toggleTheme={toggleTheme}
            />

            <About />

            <Skills skills={skills} />

            <Footer />
        </>
    );
}

export default Home;