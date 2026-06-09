import KNNVisualizer from '@/features/machine-learning/components/visualizations/KNNVisualizer';

export default function KNNPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <KNNVisualizer />
      </div>
    </main>
  );
}
