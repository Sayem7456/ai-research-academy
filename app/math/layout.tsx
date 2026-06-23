import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mathematics — AI Research Academy',
  description: 'Interactive mathematics lessons covering linear algebra, calculus, probability, and statistics — 27 interactive lessons for AI research.',
};

export default function MathLayout({ children }: { children: React.ReactNode }) {
  return children;
}
