import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from '@/app/toast'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { HUMAN_REVIEW_NOTE, STATUS_LABELS } from '@/config/actions'
import { DEMO_NOT_SENT_TEXT } from '@/config/demo'
import { isDemoMode } from '@/services/api'
import { updateAction } from '@/services/endpoints'
import type { ActionStatus, ActionTask, UpdateActionRequest } from '@/types'
import { updateActionSchema } from '@/types'

export type TaskChange = { kind: 'assign' } | { kind: 'note' } | { kind: 'status'; to: ActionStatus }

const COPY: Record<string, { title: string; description: string; confirm: string }> = {
  assign: { title: 'Assign task', description: 'Assign to a team or unit. Use team names only — no personal data.', confirm: 'Assign' },
  note: { title: 'Add a note', description: 'Notes are timestamped and shown on the task.', confirm: 'Add note' },
  in_progress: { title: 'Mark as In Progress?', description: 'Records that work on this task has started.', confirm: 'Mark In Progress' },
  completed: { title: 'Mark as Completed?', description: 'Add a short note on what was done. It is kept with the task.', confirm: 'Mark Completed' },
  pending: { title: 'Move back to Pending?', description: 'Reopens the task. The history keeps every earlier change.', confirm: 'Move to Pending' },
}

/** Every task change goes through this confirmation (prompt §8 Phase 4). */
export function TaskChangeDialog({ task, change, onClose }: { task: ActionTask; change: TaskChange | null; onClose: () => void }) {
  const qc = useQueryClient()
  const [assignee, setAssignee] = useState(task.assignee ?? '')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const key = change ? (change.kind === 'status' ? change.to : change.kind) : 'note'
  const copy = COPY[key]!
  const noteRequired = change?.kind === 'note' || (change?.kind === 'status' && change.to === 'completed')

  const mutation = useMutation({
    mutationFn: (body: UpdateActionRequest) => updateAction(task.id, body),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['actions'] })
      void qc.invalidateQueries({ queryKey: ['overview'] })
      void qc.invalidateQueries({ queryKey: ['district', task.district.id] })
      toast({
        variant: res.demo ? 'demo' : 'success',
        title: `Task updated: ${task.district.name} — ${STATUS_LABELS[res.action.status]}`,
        description: res.demo ? `${DEMO_NOT_SENT_TEXT}. Saved in this browser only.` : undefined,
      })
    },
    onError: (e) => toast({ variant: 'error', title: 'Could not update the task', description: e instanceof Error ? e.message : undefined }),
  })

  const close = () => {
    setNote('')
    setError(null)
    setAssignee(task.assignee ?? '')
    onClose()
  }

  const submit = (): boolean | void => {
    if (!change) return false
    const body: Record<string, unknown> =
      change.kind === 'assign' ? { assignee: assignee.trim() } : change.kind === 'note' ? { note } : { status: change.to, ...(note.trim() ? { note } : {}) }
    if (change.kind === 'note' && !note.trim()) {
      setError('Write a note first')
      return false
    }
    const parsed = updateActionSchema.safeParse(body)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form')
      return false
    }
    mutation.mutate(parsed.data)
    close()
  }

  const fieldId = `task-${task.id}-field`
  return (
    <ConfirmDialog
      open={!!change}
      onOpenChange={(o) => !o && close()}
      title={`${copy.title} — ${task.district.name}`}
      description={copy.description}
      confirmLabel={copy.confirm}
      onConfirm={submit}
    >
      <div className="flex flex-col gap-3">
        <p className="rounded-lg bg-muted p-3 text-sm text-ink">{task.suggested_action}</p>
        {change?.kind === 'assign' ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fieldId}>Assign to</Label>
            <Input id={fieldId} value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="e.g. Rapid Response Team 2" aria-invalid={!!error} />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fieldId}>{noteRequired ? (change?.kind === 'note' ? 'Note' : 'What was done? (required)') : 'Note (optional)'}</Label>
            <Textarea id={fieldId} value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="max-h-40 [overflow-wrap:anywhere]" aria-invalid={!!error} />
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-risk-veryhigh">
            {error}
          </p>
        )}
        <p className="text-xs text-ink-muted">
          {HUMAN_REVIEW_NOTE}
          {isDemoMode && ` ${DEMO_NOT_SENT_TEXT}.`}
        </p>
      </div>
    </ConfirmDialog>
  )
}
