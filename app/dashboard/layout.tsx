import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — AI Research Academy',
  description: 'Detailed analytics: progress charts, category breakdown, and 30-day activity timeline.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
