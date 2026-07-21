import Header from "../components/Header";
import About from "../components/About";
import Skills from "../components/Skills";
import Footer from "../components/Footer";

function Home() {

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
            />

            <About />

            <Skills skills={skills} />

            <Footer />
        </>
    );
}

export default Home;