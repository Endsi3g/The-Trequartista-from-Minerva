import { z } from 'zod';

// Claude asserts WHICH steps/roles/tools appear in the transcript and the
// raw hours/quotes behind them -- it never asserts a dollar figure or an
// API-compatibility verdict. Those are computed/looked-up server-side
// against role_hourly_rates / tool_compatibility_dictionary, so a bad
// model guess can never masquerade as a real number.

export const ProcessStepSchema = z.object({
  title: z.string(),
  description: z.string(),
  role_involved: z.string().optional(),
  is_bottleneck: z.boolean(),
  is_duplicate_entry: z.boolean(),
  source_quote: z.string().optional(),
});

export const HiddenCostItemSchema = z.object({
  task_description: z.string(),
  role_name: z.string(),
  hours_wasted_per_week: z.number().positive(),
  source_quote: z.string().optional(),
});

export const ToolStackFindingSchema = z.object({
  tool_name: z.string(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

// Deliberately no .min(n) here: forcing a minimum count either fails a
// perfectly good extraction on a short call or pressures the model into
// padding with fabricated initiatives -- a direct real-data-only
// violation. "5-10" is prompt guidance, not a schema constraint.
export const AiInitiativeSchema = z.object({
  title: z.string(),
  description: z.string(),
  impact_score: z.number().int().min(1).max(10),
  effort_score: z.number().int().min(1).max(10),
});

export const AuditExtractionSchema = z.object({
  process_steps: z.array(ProcessStepSchema),
  hidden_cost_items: z.array(HiddenCostItemSchema),
  tool_stack_findings: z.array(ToolStackFindingSchema),
  ai_initiatives: z.array(AiInitiativeSchema),
});

export type AuditExtraction = z.infer<typeof AuditExtractionSchema>;

// Hand-maintained JSON Schema mirror for Claude's tool_use input_schema
// (kept in lockstep with AuditExtractionSchema above -- zod-to-json-schema
// was deliberately skipped as an extra dependency for one call site).
export const AUDIT_EXTRACTION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    process_steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          role_involved: { type: 'string' },
          is_bottleneck: { type: 'boolean' },
          is_duplicate_entry: { type: 'boolean' },
          source_quote: { type: 'string' },
        },
        required: ['title', 'description', 'is_bottleneck', 'is_duplicate_entry'],
      },
    },
    hidden_cost_items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          task_description: { type: 'string' },
          role_name: { type: 'string' },
          hours_wasted_per_week: { type: 'number' },
          source_quote: { type: 'string' },
        },
        required: ['task_description', 'role_name', 'hours_wasted_per_week'],
      },
    },
    tool_stack_findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tool_name: { type: 'string' },
          category: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['tool_name'],
      },
    },
    ai_initiatives: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          impact_score: { type: 'integer', minimum: 1, maximum: 10 },
          effort_score: { type: 'integer', minimum: 1, maximum: 10 },
        },
        required: ['title', 'description', 'impact_score', 'effort_score'],
      },
    },
  },
  required: ['process_steps', 'hidden_cost_items', 'tool_stack_findings', 'ai_initiatives'],
} as const;
