import { BonsaiPlantLoader } from '@/components/ui/bonsai-plant-loader';

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center py-20 min-h-[500px] relative">
      <BonsaiPlantLoader
        title="Hold tight!"
        subtitle="Your dashboard is loading..."
      />
    </div>
  );
}
