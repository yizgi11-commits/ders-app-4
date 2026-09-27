const steps = [
  { number: '01', title: 'Hesabını Oluştur', description: '2 dakikada kaydol, hedeflerini ve derslerini gir.' },
  { number: '02', title: 'Planını Al',        description: 'Sistem, hedeflerine göre sana özel haftalık bir program oluşturur.' },
  { number: '03', title: 'Çalış & Geliş',     description: 'Odak oturumlarıyla çalış, tekrarlarını yap, gelişimini izle.' },
]

export default function HowItWorks() {
  return (
    <section id="how" className="px-5 py-24 border-t border-dark-border">
      <div className="max-w-5xl mx-auto">
        <p className="text-[13px] font-medium text-accent">Nasıl Çalışır</p>
        <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-[-0.01em] text-dark-text">
          Üç adımda başla.
        </h2>

        <ol className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {steps.map(step => (
            <li key={step.number}>
              <span className="tabular text-[48px] leading-none text-dark-border">{step.number}</span>
              <h3 className="mt-5 text-lg font-semibold text-dark-text">{step.title}</h3>
              <p className="mt-2 text-base leading-6 text-dark-text-secondary">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
