import { MainLayout } from '@/layouts/MainLayout';
import { BatchAnalysisSection } from './BatchAnalysisSection';
import { DraftFlowsSection } from './DraftFlowsSection';
import { InternalsReviewSection } from './InternalsReviewSection';

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
          <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base md:text-lg font-semibold text-text-primary mb-1">
                Supervisión de canales internos
              </h2>
              <p className="text-sm text-text-secondary">
                Aprueba o rechaza los canales detectados como internos por la IA
              </p>
            </div>
            <InternalsReviewSection />
          </div>
          <DraftFlowsSection />
        </div>
      </div>
    </MainLayout>
  );
};
