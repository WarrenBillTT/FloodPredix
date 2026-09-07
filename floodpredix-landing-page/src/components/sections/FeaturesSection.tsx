import { motion, useInView } from "motion/react";
import { useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Waves,
  Brain,
  Smartphone,
  Shield,
  BarChart3,
  Zap,
  Satellite,
  AlertTriangle,
  Cloud,
} from "lucide-react";
import { ImageWithFallback } from "../common/ImageWithFallback";
import type { Feature } from "../../types";

const features: Feature[] = [
  {
    icon: Waves,
    title: "Real-time Water Level Monitoring",
    description:
      "Advanced IoT sensors provide continuous water level measurements with millimeter precision.",
    badge: "IoT Sensors",
  },
  {
    icon: Brain,
    title: "AI-Powered Predictions",
    description:
      "Machine learning algorithms analyze patterns to predict flood risks hours in advance.",
    badge: "AI/ML",
  },
  {
    icon: AlertTriangle,
    title: "Instant Alert System",
    description:
      "Receive immediate notifications via SMS, email, and mobile app when flood risks are detected.",
    badge: "Alerts",
  },
  {
    icon: Satellite,
    title: "Satellite Integration",
    description:
      "Combine ground sensors with satellite data for comprehensive weather monitoring.",
    badge: "Satellite",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Detailed reports and visualizations help authorities make informed decisions.",
    badge: "Analytics",
  },
  {
    icon: Cloud,
    title: "Cloud Infrastructure",
    description:
      "Secure, scalable cloud platform ensures data reliability and accessibility.",
    badge: "Cloud",
  },
];

export function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4">Features</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Cutting-Edge Technology for{" "}
            <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Flood Prevention
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our comprehensive suite of IoT sensors, AI algorithms, and real-time
            monitoring provides unparalleled flood detection and prevention
            capabilities.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow group">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                        <IconComponent className="h-6 w-6 text-blue-600" />
                      </div>
                      <Badge variant="secondary">{feature.badge}</Badge>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <div className="space-y-6">
            <Badge className="bg-green-100 text-green-700 border-green-200">
              🎯 Advanced Monitoring
            </Badge>
            <h3 className="text-2xl md:text-3xl font-bold">
              Monitor Multiple Locations Simultaneously
            </h3>
            <p className="text-lg text-muted-foreground">
              Deploy sensors across rivers, drainage systems, and flood-prone
              areas. Our centralized dashboard provides a comprehensive view of
              all monitoring points.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span>Real-time Processing</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-green-500" />
                <span>99.9% Uptime</span>
              </div>
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-blue-500" />
                <span>Mobile Access</span>
              </div>
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <span>Historical Data</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1639060015191-9d83063eab2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMGNpdHklMjB0ZWNobm9sb2d5JTIwZGFzaGJvYXJkfGVufDF8fHx8MTc1OTcyODA4OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Smart city technology dashboard"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

