import { VisionTransformerExplorer } from '@/features/computer-vision/components';

export default function VisionTransformerPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <VisionTransformerExplorer />
      </div>
    </main>
  );
}
