import DashboardLayout from "@/components/DashboardLayout";
import ChurchCreationFallback from "@/components/ChurchCreationFallback";
import { useChurch } from "@/hooks/useChurch";
import { Loader2 } from "lucide-react";

const ChurchCreationPage = () => {
  const { isLoading } = useChurch();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Adicionar Nova Igreja"
      description="Configure uma nova igreja para administrar."
    >
      <ChurchCreationFallback />
    </DashboardLayout>
  );
};

export default ChurchCreationPage;
