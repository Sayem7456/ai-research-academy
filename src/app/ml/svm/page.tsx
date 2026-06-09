import SVMBoundaryExplorer from '@/features/machine-learning/components/visualizations/SVMBoundaryExplorer';

export default function SVMPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <SVMBoundaryExplorer />
      </div>
    </main>
  );
}
