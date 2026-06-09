import DecisionTreeBuilder from '@/features/machine-learning/components/visualizations/DecisionTreeBuilder';

export default function DecisionTreePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <DecisionTreeBuilder />
      </div>
    </main>
  );
}
