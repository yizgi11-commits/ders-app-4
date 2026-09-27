import { LayoutDashboard, Timer, Map, CalendarDays, Brain, BarChart2 } from 'lucide-react'

// The six real modules — no cards, a 2-column list with row dividers.
const features = [
  { icon: LayoutDashboard, title: 'Command Center', description: 'Her gün tek soruya cevap: şimdi ne yapmalıyım? Görevler, tekrarlar ve sıradaki adım tek ekranda.' },
  { icon: Timer,           title: 'Focus',          description: 'Pomodoro tabanlı odak oturumları. Her oturumun sonunda ne öğrendiğini kısaca yazarsın.' },
  { icon: Map,             title: 'Atlas',          description: 'Derslerini ve konularını bir harita gibi gör; her konunun odak, tekrar ve not ilerlemesi tek bakışta.' },
  { icon: CalendarDays,    title: 'Planner',        description: 'Görevleri güne ve haftaya yay; sınavlarını ve hedeflerini aynı yerde takip et.' },
  { icon: Brain,           title: 'Recall',         description: 'Aralıklı tekrar: kartlar, unutmak üzereyken tekrar karşına çıkar.' },
  { icon: BarChart2,       title: 'Insights',       description: 'Learning Score, verimli saatlerin ve ders dağılımın — sade, ölçülebilir grafikler.' },
]

export default function Features() {
  return (
    <section id="features" className="px-5 py-24 border-t border-dark-border">
      <div className="max-w-5xl mx-auto">
        <p className="text-[13px] font-medium text-accent">Özellikler</p>
        <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-[-0.01em] text-dark-text max-w-xl">
          Öğrenmenin her adımı, tek sistemde.
        </h2>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 md:gap-x-16 border-t border-dark-border">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="py-7 border-b border-dark-border">
              <Icon className="size-4 text-accent" />
              <h3 className="mt-3 text-[16px] font-semibold text-white">{title}</h3>
              <p className="mt-1.5 text-base leading-6 text-dark-text-secondary">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
