// Plane integration has been decommissioned.
// This file is retained as a deprecated stub for compatibility.

export interface PlaneConfig {
  isConfigured: boolean;
  baseUrl: string;
  apiKey: string;
  workspaceSlug: string;
  projectId: string;
  webhookSecret: string;
}

export function getPlaneConfig(): PlaneConfig {
  return {
    isConfigured: false,
    baseUrl: '',
    apiKey: '',
    workspaceSlug: '',
    projectId: '',
    webhookSecret: '',
  };
}
