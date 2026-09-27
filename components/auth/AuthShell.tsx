import Link from 'next/link'

// Shared frame for /giris and /kayit: dark page, one centered 400px card.

export const authInputClass =
  'w-full h-11 rounded-md bg-dark-base border border-dark-border px-3.5 text-base text-dark-text ' +
  'placeholder:text-dark-text-muted focus:outline-none focus:border-accent transition-colors duration-[160ms]'

export const authButtonClass =
  'w-full h-11 rounded-md bg-accent hover:bg-accent-dark text-white text-base font-medium ' +
  'inline-flex items-center justify-center gap-2 transition-colors duration-[160ms] disabled:opacity-60 disabled:cursor-not-allowed'

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-page flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] rounded-2xl border border-dark-border bg-dark-secondary p-8 sm:p-10">
        <Link href="/" className="block text-center text-md font-semibold tracking-wide text-dark-text mb-8">
          NOETIC
        </Link>
        {children}
      </div>
    </div>
  )
}
