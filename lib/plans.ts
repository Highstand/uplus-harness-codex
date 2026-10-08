export type PlanType = "basic" | "limited_unlimited" | "full_unlimited";
export type PlanFilter = "all" | PlanType;
export interface Plan {
  id: string;
  name: string;
  regular_price: number;
  promo_price: number;
  promo_months: number;
  data_gb: number | null;
  speed_after: string | null;
  type: PlanType;
  is_recommended: boolean;
  description: string;
}

// Fixed classroom examples from PRD; these are not carrier offers.
export const plans: readonly Plan[] = [
  { id: "p01", name: "라이트 7", regular_price: 39000, promo_price: 32000, promo_months: 24, data_gb: 7, speed_after: "400kbps", type: "basic", is_recommended: false, description: "영상보다 메신저·검색 위주로 쓰는 분께 맞는 요금제" },
  { id: "p02", name: "출퇴근 50", regular_price: 55000, promo_price: 47000, promo_months: 24, data_gb: 50, speed_after: "1Mbps", type: "limited_unlimited", is_recommended: false, description: "출퇴근길에 짧은 영상을 매일 보는 분께 맞는 요금제" },
  { id: "p03", name: "데일리 무제한 110", regular_price: 69000, promo_price: 59000, promo_months: 24, data_gb: 110, speed_after: "5Mbps", type: "limited_unlimited", is_recommended: true, description: "출퇴근길 영상 시청이 길어 월말 전에 데이터가 떨어지는 분께 맞는 요금제" },
  { id: "p04", name: "프리 무제한", regular_price: 89000, promo_price: 79000, promo_months: 24, data_gb: null, speed_after: null, type: "full_unlimited", is_recommended: false, description: "데이터 한도와 속도 제한 없이 쓰고 싶은 분께 맞는 요금제" },
];
export const typeLabels: Record<PlanFilter, string> = { all: "전체", basic: "기본형", limited_unlimited: "무제한 · 속도 제한 있음", full_unlimited: "완전 무제한" };
export const money = (value: number) => `${value.toLocaleString("ko-KR")}원`;
export const findPlan = (id: string) => plans.find((plan) => plan.id === id);
export const dataAmount = (plan: Plan) => plan.data_gb === null ? "제한 없음" : `${plan.data_gb}GB`;
export function dataNotice(plan: Plan) {
  if (plan.type === "full_unlimited") return "기본 데이터 한도와 속도 제한이 없어요.";
  const prefix = plan.type === "limited_unlimited" ? "이름에 '무제한'이 있지만 " : "";
  return `${prefix}기본 데이터 ${dataAmount(plan)}를 다 쓰면 이번 달 남은 기간 동안 최대 ${plan.speed_after}로 느려져요.`;
}
