import Link from 'next/link'
import { Check } from 'lucide-react'

// Mirrors the real Free / Pro limits (see /dashboard/upgrade).
const plans = [
  {
    name: 'Ücretsiz',
    price: '₺0',
    period: '',
    description: 'Öğrenme döngüsünün tamamı, günlük limitlerle.',
    features: [
      'Command Center, Atlas, Planner, Focus, Journey',
      'Recall — günde 20 kart',
      'Vault — 10 not, 20 kart, 1 PDF',
      'Noetic Assist — günde 5 istek',
      'Öğrenme Puanı ve temel Insights',
    ],
    cta: 'Ücretsiz Başla',
    pro: false,
  },
  {
    name: 'Pro',
    price: '₺149',
    period: '/ay',
    description: 'Sınırsız tekrar, tam analiz ve AI desteği.',
    features: [
      'Ücretsiz plandaki her şey',
      'Sınırsız Recall ve Vault',
      'Noetic Assist — günde 30 istek, serbest soru',
      'PDF’ten kart, test ve özet',
      'Tam analiz ve haftalık AI yorumu',
    ],
    cta: 'Pro ile Başla',
    pro: true,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="px-5 py-24 border-t border-dark-border">
      <div className="max-w-5xl mx-auto">
        <p className="text-[13px] font-medium text-accent">Fiyatlar</p>
        <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-[-0.01em] text-dark-text">
          Ücretsiz başla, ihtiyacın olduğunda yükselt.
        </h2>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-lg border p-7 ${plan.pro ? 'border-accent/60' : 'border-dark-border'}`}
            >
              <p className="text-sm font-medium text-dark-text-secondary">{plan.name}</p>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="tabular text-3xl text-dark-text">{plan.price}</span>
                {plan.period && <span className="text-sm text-dark-text-secondary">{plan.period}</span>}
              </p>
              <p className="mt-2 text-base text-dark-text-secondary">{plan.description}</p>

              <ul className="mt-6 pt-6 border-t border-dark-border space-y-3 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-base text-dark-text">
                    <Check className={`size-4 mt-0.5 shrink-0 ${plan.pro ? 'text-dark-accent' : 'text-dark-text-secondary'}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/kayit"
                className={`mt-8 inline-flex items-center justify-center h-10 rounded-md text-base font-medium transition-colors duration-[160ms] ${
                  plan.pro
                    ? 'border border-dark-border text-dark-text hover:border-dark-text-secondary'
                    : 'bg-accent hover:bg-accent-dark text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-dark-text-secondary">İstediğin zaman iptal edebilirsin.</p>
      </div>
    </section>
  )
}
