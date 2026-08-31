import { Metadata } from 'next';
import { TechDashboard } from '@/components/tech/TechDashboard';

export const metadata: Metadata = {
  title: 'Espace Tech & Ingénierie',
  description: 'Centre de commandement technique, monitoring d’infrastructure, sprints Plane et protocole QA 20-points.',
};

export default function TechPage() {
  return <TechDashboard />;
}
