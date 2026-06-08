// Shared types across the app
export type ID = string

export interface PaperRef {
  title: string
  year?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  url?: string
}
