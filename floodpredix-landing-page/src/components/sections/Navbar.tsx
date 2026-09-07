import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { Menu, X } from "lucide-react";
import type { NavItem } from "../../types";
import { ImageWithFallback } from "../common/ImageWithFallback";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // Add your logo image URL here
  const logoUrl = "https://floodpredix.s3.shinvinc.tech/FloodPredix.png"; // Replace with your actual logo URL

  const navItems: NavItem[] = [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
              <ImageWithFallback
                src={logoUrl}
                alt="FloodPredix Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-semibold">FloodPredix</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                whileHover={{ y: -2 }}
                className="text-foreground hover:text-blue-600 transition-colors"
              >
                {item.name}
              </motion.a>
            ))}
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="http://localhost:5173">Get Started</a>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground hover:text-blue-600"
              aria-label="Toggle menu"
              type="button"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden py-4 border-t border-border"
          >
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-foreground hover:text-blue-600 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <Button asChild className="bg-blue-600 hover:bg-blue-700 w-fit">
                <a href="http://localhost:5173">Get Started</a>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
