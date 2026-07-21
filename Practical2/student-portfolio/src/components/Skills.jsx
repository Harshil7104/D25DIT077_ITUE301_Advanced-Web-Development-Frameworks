function Skills({ skills }) {

  return (
    <section className="skills" id="skills">

      <h2>Skills</h2>

      {skills.map((skill, index) => (

        <div className="skill" key={index}>

          <span>{skill}</span>

          <div className="progress">

            <div
              className="progress-fill"
              style={{ width: `${95-index*4}%` }}
            ></div>

          </div>

        </div>

      ))}

    </section>

  );

}

export default Skills;