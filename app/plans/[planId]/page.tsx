import { DetailScreen, ScreenBoundary } from "@/components/plan-screens";
export default async function PlanDetailPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  return <ScreenBoundary kind="detail"><DetailScreen planId={planId} /></ScreenBoundary>;
}
