import { ConfirmScreen, ScreenBoundary } from "@/components/plan-screens";
export default async function ConfirmPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  return <ScreenBoundary kind="confirm"><ConfirmScreen planId={planId} /></ScreenBoundary>;
}
