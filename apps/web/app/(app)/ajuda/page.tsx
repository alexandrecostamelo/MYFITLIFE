import { Metadata } from 'next';
import { HelpManualClient } from './help-manual-client';

export const metadata: Metadata = {
  title: 'Central de Ajuda — MyFitLife',
  description: 'Guias, tutoriais e dúvidas frequentes sobre o MyFitLife',
};

export default function AjudaPage() {
  return <HelpManualClient />;
}
