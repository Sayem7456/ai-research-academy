import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Math Visualizations — AI Research Academy',
  description: 'Interactive mathematical visualizations for linear algebra, calculus, probability, and statistics.',
};

export default function MathVisualizationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
