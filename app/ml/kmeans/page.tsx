import KMeansAnimation from '@/features/machine-learning/components/visualizations/KMeansAnimation';

export default function KMeansPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <KMeansAnimation />
      </div>
    </main>
  );
}
