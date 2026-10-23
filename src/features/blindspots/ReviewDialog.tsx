import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from '@/app/toast'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ExperimentalNotice } from '@/components/ExperimentalNotice'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { REVIEW_DECISIONS } from '@/config/blindspot'
import { DEMO_NOT_SENT_TEXT } from '@/config/demo'
import { isDemoMode } from '@/services/api'
import { reviewBlindSpot } from '@/services/endpoints'
import type { BlindSpotAssessment, ReviewDecision } from '@/types'
import { blindSpotReviewSchema } from '@/types'

/** Confirmation for Acknowledge / Flag for audit / Dismiss, with an optional reason. */
export function ReviewDialog({
  assessment,
  decision,
  onClose,
}: {
  assessment: BlindSpotAssessment
  decision: ReviewDecision | null
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const d = decision ? REVIEW_DECISIONS[decision] : null

  const mutation = useMutation({
    mutationFn: (body: Parameters<typeof reviewBlindSpot>[1]) => reviewBlindSpot(assessment.id, body),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['blind-spots'] })
      void qc.invalidateQueries({ queryKey: ['district', assessment.district.id] })
      toast({
        variant: res.demo ? 'demo' : 'success',
        title: `${REVIEW_DECISIONS[res.review.decision].past}: ${assessment.district.name}`,
        description: res.demo ? `${DEMO_NOT_SENT_TEXT}. Saved in this browser only.` : undefined,
      })
    },
    onError: (e) => toast({ variant: 'error', title: 'Could not save the review', description: e instanceof Error ? e.message : undefined }),
  })

  const close = () => {
    setReason('')
    setError(null)
    onClose()
  }

  return (
    <ConfirmDialog
      open={!!decision}
      onOpenChange={(o) => !o && close()}
      title={d ? `${d.label}: ${assessment.district.name}?` : ''}
      description={d?.meaning ?? ''}
      confirmLabel={d?.label}
      onConfirm={() => {
        const parsed = blindSpotReviewSchema.safeParse({ decision, reason })
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'Check the reason')
          return false
        }
        mutation.mutate(parsed.data)
        close()
      }}
    >
      <div className="flex flex-col gap-3">
        <ExperimentalNotice className="rounded-lg bg-cyan-50 p-3" />
        <p className="text-sm text-ink">
          Score <span className="font-semibold tabular-nums">{assessment.score} / 100</span> — {assessment.district.name}, {assessment.district.state}
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`review-reason-${assessment.id}`}>Reason (optional)</Label>
          <Textarea
            id={`review-reason-${assessment.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="max-h-40 [overflow-wrap:anywhere]"
            placeholder="e.g. Testing camp scheduled next week"
            aria-invalid={!!error}
            aria-describedby={error ? `review-reason-err-${assessment.id}` : undefined}
          />
          {error && (
            <p id={`review-reason-err-${assessment.id}`} className="text-sm text-risk-veryhigh">
              {error}
            </p>
          )}
        </div>
        {isDemoMode && <p className="text-xs text-ink-muted">{DEMO_NOT_SENT_TEXT}. The review is saved in this browser.</p>}
      </div>
    </ConfirmDialog>
  )
}
