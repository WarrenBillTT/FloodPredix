import { motion } from "motion/react";
import { WaterGauge } from "../common/WaterGauge";
import { DASHBOARD_URL } from "../../lib/links";

const ease = [0.2, 0.7, 0.2, 1] as const;

export function HeroSection() {
  return (
    <section className="hero" id="top">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <motion.span
            className="eyebrow live"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            ESP32 sensor · live dashboard · AI scenarios
          </motion.span>

          <motion.h1
            className="display"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
          >
            Know the <em>water level</em> before it reaches your street.
          </motion.h1>

          <motion.p
            className="lede"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease }}
          >
            FloodPredix pairs a low-cost ultrasonic sensor with a live
            dashboard. It measures the gap to the water every second, sounds a
            buzzer on site, and raises alerts and AI-written risk scenarios as
            that gap closes.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease }}
          >
            <a className="btn btn-solid" href={DASHBOARD_URL}>
              Open the dashboard <span className="arrow">→</span>
            </a>
            <a className="btn btn-line" href="#how">
              How it works
            </a>
          </motion.div>

          <motion.div
            className="specs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55 }}
          >
            <div className="spec">
              <b>1 s</b>
              <span>between sensor readings</span>
            </div>
            <div className="spec">
              <b>5 cm</b>
              <span>gap that sounds the buzzer</span>
            </div>
            <div className="spec">
              <b>3</b>
              <span>states: normal, warning, critical</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="hero-gauge"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease }}
        >
          <WaterGauge />
        </motion.div>
      </div>
    </section>
  );
}
