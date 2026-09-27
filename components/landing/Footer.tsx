import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="px-5 py-10 border-t border-dark-border">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-dark-text-secondary">
        <p>
          <span className="font-semibold tracking-wide text-dark-text">NOETIC</span> · <span className="tabular">2025</span>
        </p>
        <nav className="flex items-center gap-2">
          <Link href="#" className="hover:text-dark-text transition-colors duration-[160ms]">Gizlilik</Link>
          <span aria-hidden>·</span>
          <Link href="#" className="hover:text-dark-text transition-colors duration-[160ms]">Koşullar</Link>
        </nav>
      </div>
    </footer>
  )
}
