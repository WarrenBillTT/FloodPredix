import { MotionConfig } from 'motion/react';
import { Navbar } from './components/sections/Navbar';
import { HeroSection } from './components/sections/HeroSection';
import { ProcessSection } from './components/sections/ProcessSection';
import { FeaturesSection } from './components/sections/FeaturesSection';
import { PricingSection } from './components/sections/PricingSection';
import { TeamSection } from './components/sections/TeamSection';
import { Footer } from './components/sections/Footer';
import { ScrollRail } from './components/common/ScrollRail';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ScrollRail />
      <Navbar />
      <main>
        <HeroSection />
        <ProcessSection />
        <FeaturesSection />
        <PricingSection />
        <TeamSection />
      </main>
      <Footer />
    </MotionConfig>
  );
}
