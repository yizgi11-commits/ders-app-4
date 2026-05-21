import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import SocialProof from '@/components/landing/SocialProof'
import Pricing from '@/components/landing/Pricing'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <main className="bg-[#080810] text-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <SocialProof />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  )
}
