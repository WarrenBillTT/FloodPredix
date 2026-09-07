import { motion, useInView } from "motion/react";
import { useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Check, Star } from "lucide-react";
import type { PricingPlan } from "../../types";

const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    description: "Perfect for small communities and pilot projects",
    price: "Rp.250.000",
    period: "/month",
    features: [
      "Up to 5 IoT sensors",
      "Basic flood monitoring",
      "Email alerts",
      "Monthly reports",
      "Community dashboard",
      "Email support",
    ],
    buttonText: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    description: "Ideal for municipalities and medium-scale deployments",
    price: "Rp.1.500.000",
    period: "/month",
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
    buttonText: "Get Started",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Comprehensive solution for large-scale operations",
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
    buttonText: "Contact Sales",
    popular: false,
  },
];

export function PricingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="pricing"
      className="py-24 bg-linear-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950"
      ref={ref}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4">Pricing</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent{" "}
            <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the perfect plan for your flood monitoring needs. All plans
            include our core IoT sensors and AI-powered analytics.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white border-blue-600">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <Card
                className={`h-full relative ${
                  plan.popular ? "border-blue-500 shadow-lg scale-105" : ""
                }`}
              >
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-sm mb-4">
                    {plan.description}
                  </CardDescription>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">
                      {plan.period}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                    }`}
                    size="lg"
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-4">
            All plans include 30-day free trial • No setup fees • Cancel anytime
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              <span>99.9% Uptime SLA</span>
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              <span>SOC 2 Compliance</span>
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              <span>Data Encryption</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

