'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PublicBookingExperience } from '@/components/booking/PublicBookingExperience';

export default function PublicBookingPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || 'kael';

  return <PublicBookingExperience hostId={rawId} />;
}
