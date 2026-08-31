'use client';

import React from 'react';
import {
  ProjectsTable,
  MrrBreakdownTable,
  LeadFunnelCard,
  PendingTasksCard,
  type OverviewMetricsData,
} from './OverviewWidgets';

// Managing workspace: santé client/MRR en priorité (colonne principale),
// pipeline de leads en second (colonne secondaire).
export function ManagingOverview(data: OverviewMetricsData) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      <div className="lg:col-span-2 space-y-4">
        <ProjectsTable projects={data.projects} loading={data.loading} />
        <MrrBreakdownTable
          topClientsByMrr={data.topClientsByMrr}
          totalMrr={data.totalMrr}
          maxClientMrr={data.maxClientMrr}
          mrrTrendData={data.mrrTrendData}
          loading={data.loading}
        />
      </div>
      <div className="space-y-4">
        <LeadFunnelCard
          leadFunnelStages={data.leadFunnelStages}
          activeLeadsCount={data.activeLeadsCount}
          totalPipelineValue={data.totalPipelineValue}
          totalMrr={data.totalMrr}
          maxStageCount={data.maxStageCount}
          leadsCount={data.leadsCount}
          loading={data.loading}
        />
        <PendingTasksCard pendingTasks={data.pendingTasks} loading={data.loading} />
      </div>
    </div>
  );
}
