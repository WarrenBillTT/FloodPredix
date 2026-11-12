import { Reveal } from "../common/Reveal";

const members = [
  "Vincent Winsen Trijunius",
  "Warren Bill Trumputra Tjhin",
  "Demetrius Denzell Tan",
];

export function TeamSection() {
  return (
    <section className="section band" id="team">
      <div className="wrap split">
        <div className="sticky">
          <Reveal>
            <span className="eyebrow">Team</span>
            <h2 className="display h2">
              Built by three students, tested on a <em>real sensor.</em>
            </h2>
            <p className="lede team-lead">
              FloodPredix is an Artificial Intelligence AoL project at BINUS
              University, from firmware to dashboard.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <ul className="names">
            {members.map((m, i) => (
              <li key={m}>
                {m}
                <span>{String(i + 1).padStart(2, "0")}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
