import { useState } from "react";

import { Link } from "react-router-dom";

function Navbar({ themeColor }) {

    return (

        <nav className="navbar">

            <h2
                className="logo"
                style={{ color: themeColor }}
            >
                Harshil Patel
            </h2>

            <ul className="nav-links">

                <li>
                    <Link to="/">
                        Home
                    </Link>
                </li>

                <li>
                    <Link to="/projects">
                        Projects
                    </Link>
                </li>

                <li>
                    <Link to="/contact">
                        Contact
                    </Link>
                </li>

            </ul>

        </nav>

    );

}

export default Navbar;