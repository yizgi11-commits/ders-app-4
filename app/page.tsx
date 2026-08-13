import type { Metadata } from 'next'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import SocialProof from '@/components/landing/SocialProof'
import Pricing from '@/components/landing/Pricing'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: { absolute: 'Noetic OS — Kişisel Öğrenme İşletim Sistemi' },
  description:
    'Bilimsel öğrenme yöntemleri ve yapay zekâ ile öğrenme sürecini yöneten kişisel öğrenme işletim sistemi.',
}

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
