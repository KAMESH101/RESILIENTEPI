import { MapPinOff } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="rounded-xl border bg-surface shadow-card">
      <EmptyState
        icon={MapPinOff}
        title="Page not found"
        description="This address doesn't match any ResilientEpi page."
        action={
          <Button asChild>
            <Link to="/">Go to Overview</Link>
          </Button>
        }
      />
    </div>
  )
}
