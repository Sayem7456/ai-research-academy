import Link from 'next/link';
import { PoolingSimulator } from '@/features/computer-vision/components';

export default function PoolingSimulatorPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <Link href="/cv/cnn" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
            ← Back to Convolution Explorer
          </Link>
        </div>
        <PoolingSimulator />
      </div>
    </main>
  );
}
