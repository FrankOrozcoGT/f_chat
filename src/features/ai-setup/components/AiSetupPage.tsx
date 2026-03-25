import { MainLayout } from '@/layouts/MainLayout';
import { BatchAnalysisSection } from './BatchAnalysisSection';
import { DraftFlowsSection } from './DraftFlowsSection';

export const AiSetupPage = () => {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-1">AI Setup</h1>
          <p className="text-sm md:text-base text-text-secondary">
            Prepara la IA con los datos de tus conversaciones para maximizar su efectividad
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <BatchAnalysisSection />
          <DraftFlowsSection />
        </div>
      </div>
    </MainLayout>
  );
};
