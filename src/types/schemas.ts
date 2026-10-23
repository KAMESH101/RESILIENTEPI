/**
 * zod schemas for every request body / form the UI submits (prompt §9:
 * "Validate all form input with zod"). Request types are inferred from these.
 * Optional text fields accept null so parsed output can be re-validated by the API.
 */
import { z } from 'zod'

const optionalReason = z
  .string()
  .trim()
  .max(500, 'Keep the reason under 500 characters')
  .nullish()
  .transform((v) => (v ? v : null))

/** POST /blind-spots/{id}/review */
export const blindSpotReviewSchema = z.object({
  decision: z.enum(['acknowledge', 'flag_for_audit', 'dismiss']),
  reason: optionalReason,
})
export type BlindSpotReviewRequest = z.output<typeof blindSpotReviewSchema>

/** POST /actions */
export const createActionSchema = z.object({
  district_id: z.string().min(1, 'Choose a district'),
  suggested_action: z.string().trim().min(3, 'Describe the action').max(300),
  priority: z.enum(['p1', 'p2', 'p3']),
  responsible_team: z.enum([
    'district_surveillance_unit',
    'rapid_response_team',
    'laboratory',
    'vector_control',
    'hospital_preparedness',
    'data_quality',
  ]),
  assignee: z.string().trim().max(80).nullish().transform((v) => (v ? v : null)),
  reason: z.string().trim().max(300).nullish().transform((v) => (v ? v : null)),
})
export type CreateActionRequest = z.output<typeof createActionSchema>

/** Minimum length of the note required when a task is marked Completed. */
export const COMPLETION_NOTE_MIN = 5

/**
 * PATCH /actions/{action_id} — any subset of fields; at least one required.
 * Marking a task Completed requires a short note.
 */
export const updateActionSchema = z
  .object({
    status: z.enum(['pending', 'in_progress', 'completed']).optional(),
    priority: z.enum(['p1', 'p2', 'p3']).optional(),
    assignee: z.string().trim().min(2, 'Enter a team or unit name').max(80, 'Keep it under 80 characters').nullable().optional(),
    note: z.string().trim().max(500, 'Keep the note under 500 characters').optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined && x !== ''), {
    message: 'Nothing to update',
  })
  .refine((v) => v.status !== 'completed' || (v.note?.length ?? 0) >= COMPLETION_NOTE_MIN, {
    message: 'Add a short note on what was done before marking it completed',
    path: ['note'],
  })
export type UpdateActionRequest = z.output<typeof updateActionSchema>

/** POST /reports/generate */
export const generateReportSchema = z
  .object({
    scope: z.enum(['district', 'state', 'national']),
    district_id: z.string().optional(),
    state: z.string().optional(),
    language: z.enum(['en', 'hi', 'ta']),
    horizon: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  })
  .refine((v) => v.scope !== 'district' || !!v.district_id, {
    message: 'Choose a district',
    path: ['district_id'],
  })
  .refine((v) => v.scope !== 'state' || !!v.state, {
    message: 'Choose a state',
    path: ['state'],
  })
export type GenerateReportRequest = z.output<typeof generateReportSchema>
