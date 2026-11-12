import { Reveal } from "../common/Reveal";
import { CONTACT_EMAIL, DASHBOARD_URL } from "../../lib/links";

const wave = (() => {
  let d = "M0 64 L0 30";
  for (let i = 0; i < 2; i++) {
    const x = i * 1440;
    for (let k = 0; k < 12; k++) {
      const a = x + k * 120;
      d += ` Q${a + 30} ${k % 2 ? 40 : 14} ${a + 60} 30 T${a + 120} 30`;
    }
  }
  return `${d} L2880 64 Z`;
})();

export function Footer() {
  return (
    <footer id="contact">
      <div className="tide" aria-hidden="true">
        <svg viewBox="0 0 2880 64" preserveAspectRatio="none">
          <path d={wave} fill="currentColor" />
        </svg>
      </div>

      <div className="deep">
        <div className="wrap">
          <div className="deep-grid">
            <Reveal>
              <span className="eyebrow">Contact</span>
              <h2 className="display h2">
                Put a sensor above the <em>water.</em>
              </h2>
              <div className="deep-actions">
                <a className="btn btn-light" href={DASHBOARD_URL}>
                  Open the dashboard <span className="arrow">→</span>
                </a>
                <a className="btn btn-ghost-light" href={`mailto:${CONTACT_EMAIL}`}>
                  Write to us
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <ul className="contact">
                <li>
                  <span>Email</span>
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </li>
                <li>
                  <span>Phone</span>
                  <a href="tel:+6281212345678">+62 812 1234-5678</a>
                </li>
                <li>
                  <span>Place</span>
                  Jakarta, Indonesia
                </li>
              </ul>
            </Reveal>
          </div>

          <p className="mark" aria-hidden="true">
            FloodPredix
          </p>

          <div className="foot">
            <span>© 2026 FloodPredix</span>
            <nav aria-label="Footer">
              <a href="#how">How it works</a>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#team">Team</a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
