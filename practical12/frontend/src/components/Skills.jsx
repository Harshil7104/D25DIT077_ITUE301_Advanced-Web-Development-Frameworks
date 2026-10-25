function Skills({ skillList }) {
  return (
    <section className="section">
      <h2>Skills & Tech Stack</h2>

      <ul>
        {skillList.map((skill) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
    </section>
  );
}

export default Skills;
