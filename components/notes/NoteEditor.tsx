'use client'

import {
  useState, useEffect, useRef, useCallback, KeyboardEvent,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bold, Italic, Code, Quote, Heading, List, CheckSquare,
  Eye, Edit3, Pin, Heart, Archive, Trash2, ChevronLeft,
  Sparkles, X, BookOpen, FolderOpen, Tag, Type,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note } from '@/lib/notes/types'
import AIPanel from './AIPanel'

interface Props {
  note: Note
  onUpdate: (id: string, updates: Partial<Note>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onBack: () => void
}

// ── Minimal markdown → HTML renderer ─────────────────────────
function parseMarkdown(text: string): string {
  const lines = text.split('\n')
  const html: string[] = []
  let inList = false
  let inBlockquote = false

  function closeList() {
    if (inList) { html.push('</ul>'); inList = false }
  }
  function closeBlockquote() {
    if (inBlockquote) { html.push('</blockquote>'); inBlockquote = false }
  }

  function inlineFormat(line: string): string {
    return line
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-indigo-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
      .replace(/_([^_]+)_/g, '<em class="italic">$1</em>')
  }

  for (const rawLine of lines) {
    const line = rawLine

    // Heading h1
    if (/^# /.test(line)) {
      closeList(); closeBlockquote()
      html.push(`<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-3">${inlineFormat(line.slice(2))}</h1>`)
      continue
    }
    // Heading h2
    if (/^## /.test(line)) {
      closeList(); closeBlockquote()
      html.push(`<h2 class="text-xl font-bold text-gray-900 mt-5 mb-2">${inlineFormat(line.slice(3))}</h2>`)
      continue
    }
    // Heading h3
    if (/^### /.test(line)) {
      closeList(); closeBlockquote()
      html.push(`<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">${inlineFormat(line.slice(4))}</h3>`)
      continue
    }
    // Blockquote
    if (/^> /.test(line)) {
      closeList()
      if (!inBlockquote) { html.push('<blockquote class="border-l-4 border-indigo-300 pl-4 text-gray-600 my-3 italic">'); inBlockquote = true }
      html.push(`<p>${inlineFormat(line.slice(2))}</p>`)
      continue
    } else {
      closeBlockquote()
    }
    // Checkbox
    if (/^- \[x\] /i.test(line)) {
      if (!inList) { html.push('<ul class="my-2 space-y-1">'); inList = true }
      html.push(`<li class="flex items-start gap-2"><span class="mt-1 w-4 h-4 rounded bg-indigo-500 flex items-center justify-center shrink-0"><svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></span><span class="line-through text-gray-400">${inlineFormat(line.slice(6))}</span></li>`)
      continue
    }
    if (/^- \[ \] /.test(line)) {
      if (!inList) { html.push('<ul class="my-2 space-y-1">'); inList = true }
      html.push(`<li class="flex items-start gap-2"><span class="mt-1 w-4 h-4 rounded border-2 border-gray-300 shrink-0"></span><span>${inlineFormat(line.slice(6))}</span></li>`)
      continue
    }
    // Bullet list
    if (/^[-*] /.test(line)) {
      if (!inList) { html.push('<ul class="list-disc list-inside my-2 space-y-1 text-gray-700">'); inList = true }
      html.push(`<li class="pl-1">${inlineFormat(line.slice(2))}</li>`)
      continue
    } else {
      closeList()
    }
    // Blank line
    if (line.trim() === '') {
      html.push('<div class="h-3"></div>')
      continue
    }
    // Normal paragraph
    html.push(`<p class="text-gray-700 leading-relaxed">${inlineFormat(line)}</p>`)
  }

  closeList()
  closeBlockquote()
  return html.join('\n')
}

// ── Toolbar button ─────────────────────────────────────────────
function ToolbarBtn({
  icon: Icon, label, onClick, active,
}: { icon: React.FC<{ className?: string }>; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-lg text-sm transition-colors',
        active
          ? 'bg-indigo-100 text-indigo-700'
          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  )
}

// ── Saved indicator ─────────────────────────────────────────────
type SaveState = 'saved' | 'saving' | 'unsaved'

export default function NoteEditor({ note, onUpdate, onDelete, onBack }: Props) {
  const [title, setTitle]       = useState(note.title)
  const [content, setContent]   = useState(note.content)
  const [preview, setPreview]   = useState(false)
  const [monoFont, setMonoFont] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [showAI, setShowAI]     = useState(false)
  const [showMeta, setShowMeta] = useState(false)
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([])
  const [folders, setFolders]   = useState<Array<{ id: string; name: string; icon: string }>>([])
  const [localSubjectId, setLocalSubjectId] = useState(note.subject_id)
  const [localFolderId, setLocalFolderId]   = useState(note.folder_id)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags]         = useState<string[]>(note.tags)
  const [isPinned, setIsPinned]   = useState(note.is_pinned)
  const [isFavorite, setIsFavorite] = useState(note.is_favorite)
  const [isArchived, setIsArchived] = useState(note.is_archived)
  const [lastSaved, setLastSaved] = useState<Date>(new Date(note.updated_at))

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleRef    = useRef<HTMLInputElement>(null)

  // Fetch meta lists
  useEffect(() => {
    fetch('/api/subjects').then(r => r.json()).then(d => setSubjects(d.subjects ?? []))
    fetch('/api/notes/folders').then(r => r.json()).then(d => setFolders(d.folders ?? []))
  }, [])

  // Reset local state when note changes
  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
    setTags(note.tags)
    setIsPinned(note.is_pinned)
    setIsFavorite(note.is_favorite)
    setIsArchived(note.is_archived)
    setLocalSubjectId(note.subject_id)
    setLocalFolderId(note.folder_id)
    setLastSaved(new Date(note.updated_at))
    setSaveState('saved')
  }, [note.id]) // eslint-disable-line

  // Auto save on content/title change
  const triggerAutoSave = useCallback((newTitle: string, newContent: string) => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    setSaveState('unsaved')
    autoSaveRef.current = setTimeout(async () => {
      setSaveState('saving')
      await onUpdate(note.id, { title: newTitle, content: newContent })
      setSaveState('saved')
      setLastSaved(new Date())
    }, 1500)
  }, [note.id, onUpdate])

  function handleTitleChange(v: string) {
    setTitle(v)
    triggerAutoSave(v, content)
  }

  function handleContentChange(v: string) {
    setContent(v)
    triggerAutoSave(title, v)
  }

  // Keyboard shortcuts in textarea
  function handleTextareaKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Tab = 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      insertText('  ')
      return
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); wrapSelection('**', '**'); return }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); wrapSelection('*', '*'); return }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); flushSave(); return }
  }

  function insertText(text: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end   = el.selectionEnd
    const newContent = content.substring(0, start) + text + content.substring(end)
    setContent(newContent)
    triggerAutoSave(title, newContent)
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + text.length
    })
  }

  function wrapSelection(before: string, after: string) {
    const el = textareaRef.current
    if (!el) return
    const start   = el.selectionStart
    const end     = el.selectionEnd
    const selected = content.substring(start, end)
    const wrapped  = before + (selected || 'metin') + after
    const newContent = content.substring(0, start) + wrapped + content.substring(end)
    setContent(newContent)
    triggerAutoSave(title, newContent)
    requestAnimationFrame(() => {
      el.selectionStart = start + before.length
      el.selectionEnd   = start + before.length + (selected || 'metin').length
    })
  }

  function insertLinePrefix(prefix: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    // Find start of current line
    const before = content.substring(0, start)
    const lineStart = before.lastIndexOf('\n') + 1
    const newContent = content.substring(0, lineStart) + prefix + content.substring(lineStart)
    setContent(newContent)
    triggerAutoSave(title, newContent)
  }

  async function flushSave() {
    if (autoSaveRef.current) { clearTimeout(autoSaveRef.current); autoSaveRef.current = null }
    setSaveState('saving')
    await onUpdate(note.id, { title, content })
    setSaveState('saved')
    setLastSaved(new Date())
  }

  async function toggleMeta(field: 'is_pinned' | 'is_favorite' | 'is_archived', value: boolean) {
    if (field === 'is_pinned')   setIsPinned(value)
    if (field === 'is_favorite') setIsFavorite(value)
    if (field === 'is_archived') setIsArchived(value)
    await onUpdate(note.id, { [field]: value })
  }

  async function updateSubject(id: string | null) {
    setLocalSubjectId(id)
    await onUpdate(note.id, { subject_id: id })
  }

  async function updateFolder(id: string | null) {
    setLocalFolderId(id)
    await onUpdate(note.id, { folder_id: id })
  }

  async function addTag() {
    const tag = tagInput.trim().toLowerCase()
    if (!tag || tags.includes(tag)) { setTagInput(''); return }
    const next = [...tags, tag]
    setTags(next)
    setTagInput('')
    await onUpdate(note.id, { tags: next })
  }

  async function removeTag(tag: string) {
    const next = tags.filter(t => t !== tag)
    setTags(next)
    await onUpdate(note.id, { tags: next })
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0
  const readTime  = Math.max(1, Math.round(wordCount / 200))

  function formatSavedTime(d: Date): string {
    const diff = Date.now() - d.getTime()
    if (diff < 5000) return 'Az önce kaydedildi'
    if (diff < 60000) return `${Math.floor(diff / 1000)} sn önce kaydedildi`
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + ' kaydedildi'
  }

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Top toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-white/80 backdrop-blur shrink-0 flex-wrap">
        {/* Back (mobile) */}
        <button
          onClick={onBack}
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 mr-1"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Formatting buttons */}
        <div className="flex items-center gap-0.5">
          <ToolbarBtn icon={Bold}        label="Kalın (Ctrl+B)"    onClick={() => wrapSelection('**', '**')} />
          <ToolbarBtn icon={Italic}      label="Italik (Ctrl+I)"   onClick={() => wrapSelection('*', '*')} />
          <ToolbarBtn icon={Code}        label="Kod"               onClick={() => wrapSelection('`', '`')} />
          <ToolbarBtn icon={Quote}       label="Alıntı"            onClick={() => insertLinePrefix('> ')} />
          <ToolbarBtn icon={Heading}     label="Başlık"            onClick={() => insertLinePrefix('# ')} />
          <ToolbarBtn icon={List}        label="Liste"             onClick={() => insertLinePrefix('- ')} />
          <ToolbarBtn icon={CheckSquare} label="Onay kutusu"       onClick={() => insertLinePrefix('- [ ] ')} />
        </div>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Preview toggle */}
        <ToolbarBtn
          icon={preview ? Edit3 : Eye}
          label={preview ? 'Düzenle' : 'Önizleme'}
          onClick={() => setPreview(!preview)}
          active={preview}
        />

        {/* Mono font */}
        <ToolbarBtn
          icon={Type}
          label="Monospace yazı tipi"
          onClick={() => setMonoFont(!monoFont)}
          active={monoFont}
        />

        <div className="flex-1" />

        {/* Meta panel */}
        <button
          onClick={() => setShowMeta(!showMeta)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
            showMeta ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          )}
        >
          <Tag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Meta</span>
        </button>

        {/* AI panel */}
        <button
          onClick={() => setShowAI(!showAI)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
            showAI
              ? 'bg-violet-50 text-violet-700'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Araçları</span>
        </button>

        {/* Delete */}
        <button
          onClick={() => {
            if (confirm('Bu notu silmek istediğinize emin misiniz?')) onDelete(note.id)
          }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor / Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Title */}
          <div className="px-6 pt-5 pb-2 shrink-0">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Not başlığı..."
              className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder:text-gray-300"
            />
          </div>

          {/* Tags row */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap px-6 pb-2">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5 text-xs">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-indigo-900">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="mx-6 border-b border-gray-100 mb-1" />

          {/* Editor or Preview */}
          <div className="flex-1 overflow-y-auto">
            {preview ? (
              <div
                className="px-6 py-4 prose-sm max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
              />
            ) : (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => handleContentChange(e.target.value)}
                onKeyDown={handleTextareaKey}
                placeholder="Notunuzu buraya yazın... Markdown desteklenir."
                className={cn(
                  'w-full h-full px-6 py-4 bg-transparent border-none outline-none resize-none text-sm text-gray-800 leading-relaxed placeholder:text-gray-300',
                  monoFont ? 'font-mono' : 'font-sans'
                )}
              />
            )}
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-6 py-2 border-t border-gray-100 bg-gray-50/50 shrink-0">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{wordCount} kelime</span>
              <span>·</span>
              <span>{readTime} dk okuma</span>
            </div>
            <AnimatePresence mode="wait">
              {saveState === 'saving' ? (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-amber-500 flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Kaydediliyor...
                </motion.span>
              ) : saveState === 'saved' ? (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-emerald-500 flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {formatSavedTime(lastSaved)}
                </motion.span>
              ) : (
                <motion.span
                  key="unsaved"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-gray-400"
                >
                  Kaydedilmemiş değişiklikler
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Meta panel */}
        <AnimatePresence>
          {showMeta && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="border-l border-gray-200 bg-white overflow-hidden shrink-0"
            >
              <div className="p-4 space-y-5 w-60">
                {/* Pin / Fav / Archive */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Durum</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleMeta('is_pinned', !isPinned)}
                      className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border', isPinned ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'text-gray-500 border-gray-200 hover:bg-gray-50')}
                    >
                      <Pin className="w-3 h-3" /> Sabit
                    </button>
                    <button
                      onClick={() => toggleMeta('is_favorite', !isFavorite)}
                      className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border', isFavorite ? 'bg-rose-50 text-rose-600 border-rose-200' : 'text-gray-500 border-gray-200 hover:bg-gray-50')}
                    >
                      <Heart className="w-3 h-3" /> Favori
                    </button>
                  </div>
                  <button
                    onClick={() => toggleMeta('is_archived', !isArchived)}
                    className={cn('mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border w-full', isArchived ? 'bg-gray-100 text-gray-700 border-gray-300' : 'text-gray-500 border-gray-200 hover:bg-gray-50')}
                  >
                    <Archive className="w-3 h-3" /> {isArchived ? 'Arşivden Çıkar' : 'Arşivle'}
                  </button>
                </div>

                {/* Subject */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    <BookOpen className="w-3 h-3" /> Ders
                  </label>
                  <select
                    value={localSubjectId ?? ''}
                    onChange={e => updateSubject(e.target.value || null)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="">Ders seçin</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Folder */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    <FolderOpen className="w-3 h-3" /> Klasör
                  </label>
                  <select
                    value={localFolderId ?? ''}
                    onChange={e => updateFolder(e.target.value || null)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="">Klasör seçin</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>{f.icon} {f.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    <Tag className="w-3 h-3" /> Etiketler
                  </label>
                  <div className="flex gap-1 mb-2 flex-wrap">
                    {tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5 text-[10px]">
                        {tag}
                        <button onClick={() => removeTag(tag)}><X className="w-2 h-2" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                      placeholder="Etiket ekle..."
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <button onClick={addTag} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200">
                      +
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Panel */}
        <AnimatePresence>
          {showAI && (
            <AIPanel
              noteId={note.id}
              noteContent={content}
              onClose={() => setShowAI(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
