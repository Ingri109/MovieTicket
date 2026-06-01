import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { UpcomingSessions } from "@/components/upcoming-sessions";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <Navbar />
      <HeroSection />
      <UpcomingSessions />
      <Footer />
    </main>
  );
}
