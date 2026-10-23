import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { READ_ONLY_REASON, useCanEdit } from '@/app/session'
import { toast } from '@/app/toast'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DistrictSearch } from '@/components/DistrictSearch'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DEMO_NOT_SENT_TEXT } from '@/config/demo'
import { HUMAN_REVIEW_NOTE, PRIORITY_LABELS, TEAM_LABELS } from '@/config/actions'
import { isDemoMode } from '@/services/api'
import { createAction } from '@/services/endpoints'
import type { ActionPriority, CreateActionRequest, DistrictRef, ResponsibleTeam } from '@/types'
import { createActionSchema } from '@/types'
import { useCreateAction, type CreateActionPrefill } from './createActionStore'

type Errors = Partial<Record<keyof CreateActionRequest, string>>

/** Mounted once in the layout; opened from any "Create action" button. */
export function CreateActionDialog() {
  const { open, prefill, nonce, close } = useCreateAction()
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <CreateActionForm key={nonce} prefill={prefill} close={close} />
    </Dialog>
  )
}

function CreateActionForm({ prefill, close }: { prefill: CreateActionPrefill | null; close: () => void }) {
  const canEdit = useCanEdit()
  const qc = useQueryClient()

  const [district, setDistrict] = useState<DistrictRef | null>(prefill?.district ?? null)
  const [action, setAction] = useState(prefill?.suggested_action ?? '')
  const [priority, setPriority] = useState<ActionPriority>(prefill?.priority ?? 'medium')
  const [team, setTeam] = useState<ResponsibleTeam>(prefill?.responsible_team ?? 'district_surveillance_unit')
  const [assignee, setAssignee] = useState('')
  const [reason, setReason] = useState(prefill?.reason ?? '')
  const [errors, setErrors] = useState<Errors>({})
  const [pending, setPending] = useState<CreateActionRequest | null>(null)

  const mutation = useMutation({
    mutationFn: createAction,
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['actions'] })
      void qc.invalidateQueries({ queryKey: ['overview'] })
      void qc.invalidateQueries({ queryKey: ['district'] })
      toast({
        variant: res.demo ? 'demo' : 'success',
        title: `Action created for ${res.action.district.name}`,
        description: res.demo ? `${DEMO_NOT_SENT_TEXT}. Saved in this browser only.` : undefined,
      })
      setPending(null)
      close()
    },
    onError: (e) => toast({ variant: 'error', title: 'Could not create the action', description: e instanceof Error ? e.message : undefined }),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = createActionSchema.safeParse({
      district_id: district?.id ?? '',
      suggested_action: action,
      priority,
      responsible_team: team,
      assignee,
      reason,
    })
    if (!parsed.success) {
      const errs: Errors = {}
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof CreateActionRequest
        errs[k] ??= issue.message
      }
      setErrors(errs)
      return
    }
    setErrors({})
    setPending(parsed.data)
  }

  return (
    <>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create action</DialogTitle>
            <DialogDescription>{HUMAN_REVIEW_NOTE}</DialogDescription>
          </DialogHeader>
          {!canEdit ? (
            <p className="rounded-lg bg-cyan-50 p-3 text-sm text-navy-900">{READ_ONLY_REASON}</p>
          ) : (
            <form id="create-action-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>District</Label>
                {district ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <MapPin className="size-4 text-ink-muted" aria-hidden />
                      <span className="font-medium">{district.name}</span>
                      <span className="text-ink-muted">{district.state}</span>
                    </span>
                    <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => setDistrict(null)}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <DistrictSearch onSelect={setDistrict} label="Choose a district" placeholder="Choose a district…" />
                )}
                {errors.district_id && <FieldError>{errors.district_id}</FieldError>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ca-action">Suggested action</Label>
                <Textarea id="ca-action" value={action} onChange={(e) => setAction(e.target.value)} rows={3} aria-invalid={!!errors.suggested_action} aria-describedby={errors.suggested_action ? 'ca-action-err' : undefined} />
                {errors.suggested_action && <FieldError id="ca-action-err">{errors.suggested_action}</FieldError>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ca-priority">Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as ActionPriority)}>
                    <SelectTrigger id="ca-priority" className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ca-team">Responsible team</Label>
                  <Select value={team} onValueChange={(v) => setTeam(v as ResponsibleTeam)}>
                    <SelectTrigger id="ca-team" className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TEAM_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ca-assignee">Assign to (optional)</Label>
                <Input id="ca-assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Team or unit name — no personal data" />
                {errors.assignee && <FieldError>{errors.assignee}</FieldError>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ca-reason">Reason (optional)</Label>
                <Textarea id="ca-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
                {errors.reason && <FieldError>{errors.reason}</FieldError>}
              </div>
            </form>
          )}
          {/* Pinned so the actions stay visible (and thumb-reachable) while the form scrolls. */}
          <DialogFooter className="sticky -bottom-4 z-10 flex-row bg-surface *:flex-1 sm:*:flex-none">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            {canEdit && (
              <Button type="submit" form="create-action-form" disabled={mutation.isPending}>
                Review & create
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title="Create this action?"
        description={`${pending ? `${district?.name}: ${pending.suggested_action}` : ''}${isDemoMode ? ` — ${DEMO_NOT_SENT_TEXT}.` : ''}`}
        confirmLabel={mutation.isPending ? 'Creating…' : 'Create action'}
        onConfirm={() => {
          if (pending) mutation.mutate(pending)
        }}
      />
    </>
  )
}

function FieldError({ children, id }: { children: string; id?: string }) {
  return (
    <p id={id} className="text-sm text-risk-veryhigh">
      {children}
    </p>
  )
}
