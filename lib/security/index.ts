import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────
// String sanitisation + length enforcement
// ─────────────────────────────────────────────────────────────────
export function sanitizeString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLen)
}

// ─────────────────────────────────────────────────────────────────
// UUID validation (prevents path-traversal / injection via params)
// ─────────────────────────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function validateUUID(id: string): boolean {
  return UUID_RE.test(id)
}

// ─────────────────────────────────────────────────────────────────
// Safe error responses — never leak internal messages
// ─────────────────────────────────────────────────────────────────
export function safeError(
  err: unknown,
  publicMsg: string,
  status = 500,
): NextResponse {
  if (process.env.NODE_ENV !== 'production') {
    console.error(publicMsg, err)
  }
  return NextResponse.json({ error: publicMsg }, { status })
}

// ─────────────────────────────────────────────────────────────────
// Max lengths (characters)
// ─────────────────────────────────────────────────────────────────
export const MAX = {
  NOTE_TITLE:       200,
  NOTE_CONTENT:     50_000,
  FLASHCARD_SIDE:   500,
  SUBJECT_NAME:     100,
  TOPIC_NAME:       200,
  FOLDER_NAME:      100,
  TASK_TITLE:       300,
  GOAL_TEXT:        500,
  GENERIC_TEXT:     1_000,
} as const
