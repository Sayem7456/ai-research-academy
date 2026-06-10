import { YOLOPipelineVisualizer } from '@/features/computer-vision/components';

export default function YOLOPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <YOLOPipelineVisualizer />
      </div>
    </main>
  );
}
