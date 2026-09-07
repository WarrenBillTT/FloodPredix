export interface NavItem {
  name: string;
  href: string;
}

export interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge: string;
}

export interface PricingPlan {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  buttonText: string;
  popular: boolean;
}

export interface Testimonial {
  name: string;
  role: string;
  organization: string;
  avatar: string;
  content: string;
  rating: number;
  location: string;
}

export interface FooterSection {
  title: string;
  links: Array<{
    name: string;
    href: string;
  }>;
}


