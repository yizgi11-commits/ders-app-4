import PlannerHub from '@/components/planner/PlannerHub'

export default function PlannerPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Planner</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Ne çalışacağım ve ne zaman?</p>
      </div>

      <PlannerHub />
    </div>
  )
}
