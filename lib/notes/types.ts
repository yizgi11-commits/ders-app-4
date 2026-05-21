export interface NoteFolder {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  folder_id: string | null
  subject_id: string | null
  title: string
  content: string
  content_preview: string
  tags: string[]
  is_pinned: boolean
  is_archived: boolean
  is_favorite: boolean
  word_count: number
  reading_time_mins: number
  created_at: string
  updated_at: string
  // joined
  folder?: NoteFolder
  subject_name?: string
}

export type NoteFilter = 'all' | 'pinned' | 'favorites' | 'archived' | 'recent'
export type NoteView = 'list' | 'grid'
