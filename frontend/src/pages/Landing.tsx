import LandingNavbar from "@/components/landing/LandingNavbar";
import Hero from "@/components/landing/Hero";
import Results from "@/components/landing/Results";
import Features from "@/components/landing/Features";
import Pricing from "@/components/landing/Pricing";
import FaqFooter from "@/components/landing/FaqFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar />
      <main>
        <Hero />
        <Results />
        <Features />
        <Pricing />
        <FaqFooter />
      </main>
    </div>
  );
}
