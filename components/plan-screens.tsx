"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Component, Suspense, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { BottomCTA, Button, Card, Checkbox, Content, FilterChip, Header, Input, ListRow, ScreenShell, Tag } from "./ui";
import { dataAmount, dataNotice, findPlan, money, plans, typeLabels, type Plan, type PlanFilter } from "@/lib/plans";
import { beginApplication, chooseFilter, clearReceipt, completeDemo, displayDate, displayPhone, maskedPhone, useDemoSession, validApplication, validName, validPhone } from "@/lib/demo";
import "./screens.css";

type ScreenKind = "list" | "detail" | "confirm" | "apply" | "complete";
const screenMessages = {
  list: { title: "요금제 찾기", error: "요금제를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." },
  detail: { title: "요금제 상세", error: "요금제 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." },
  confirm: { title: "변경 전 확인", error: "변경 전 안내를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." },
  apply: { title: "변경 신청", error: "신청 화면을 표시하지 못했어요. 잠시 후 다시 시도해 주세요." },
  complete: { title: "신청 완료", error: "시연 내용을 표시하지 못했어요. 처음 화면으로 이동해 주세요." },
};
class ScreenErrorBoundary extends Component<{ kind: ScreenKind; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    const message = screenMessages[this.props.kind];
    return <Frame title={message.title}><div className="empty-state"><p role="alert">{message.error}</p>{this.props.kind !== "complete" && <Button onClick={() => this.setState({ failed: false })}>다시 불러오기</Button>}<Link href="/plans" className="plan-link">처음으로</Link></div></Frame>;
  }
}
export function ScreenBoundary({ kind, children }: { kind: ScreenKind; children: ReactNode }) {
  return <ScreenErrorBoundary kind={kind}><Suspense fallback={<Frame title={screenMessages[kind].title} footer={kind !== "list" ? <BottomCTA><Button disabled>화면을 준비하고 있어요</Button></BottomCTA> : undefined}><p className="muted" role="status">화면을 준비하고 있어요.</p>{kind === "list" && <div className="filter-list">{Object.entries(typeLabels).map(([key, label]) => <FilterChip key={key} selected={key === "all"} disabled>{label}</FilterChip>)}</div>}{Array.from({ length: kind === "list" ? 4 : 1 }, (_, i) => <div className="skeleton" key={i} aria-hidden="true" />)}</Frame>}>{children}</Suspense></ScreenErrorBoundary>;
}

function Frame({ title, back, trailing, children, footer }: { title: string; back?: string; trailing?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return <ScreenShell><div className="plan-screen">
    <Header title={title} leading={back ? <Link href={back} className="back-link" aria-label="뒤로">‹</Link> : <span className="header-space" />} trailing={trailing ?? <span className="header-space" />} />
    <Content>{children}</Content>{footer}
  </div></ScreenShell>;
}

function PlanSummary({ plan, detail = false, compact = false }: { plan: Plan; detail?: boolean; compact?: boolean }) {
  return <Card>
    <div className="tag-line"><span className="plan-type">{typeLabels[plan.type]}</span>{plan.is_recommended && <Tag>추천</Tag>}</div>
    <h2 className="plan-name">{plan.name}</h2>
    {!compact && !detail && <div className="plan-facts">
      <div className="plan-fact"><span className="muted">기본 데이터</span><span>{dataAmount(plan)}</span></div>
      <div className="plan-fact"><span className="muted">소진 후 속도</span><span>{plan.speed_after ?? "제한 없음"}</span></div>
    </div>}
    <div className="price-block"><p className="price-label">매달 내는 돈</p><p className="price">월 {money(plan.promo_price)}</p>
      {detail && <p className="muted">가입 후 24개월 동안</p>}
      {!compact && <p className="muted">24개월 후 월 {money(plan.regular_price)}</p>}
    </div>
    {!compact && !detail && <p className="muted">{plan.description}</p>}
  </Card>;
}

function MissingPlan({ title, message }: { title: string; message: string }) {
  const router = useRouter();
  return <Frame title={title} back="/plans"><div className="empty-state"><h2 className="section-title">{message}</h2><Button onClick={() => router.replace("/plans")}>요금제 목록으로</Button></div></Frame>;
}

export function PlansScreen() {
  const session = useDemoSession();
  useEffect(() => { clearReceipt(); }, []);
  const visible = plans.filter((plan) => session.filter === "all" || plan.type === session.filter);
  return <Frame title="요금제 찾기">
    <div className="flow-close"><h2 className="screen-title">나에게 맞는<br />요금제 찾기</h2><p className="muted">무제한 유형과 매달 내는 돈을 비교해 보세요.</p></div>
    <div className="filter-list" role="group" aria-label="무제한 유형 필터">{(Object.keys(typeLabels) as PlanFilter[]).map((filter) => <FilterChip key={filter} selected={session.filter === filter} onClick={() => chooseFilter(filter)}>{session.filter === filter && <span aria-hidden="true">✓ </span>}{typeLabels[filter]}</FilterChip>)}</div>
    <div className="plan-list" aria-live="polite">{visible.length ? visible.map((plan) => <Link key={plan.id} href={`/plans/${plan.id}`} className="plan-link" aria-label={`${plan.name} 상세 보기`}><PlanSummary plan={plan} /></Link>) : <p className="empty-state">이 유형의 요금제가 없어요.</p>}</div>
    <p className="caption">요금제와 가격은 실습용 가상 데이터입니다.</p>
  </Frame>;
}

export function DetailScreen({ planId }: { planId: string }) {
  const router = useRouter();
  const plan = findPlan(planId);
  if (!plan) return <MissingPlan title="요금제 상세" message="요금제를 찾을 수 없어요." />;
  return <Frame title="요금제 상세" back="/plans" footer={<BottomCTA><Button scale="xl" onClick={() => router.push(`/plans/${plan.id}/confirm`)}>이 요금제로 변경하기</Button></BottomCTA>}>
    <PlanSummary plan={plan} detail />
    <section className="flow-close"><h2 className="section-title">요금은 이렇게 구성돼요</h2><Card><div>
      <ListRow label="정가">월 {money(plan.regular_price)}</ListRow>
      <ListRow label="24개월 할인">−{money(plan.regular_price - plan.promo_price)}</ListRow>
      <ListRow label="매달 내는 돈">월 {money(plan.promo_price)}</ListRow>
    </div></Card></section>
    <section className="flow-close"><h2 className="section-title">데이터 조건을 확인해 주세요</h2><div><ListRow label="기본 데이터">{dataAmount(plan)}</ListRow><ListRow label="소진 후 속도">{plan.speed_after ?? "제한 없음"}</ListRow></div><p className="notice">{dataNotice(plan)}</p></section>
  </Frame>;
}

const notices = [
  { title: "이번 달 요금", text: "이번 달 요금은 변경이 처리되는 날짜에 따라 달라질 수 있어요. 정확한 금액은 다음 달 청구서에서 확인할 수 있어요." },
  { title: "위약금", text: "약정 기간 중에 요금제를 바꾸면 위약금이 생길 수 있어요. 약정이 끝났다면 위약금 없이 바꿀 수 있어요." },
  { title: "유심 교체", text: "요금제만 바꾸는 경우 지금 쓰는 유심을 그대로 쓸 수 있어요." },
];

export function ConfirmScreen({ planId }: { planId: string }) {
  const router = useRouter();
  const plan = findPlan(planId);
  if (!plan) return <MissingPlan title="변경 전 확인" message="선택한 요금제 정보가 없어요." />;
  return <Frame title="변경 전 확인" back={`/plans/${plan.id}`} footer={<BottomCTA layout="double"><Button variant="secondary" onClick={() => router.push("/plans")}>다른 요금제 보기</Button><Button onClick={() => { beginApplication(); router.push(`/plans/${plan.id}/apply`); }}>신청하기</Button></BottomCTA>}>
    <div className="flow-close"><h2 className="screen-title">변경 전에<br />꼭 확인해 주세요</h2><p className="muted">궁금했던 내용을 미리 안내해 드려요.</p></div>
    <PlanSummary plan={plan} detail />
    <div className="advice-list">{notices.map((notice) => <section className="advice" key={notice.title}><h2 className="section-title">{notice.title}</h2><p className="muted">{notice.text}</p></section>)}</div>
    <p className="caption">실습용 안내 초안입니다. 실제 변경 시 통신사의 요금·약정·유심 정책을 확인해 주세요.</p>
  </Frame>;
}

export function ApplyScreen({ planId }: { planId: string }) {
  const plan = findPlan(planId);
  const router = useRouter();
  const session = useDemoSession();
  useEffect(() => { if (session.completed && !session.receipt) router.replace("/plans"); }, [session.completed, session.receipt, router]);
  if (session.completed && !session.receipt) return <Frame title="변경 신청"><p className="muted" role="status">요금제 목록으로 이동하고 있어요.</p></Frame>;
  if (!plan) return <MissingPlan title="변경 신청" message="선택한 요금제 정보가 없어요." />;
  return <ApplicationForm plan={plan} />;
}

function ApplicationForm({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [nameError, setNameError] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submitted = useRef(false);
  const sheet = useRef<HTMLDialogElement>(null);
  const input = { name, phone, plan_id: plan.id, privacy_agreed: agreed };
  const valid = validApplication(input);
  useEffect(() => {
    const discard = () => { setName(""); setPhone(""); setAgreed(false); };
    window.addEventListener("popstate", discard);
    return () => window.removeEventListener("popstate", discard);
  }, []);
  function clearForm() { setName(""); setPhone(""); setAgreed(false); }
  function cancel() { clearForm(); clearReceipt(); router.replace(`/plans/${plan.id}`); }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid || submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    try {
      completeDemo(input);
      clearForm();
      // Back from completion lands on this safe replacement, never the form.
      window.history.replaceState(null, "", "/plans");
      router.push("/subscriptions/complete");
    } catch {
      submitted.current = false;
      setSubmitting(false);
      setSubmitError("시연을 완료하지 못했어요. 입력 내용을 확인하고 다시 시도해 주세요.");
    }
  }
  return <Frame title="변경 신청" trailing={<Button variant="secondary" scale="sm" onClick={cancel} disabled={submitting}>취소</Button>} footer={<BottomCTA><Button type="submit" form="application" scale="xl" disabled={!valid || submitting} aria-busy={submitting}>{submitting ? "시연을 완료하는 중…" : "신청 완료하기"}</Button></BottomCTA>}>
    <div className="flow-close"><h2 className="screen-title">간단한 정보만<br />입력하면 돼요</h2><p className="muted">실제 접수 없이 신청 과정을 체험합니다.</p></div>
    <PlanSummary plan={plan} compact />
    <form id="application" className="flow-stack" onSubmit={submit} noValidate>
      <Input id="applicant-name" label="이름" placeholder="이름" value={name} autoComplete="off" disabled={submitting} error={nameError} onChange={(event) => { const letters = Array.from(event.target.value); setName(letters.slice(0, 20).join("")); setNameError(letters.length > 20 ? "이름은 20자까지 입력할 수 있어요." : ""); }} onBlur={() => { if (!validName(name)) setNameError("이름을 입력해 주세요."); }} />
      <Input id="applicant-phone" label="휴대폰 번호" placeholder="010-0000-0000" value={displayPhone(phone)} inputMode="numeric" type="tel" autoComplete="off" disabled={submitting} error={phoneTouched && !validPhone(phone) ? "휴대폰 번호 11자리를 정확히 입력해 주세요." : undefined} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 11))} onBlur={() => setPhoneTouched(true)} />
      <div className="agreement"><Checkbox checked={agreed} onChange={(event) => setAgreed(event.target.checked)} disabled={submitting} label="[필수] 개인정보 수집·이용에 동의합니다" /><Button scale="sm" variant="secondary" onClick={() => sheet.current?.showModal()}>보기</Button></div>
      <p className="caption">실습 화면이며 입력한 개인정보는 저장하지 않습니다.</p>
      {submitError && <p className="ui-error" role="alert">{submitError}</p>}
    </form>
    <dialog ref={sheet} className="privacy-sheet" aria-labelledby="privacy-title"><div className="flow-stack"><h2 id="privacy-title" className="section-title">개인정보 수집·이용 안내</h2><p className="muted">수집 항목: 이름, 휴대폰 번호</p><p className="muted">이용 목적: 요금제 변경 신청 과정 체험</p><p className="notice">실습 화면이며 입력한 개인정보는 저장하지 않습니다.</p><p className="muted">실제 신청 기능을 연결할 때 개인정보 보관 기간을 안내합니다.</p><Button onClick={() => sheet.current?.close()}>닫기</Button></div></dialog>
  </Frame>;
}

export function CompleteScreen() {
  const router = useRouter();
  const { receipt } = useDemoSession();
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function home() { clearReceipt(); router.replace("/plans"); }
  useEffect(() => {
    function back() { clearReceipt(); router.replace("/plans"); }
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, [router]);
  async function copy() {
    if (!receipt) return;
    try { await navigator.clipboard.writeText(receipt.application_no); setToast("신청 번호를 복사했어요."); }
    catch { setToast("복사하지 못했어요. 시연 번호를 직접 선택해 복사해 주세요."); }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2000);
  }
  if (!receipt) return <Frame title="신청 완료"><div className="empty-state"><h2 className="section-title">확인할 신청 정보가 없어요.</h2><Button onClick={home}>처음으로</Button></div></Frame>;
  const plan = findPlan(receipt.plan_id);
  if (!plan) return <Frame title="신청 완료"><div className="empty-state"><p role="alert">시연 내용을 표시하지 못했어요. 처음 화면으로 이동해 주세요.</p><Button onClick={home}>처음으로</Button></div></Frame>;
  return <Frame title="신청 완료" footer={<BottomCTA><Button scale="xl" onClick={home}>처음으로</Button></BottomCTA>}>
    <div className="completion-heading"><span className="done-mark" aria-hidden="true">✓</span><h2 className="screen-title">요금제 변경 신청을<br />체험했어요</h2><p className="muted">실제 통신사에 접수되지 않은 시연입니다.</p></div>
    <Card><p className="muted">시연 번호</p><div className="copy-line"><strong className="section-title">{receipt.application_no}</strong><Button scale="sm" variant="secondary" onClick={copy}>복사</Button></div></Card>
    <section className="flow-close"><h2 className="section-title">신청 시연 내용</h2><PlanSummary plan={plan} compact /><div><ListRow label="이름">{receipt.name}</ListRow><ListRow label="휴대폰 번호">{maskedPhone(receipt.phone)}</ListRow><ListRow label="시연 일시">{displayDate(receipt.created_at)}</ListRow><ListRow label="상태"><Tag>시연 완료</Tag></ListRow></div></section>
    <p className="notice">이 화면을 닫거나 새로고침하면 시연 내용을 다시 조회할 수 없어요. 필요한 경우 시연 번호를 복사해 두세요.</p>
    {toast && <div className="toast" role="status">{toast}</div>}
  </Frame>;
}
