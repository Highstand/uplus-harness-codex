import type { ApplicationInput } from "./demo";

export interface Subscription extends ApplicationInput {
  id: string;
  application_no: string;
  created_at: string;
  status: "received" | "processing" | "completed" | "canceled";
}

function connection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("저장소 연결 설정을 확인해 주세요.");
  return { endpoint: `${url.replace(/\/$/, "")}/rest/v1/subscriptions`, headers: { apikey: key } };
}

export async function readSubscription(id: string, signal?: AbortSignal): Promise<Subscription> {
  const { endpoint, headers } = connection();
  const query = new URLSearchParams({ select: "id,application_no,name,phone,plan_id,privacy_agreed,status,created_at", id: `eq.${id}`, limit: "1" });
  const response = await fetch(`${endpoint}?${query}`, { headers, cache: "no-store", signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error("저장된 신청 내용을 불러오지 못했어요.");
  const rows: Subscription[] = await response.json();
  if (rows.length !== 1 || rows[0].id !== id) throw new Error("저장된 신청 내용을 찾을 수 없어요.");
  return rows[0];
}

export async function insertSubscription(id: string, input: ApplicationInput): Promise<void> {
  const { endpoint, headers } = connection();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ id, name: input.name.trim(), phone: input.phone, plan_id: input.plan_id, privacy_agreed: input.privacy_agreed, status: "received" }),
    signal: AbortSignal.timeout(20000),
  });
  if (response.ok) return;
  const error = await response.json().catch(() => null) as { code?: string } | null;
  if (error?.code === "23505") {
    // A lost response can leave a successful INSERT behind. Reuse its UUID;
    // never upsert or allocate a second application on this retry.
    await readSubscription(id);
    return;
  }
  throw new Error("신청을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.");
}
