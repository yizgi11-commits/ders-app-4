import type { Metadata } from 'next'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import Pricing from '@/components/landing/Pricing'
import Footer from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: { absolute: 'Noetic OS — Kişisel Öğrenme İşletim Sistemi' },
  description:
    'Bilimsel öğrenme yöntemleri ve yapay zekâ ile öğrenme sürecini yöneten kişisel öğrenme işletim sistemi.',
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-dark-page text-dark-text">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </main>
  )
}
