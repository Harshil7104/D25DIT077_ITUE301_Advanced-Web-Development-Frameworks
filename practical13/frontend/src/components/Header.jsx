function Header({ name, roll = "Roll No: 77 (D25DIT077)" }) {
  return (
    <header className="header">
      <h1>{name}</h1>
      {roll && <p>{roll}</p>}
    </header>
  );
}

export default Header;
