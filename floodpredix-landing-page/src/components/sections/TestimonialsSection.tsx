import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import CountUp from "../common/CountUp";

import { Star, Quote } from "lucide-react";
import type { Testimonial } from "../../types";

const testimonials: Testimonial[] = [
  {
    name: "Dr. Sarah Mitchell",
    role: "Emergency Management Director",
    organization: "City of Riverside",
    avatar: "SM",
    content:
      "FloodPredix has revolutionized our flood preparedness. The AI predictions gave us 6 hours advance notice during the last storm, allowing us to evacuate residents safely. The accuracy is remarkable.",
    rating: 5,
    location: "California, USA",
  },
  {
    name: "Carlos Rodriguez",
    role: "Infrastructure Manager",
    organization: "Metro Water Authority",
    avatar: "CR",
    content:
      "The IoT sensors are incredibly reliable, even in harsh weather conditions. The real-time data helps us make critical decisions that protect thousands of residents downstream.",
    rating: 5,
    location: "Texas, USA",
  },
  {
    name: "Prof. Elena Nakamura",
    role: "Climate Research Lead",
    organization: "Pacific Institute",
    avatar: "EN",
    content:
      "As a researcher, I appreciate the detailed analytics and historical data FloodPredix provides. It has become an essential tool for our climate impact studies.",
    rating: 5,
    location: "Oregon, USA",
  },
  {
    name: "Michael Thompson",
    role: "Mayor",
    organization: "Greenfield Township",
    avatar: "MT",
    content:
      "Since implementing FloodPredix, we have prevented three potential flood disasters. The cost savings in emergency response and property damage far exceed our investment.",
    rating: 5,
    location: "Pennsylvania, USA",
  },
  {
    name: "Dr. Aisha Patel",
    role: "Hydrologist",
    organization: "River Basin Commission",
    avatar: "AP",
    content:
      "The integration with satellite data and ground sensors provides unprecedented accuracy. FloodPredix has set a new standard for flood monitoring technology.",
    rating: 5,
    location: "Colorado, USA",
  },
  {
    name: "James Chen",
    role: "IT Director",
    organization: "Coastal County",
    avatar: "JC",
    content:
      "The platform is intuitive and the support team is exceptional. We had our entire sensor network deployed and operational within just two weeks.",
    rating: 5,
    location: "Florida, USA",
  },
];

export function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="testimonials" className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4">Testimonials</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by{" "}
            <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Communities Worldwide
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join hundreds of municipalities, researchers, and emergency
            management professionals who rely on FloodPredix to protect their
            communities.
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              <CountUp
                from={0}
                to={500}
                separator=","
                direction="up"
                duration={1}
                className="count-up-text"
              />
              +
            </div>
            <div className="text-sm text-muted-foreground">
              Cities Protected
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {" "}
              <CountUp
                from={0}
                to={1000}
                separator=","
                direction="up"
                duration={1}
                className="count-up-text"
              />
              +
            </div>
            <div className="text-sm text-muted-foreground">
              Sensors Deployed
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {" "}
              <CountUp
                from={0}
                to={99.8}
                separator=","
                direction="up"
                duration={1}
                className="count-up-text"
              />
              %
            </div>
            <div className="text-sm text-muted-foreground">
              Prediction Accuracy
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              ${" "}
              <CountUp
                from={0}
                to={50}
                separator=","
                direction="up"
                duration={1}
                className="count-up-text"
              />
              M+
            </div>
            <div className="text-sm text-muted-foreground">
              Damage Prevented
            </div>
          </div>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>

                  <div className="relative">
                    <Quote className="h-8 w-8 text-blue-200 absolute -top-2 -left-2" />
                    <p className="text-sm leading-relaxed relative z-10 pl-6">
                      {testimonial.content}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 pt-4 border-t border-border">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {testimonial.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </p>
                      <p className="text-xs text-blue-600">
                        {testimonial.organization}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.location}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16 p-8 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-2xl"
        >
          <h3 className="text-2xl font-bold mb-4">
            Ready to Protect Your Community?
          </h3>
          <p className="text-muted-foreground mb-6">
            Join the growing network of communities using FloodPredix for flood
            prevention and safety.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              type="button"
            >
              Start Free Trial
            </button>
            <button
              className="border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 px-6 py-3 rounded-lg font-medium transition-colors"
              type="button"
            >
              Schedule Demo
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

