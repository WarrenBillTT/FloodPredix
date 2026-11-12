import { Reveal } from "../common/Reveal";
import type { ProcessStep } from "../../types";

const steps: ProcessStep[] = [
  {
    title: "Measure the gap",
    body: "An ultrasonic sensor on an ESP32 sends a pulse at the water surface and times the echo. The result is a distance in centimetres, once a second.",
  },
  {
    title: "Act on site, without a network",
    body: "If the gap drops to 5 cm or less, the buzzer sounds immediately. The decision is made in the firmware, so the alarm works even when Wi-Fi does not.",
    code: `<span class="c-k">if</span> (distanceToWater > 0 && distanceToWater <= 5.0) {\n  <span class="c-d">buzz</span>();\n}`,
  },
  {
    title: "Send and classify",
    body: "Each reading is posted as JSON to the API. The server converts it to metres, classifies it as normal, warning or critical, and stores it against the station.",
    code: `<span class="c-m">POST</span> /api/iot/water-level\n{ <span class="c-k">"waterLevel"</span>: 7.4 }\n\n<span class="c-m">→</span> 0.074 m   <span class="c-w">warning</span>`,
  },
  {
    title: "Alert and forecast",
    body: "Warning and critical readings create alerts. The dashboard also asks an AI model for flood scenarios from water level, rainfall and humidity, and falls back to a rule-based estimate if the model cannot be reached.",
  },
];

export function ProcessSection() {
  return (
    <section className="section" id="how">
      <div className="wrap split">
        <div className="sticky">
          <Reveal>
            <span className="eyebrow">How it works</span>
            <h2 className="display h2">
              From a sensor above the water to an <em>alert</em> on screen.
            </h2>
            <p className="lede">
              Four steps, one second apart from reading to decision. Nothing
              here needs a specialist to install.
            </p>
          </Reveal>
        </div>

        <div className="steps">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={0.05}>
              <div className="step">
                <div className="step-n">{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                  {s.code && (
                    <pre className="code" dangerouslySetInnerHTML={{ __html: s.code }} />
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
