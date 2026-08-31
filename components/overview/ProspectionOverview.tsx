'use client';

import React from 'react';
import {
  ProjectsTable,
  MrrBreakdownTable,
  LeadFunnelCard,
  PendingTasksCard,
  type OverviewMetricsData,
} from './OverviewWidgets';

// Prospection workspace: pipeline de leads en priorité (colonne principale),
// santé client/MRR en second (colonne secondaire).
export function ProspectionOverview(data: OverviewMetricsData) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      <div className="lg:col-span-2 space-y-4">
        <LeadFunnelCard
          leadFunnelStages={data.leadFunnelStages}
          activeLeadsCount={data.activeLeadsCount}
          totalPipelineValue={data.totalPipelineValue}
          totalMrr={data.totalMrr}
          maxStageCount={data.maxStageCount}
          leadsCount={data.leadsCount}
          loading={data.loading}
        />
        <ProjectsTable projects={data.projects} loading={data.loading} />
      </div>
      <div className="space-y-4">
        <MrrBreakdownTable
          topClientsByMrr={data.topClientsByMrr}
          totalMrr={data.totalMrr}
          maxClientMrr={data.maxClientMrr}
          mrrTrendData={data.mrrTrendData}
          loading={data.loading}
        />
        <PendingTasksCard pendingTasks={data.pendingTasks} loading={data.loading} />
      </div>
    </div>
  );
}
