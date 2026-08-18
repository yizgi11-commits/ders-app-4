'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileText, Brain, Check, AlertCircle, Sparkles, ChevronDown } from 'lucide-react'
import type { FlashcardWithSubject } from '@/lib/flashcards/types'

interface Subject { id: string; name: string; icon: string; color: string }

type Step = 'upload' | 'preview' | 'generating' | 'done'

interface Props {
  onClose:     () => void
  onGenerated: (cards: FlashcardWithSubject[]) => void
}

// ── Backdrop animation ────────────────────────────────────────────
const backdrop = {
  hidden: { opacity: 0 },
  show:   { opacity: 1 },
}
const modal = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  show:   { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 360, damping: 30 } },
  exit:   { opacity: 0, scale: 0.95, y: 12, transition: { duration: 0.18 } },
}

export default function PDFUploadModal({ onClose, onGenerated }: Props) {
  const [step, setStep]             = useState<Step>('upload')
  const [file, setFile]             = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [error, setError]           = useState('')
  const [locked, setLocked]         = useState(false)
  const [extractedText, setExtracted] = useState('')
  const [pdfPath, setPdfPath]       = useState<string | null>(null)
  const [subjects, setSubjects]     = useState<Subject[]>([])
  const [subjectId, setSubjectId]   = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)

  // Load subjects for selector
  useEffect(() => {
    fetch('/api/subjects')
      .then(r => r.json())
      .then(d => setSubjects(d.subjects ?? []))
      .catch(() => {})
  }, [])

  // ── File selection ────────────────────────────────────────────
  const handleFile = useCallback(async (f: File) => {
    if (f.type !== 'application/pdf') {
      setError('Sadece PDF dosyaları desteklenir.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("PDF 10 MB'dan küçük olmalıdır.")
      return
    }
    setError('')
    setFile(f)
    setUploading(true)

    try {
      const form = new FormData()
      form.append('file', f)

      const res = await fetch('/api/pdf/upload', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'PDF yüklenemedi.')
        setLocked(!!data.locked)
        setUploading(false)
        return
      }

      setExtracted(data.text ?? '')
      setPdfPath(data.path ?? null)
      setStep('preview')
    } catch {
      setError('Bağlantı hatası. Tekrar deneyin.')
    } finally {
      setUploading(false)
    }
  }, [])

  // ── Drag & drop ───────────────────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  // ── Generate flashcards ───────────────────────────────────────
  async function handleGenerate() {
    if (!extractedText) return
    setGenerating(true)
    setStep('generating')

    try {
      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text:           extractedText,
          subject_id:     subjectId || undefined,
          source_pdf:     pdfPath,
          source_pdf_name: file?.name,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Kartlar oluşturulamadı.')
        setLocked(!!data.locked)
        setStep('preview')
        setGenerating(false)
        return
      }

      setGeneratedCount(data.count ?? 0)
      setStep('done')
      // Bubble up to parent after short delay
      setTimeout(() => {
        onGenerated(data.flashcards ?? [])
      }, 1800)
    } catch {
      setError('Bağlantı hatası.')
      setStep('preview')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <motion.div
      variants={backdrop}
      initial="hidden"
      animate="show"
      exit="hidden"
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        variants={modal}
        initial="hidden"
        animate="show"
        exit="exit"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">PDF&apos;den Kart Oluştur</h2>
              <p className="text-[11px] text-muted-foreground">AI ile otomatik flash kart üretimi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Upload ─────────────────────────── */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
                    ${isDragging
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }
                    ${uploading ? 'pointer-events-none opacity-60' : ''}
                  `}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                  />

                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full"
                      />
                      <p className="text-sm font-medium text-gray-600">Metin çıkarılıyor…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <Upload className="w-6 h-6 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">PDF sürükle & bırak</p>
                        <p className="text-xs text-muted-foreground mt-1">veya tıklayarak seç · Maks. 10 MB</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 bg-gray-100 px-2.5 py-1 rounded-full">
                        Sadece metin içerikli PDF&apos;ler desteklenir
                      </span>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{error}</span>
                    {locked && (
                      <Link href="/dashboard/upgrade" className="shrink-0 font-bold underline">Upgrade</Link>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Step 2: Preview ────────────────────────── */}
            {step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                {/* File info */}
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{file?.name}</p>
                    <p className="text-xs text-emerald-700">
                      <Check className="inline w-3 h-3 mr-0.5" />
                      {extractedText.length.toLocaleString()} karakter çıkarıldı
                    </p>
                  </div>
                </div>

                {/* Extracted text preview */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Metin Önizleme</p>
                  <div className="bg-gray-50 rounded-xl border border-border/60 p-3 max-h-40 overflow-y-auto">
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-mono">
                      {extractedText.slice(0, 600)}{extractedText.length > 600 ? '…' : ''}
                    </p>
                  </div>
                </div>

                {/* Subject selector */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">
                    Ders (isteğe bağlı)
                  </label>
                  <div className="relative">
                    <select
                      value={subjectId}
                      onChange={e => setSubjectId(e.target.value)}
                      className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 pr-8"
                    >
                      <option value="">— Ders seç (isteğe bağlı)</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{error}</span>
                    {locked && (
                      <Link href="/dashboard/upgrade" className="shrink-0 font-bold underline">Upgrade</Link>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setStep('upload'); setFile(null); setExtracted(''); setError('') }}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Geri
                  </button>
                  <motion.button
                    onClick={handleGenerate}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={generating}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-200/50 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI ile Kart Oluştur
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Generating ─────────────────────── */}
            {step === 'generating' && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 gap-5 text-center"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 border-3 border-indigo-200 border-t-indigo-600 rounded-full"
                    style={{ borderWidth: 3 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="w-7 h-7 text-indigo-600" />
                  </div>
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">Kartlar oluşturuluyor…</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI metni analiz ediyor, bu birkaç saniye sürebilir
                  </p>
                </div>
                {[
                  'Anahtar kavramlar tespit ediliyor…',
                  'Sorular hazırlanıyor…',
                  'Cevaplar yazılıyor…',
                ].map((msg, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.8 + 0.4 }}
                    className="text-xs text-indigo-600/70 bg-indigo-50 px-3 py-1 rounded-full"
                  >
                    {msg}
                  </motion.p>
                ))}
              </motion.div>
            )}

            {/* ── Step 4: Done ───────────────────────────── */}
            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 gap-4 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
                  className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center"
                >
                  <Check className="w-8 h-8 text-emerald-600" />
                </motion.div>
                <div>
                  <p className="text-xl font-black text-gray-900">{generatedCount} kart oluşturuldu!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {file?.name} dosyasından kartlar hazır
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
