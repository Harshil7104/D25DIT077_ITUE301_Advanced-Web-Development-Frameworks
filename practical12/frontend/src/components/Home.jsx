import About from "./About";
import Skills from "./Skills";

function Home({ skillList }) {
  return (
    <div className="home-page">
      <About />
      <Skills skillList={skillList} />
    </div>
  );
}

export default Home;
