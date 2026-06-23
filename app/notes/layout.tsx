import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Personal Notes — AI Research Academy',
  description: 'Your learning journal — create, search, and organize notes. Stored locally, works offline.',
};

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
