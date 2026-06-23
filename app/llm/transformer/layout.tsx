import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transformer Animation — AI Research Academy',
  description: 'Interactive Transformer architecture visualization: encoder, decoder, and seq2seq views with animated data flow.',
};

export default function TransformerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
