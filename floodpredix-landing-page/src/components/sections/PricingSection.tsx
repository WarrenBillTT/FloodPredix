import { Reveal } from "../common/Reveal";
import { CONTACT_EMAIL, DASHBOARD_URL } from "../../lib/links";
import type { PricingPlan } from "../../types";

const plans: PricingPlan[] = [
  {
    name: "Starter",
    description: "For small communities and pilot projects.",
    price: "Rp.250.000",
    period: "/ month",
    features: [
      "Up to 5 IoT sensors",
      "Basic flood monitoring",
      "Email alerts",
      "Monthly reports",
      "Community dashboard",
      "Email support",
    ],
    buttonText: "Start free trial",
    href: DASHBOARD_URL,
    featured: false,
  },
  {
    name: "Professional",
    description: "For municipalities and medium-scale deployments.",
    price: "Rp.1.500.000",
    period: "/ month",
    features: [
      "Up to 25 IoT sensors",
      "Advanced AI predictions",
      "SMS & email alerts",
      "Real-time analytics",
      "Custom dashboards",
      "API access",
      "Priority support",
      "Weekly reports",
    ],
    buttonText: "Get started",
    href: DASHBOARD_URL,
    featured: true,
  },
  {
    name: "Enterprise",
    description: "For large-scale operations with custom needs.",
    price: "Custom",
    period: "",
    features: [
      "Unlimited sensors",
      "Full AI suite",
      "Multi-channel alerts",
      "Advanced analytics",
      "White-label solution",
      "Custom integrations",
      "24/7 dedicated support",
      "On-site training",
      "SLA guarantee",
    ],
    buttonText: "Contact sales",
    href: `mailto:${CONTACT_EMAIL}`,
    featured: false,
  },
];

export function PricingSection() {
  return (
    <section className="section" id="pricing">
      <div className="wrap">
        <div className="plans-head">
          <Reveal>
            <span className="eyebrow">Pricing</span>
            <h2 className="display h2">
              Pay for the sensors you <em>deploy.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lede">
              Every plan includes the dashboard and AI-assisted predictions.
              Choose by how many stations you need to watch.
            </p>
          </Reveal>
        </div>

        <Reveal>
          <div className="plans">
            {plans.map((plan) => (
              <div key={plan.name} className={`plan${plan.featured ? " featured" : ""}`}>
                <span className="plan-name">{plan.name}</span>
                <p className="plan-desc">{plan.description}</p>
                <div className="plan-price">
                  {plan.price}
                  {plan.period && <small>{plan.period}</small>}
                </div>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <a className="btn btn-line" href={plan.href}>
                  {plan.buttonText} <span className="arrow">→</span>
                </a>
              </div>
            ))}
          </div>
        </Reveal>

        <p className="fineprint">30-day free trial · No setup fees · Cancel anytime</p>
      </div>
    </section>
  );
}
