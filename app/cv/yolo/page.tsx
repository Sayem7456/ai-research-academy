import { YOLOPipelineVisualizer } from '@/features/computer-vision/components';

export default function YOLOPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <YOLOPipelineVisualizer />
      </div>
    </main>
  );
}
