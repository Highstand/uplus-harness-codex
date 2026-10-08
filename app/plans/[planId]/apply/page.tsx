import { ApplyScreen, ScreenBoundary } from "@/components/plan-screens";
export default async function ApplyPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  return <ScreenBoundary kind="apply"><ApplyScreen planId={planId} /></ScreenBoundary>;
}
