import Navbar from "./Navbar";

function Header({ name, themeColor, theme, toggleTheme }) {
  return (
    <header className="header" id="home">

      <Navbar themeColor={themeColor} theme={theme} toggleTheme={toggleTheme} />

      <div className="hero">

        <h1>Hi, I'm {name}</h1>

        <h3>
          Full Stack Developer &
          Cyber Security Enthusiast
        </h3>

        <p>
          I build responsive web applications using React,
          JavaScript and modern technologies while learning
          Cyber Security.
        </p>

        <button>Download Resume</button>

      </div>

    </header>
  );
}

export default Header;