export interface NavItem {
  name: string;
  href: string;
}

export interface ProcessStep {
  title: string;
  body: string;
  code?: string;
}

export interface DashboardPage {
  name: string;
  description: string;
  tag: string;
}

export interface PricingPlan {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  buttonText: string;
  href: string;
  featured: boolean;
}

export type WaterLevel = "normal" | "warning" | "critical";
