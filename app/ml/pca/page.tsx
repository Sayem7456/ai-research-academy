import PCAAnimation from '@/features/machine-learning/components/visualizations/PCAAnimation';

export default function PCAPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <PCAAnimation />
      </div>
    </main>
  );
}
