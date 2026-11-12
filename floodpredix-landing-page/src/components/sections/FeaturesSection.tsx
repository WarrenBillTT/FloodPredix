import { Reveal } from "../common/Reveal";
import type { DashboardPage } from "../../types";

const pages: DashboardPage[] = [
  {
    name: "Dashboard",
    description:
      "The current reading and the status of each station, straight from the sensor.",
    tag: "Live",
  },
  {
    name: "Live Flood Map",
    description: "Stations plotted on a map with their current status.",
    tag: "Map",
  },
  {
    name: "Active Alerts",
    description:
      "Warning and critical events raised by the sensor, counted by severity.",
    tag: "Alerts",
  },
  {
    name: "History Log",
    description:
      "Past readings kept per station, so you can look back at how a rise unfolded.",
    tag: "Data",
  },
  {
    name: "Predictions",
    description:
      "Flood scenarios from water level, rainfall and humidity, each with a probability and a severity. A rule-based estimate steps in if the AI model is unreachable.",
    tag: "AI",
  },
  {
    name: "AI Assistant",
    description:
      "Ask about the readings in plain language from a chat panel inside the dashboard.",
    tag: "AI",
  },
  {
    name: "Settings",
    description: "Profile details and alert notification preferences.",
    tag: "Account",
  },
];

export function FeaturesSection() {
  return (
    <section className="section band" id="features">
      <div className="wrap">
        <div className="feat-head">
          <Reveal>
            <span className="eyebrow">Inside the dashboard</span>
            <h2 className="display h2">
              Everything the sensor sees, in <em>seven</em> places.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lede">
              The sensor is the source of truth. The dashboard turns its
              readings into something a person can act on.
            </p>
          </Reveal>
        </div>

        <div className="rows">
          {pages.map((p, i) => (
            <Reveal key={p.name}>
              <div className="row">
                <span className="row-n">{String(i + 1).padStart(2, "0")}</span>
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <span className="row-tag">{p.tag}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
