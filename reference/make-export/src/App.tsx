import { useState, useEffect, useRef } from 'react';

const assetPathPrefix = '/assets';
const imgArrowLeft = `${assetPathPrefix}/f152b.svg`;
const imgBullet = `${assetPathPrefix}/d5cc2.svg`;
const imgCheck = `${assetPathPrefix}/b53fc.svg`;
const imgCheckboxActive = `${assetPathPrefix}/e8d68.svg`;

// ─── Data ─────────────────────────────────────────────────────────────────────

type PlanType = 'basic' | 'limited_unlimited' | 'full_unlimited';

interface Plan {
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

interface Subscription {
  id: string;
  application_no: string;
  name: string;
  phone: string;
  plan_id: string;
  privacy_agreed: boolean;
  status: 'received';
  created_at: string;
}

const PLANS: Plan[] = [
  {
    id: 'p01',
    name: '라이트 7',
    regular_price: 39000,
    promo_price: 32000,
    promo_months: 24,
    data_gb: 7,
    speed_after: '400kbps',
    type: 'basic',
    is_recommended: false,
    description: '영상보다 메신저·검색 위주로 쓰는 분께 맞는 요금제',
  },
  {
    id: 'p02',
    name: '출퇴근 50',
    regular_price: 55000,
    promo_price: 47000,
    promo_months: 24,
    data_gb: 50,
    speed_after: '1Mbps',
    type: 'limited_unlimited',
    is_recommended: false,
    description: '출퇴근길에 짧은 영상을 매일 보는 분께 맞는 요금제',
  },
  {
    id: 'p03',
    name: '데일리 무제한 110',
    regular_price: 69000,
    promo_price: 59000,
    promo_months: 24,
    data_gb: 110,
    speed_after: '5Mbps',
    type: 'limited_unlimited',
    is_recommended: true,
    description: '출퇴근길 영상 시청이 길어 월말 전에 데이터가 떨어지는 분께 맞는 요금제',
  },
  {
    id: 'p04',
    name: '프리 무제한',
    regular_price: 89000,
    promo_price: 79000,
    promo_months: 24,
    data_gb: null,
    speed_after: null,
    type: 'full_unlimited',
    is_recommended: false,
    description: '데이터 한도와 속도 제한 없이 쓰고 싶은 분께 맞는 요금제',
  },
];

// ─── Router ───────────────────────────────────────────────────────────────────

type FilterValue = 'all' | PlanType;

type Screen =
  | { name: 'plans'; filter: FilterValue }
  | { name: 'detail'; planId: string; fromFilter: FilterValue }
  | { name: 'confirm'; planId: string; fromFilter: FilterValue }
  | { name: 'apply'; planId: string; fromFilter: FilterValue }
  | { name: 'complete'; subscription: Subscription; plan: Plan };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

function typeLabel(type: PlanType) {
  if (type === 'basic') return '기본형';
  if (type === 'limited_unlimited') return '무제한 · 속도 제한 있음';
  return '완전 무제한';
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  return phone;
}

function formatPhoneInput(digits: string) {
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function generateApplicationNo() {
  return `SUB-${Math.floor(100000 + Math.random() * 900000)}`;
}

function formatDatetime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function discountPct(plan: Plan) {
  return Math.round(((plan.regular_price - plan.promo_price) / plan.regular_price) * 100);
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function MobileShell({ children, bg = 'var(--bg\\/surface)' }: { children: React.ReactNode; bg?: string }) {
  return (
    <div className="flex justify-center min-h-dvh" style={{ background: 'var(--bg\\/subtle)' }}>
      <div
        className="relative flex flex-col w-full max-w-[390px] min-h-dvh overflow-hidden shadow-xl"
        style={{ background: bg }}
      >
        {children}
      </div>
    </div>
  );
}

function Header({
  title,
  onBack,
  rightAction,
}: {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}) {
  return (
    <header
      className="flex items-center shrink-0 w-full px-4 gap-2"
      style={{ height: 56, background: 'var(--bg\\/surface)', borderBottom: '1px solid var(--border\\/subtle)' }}
    >
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center justify-center shrink-0"
          style={{ width: 24, height: 24 }}
          aria-label="뒤로"
        >
          <img src={imgArrowLeft} alt="" style={{ width: 24, height: 24 }} />
        </button>
      ) : (
        <div style={{ width: 24, height: 24 }} />
      )}
      <p
        className="flex-1 text-center subtitle-default"
        style={{ color: 'var(--text\\/primary)' }}
      >
        {title}
      </p>
      {rightAction ? (
        <div className="shrink-0">{rightAction}</div>
      ) : (
        <div style={{ width: 24, height: 24 }} />
      )}
    </header>
  );
}

function Tag({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className="inline-flex items-center justify-center px-3 rounded-full caption-bold"
      style={{
        height: 26,
        background: accent ? 'var(--bg\\/accent-subtle)' : 'var(--bg\\/subtle)',
        color: accent ? 'var(--text\\/accent)' : 'var(--text\\/secondary)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function FilterChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 flex items-center gap-1 px-3 rounded-full border transition-colors body-small-medium"
      style={{
        height: 40,
        fontWeight: selected ? 700 : 500,
        background: selected ? 'var(--fill\\/secondary)' : 'var(--bg\\/surface)',
        color: selected ? 'var(--text\\/on-dark)' : 'var(--text\\/primary)',
        borderColor: selected ? 'var(--border\\/strong)' : 'var(--border\\/default)',
      }}
    >
      {selected && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M5 12l5 5 9-9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {label}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled = false,
  loading = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className="flex items-center justify-center w-full transition-colors body-strong"
      style={{
        height: 52,
        borderRadius: 8,
        background: isDisabled ? 'var(--fill\\/disabled)' : 'var(--fill\\/primary)',
        color: 'var(--text\\/on-dark)',
        border: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
    >
      {loading && (
        <svg className="animate-spin mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="60 10" />
        </svg>
      )}
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-full body-strong"
      style={{
        height: 52,
        borderRadius: 8,
        background: 'transparent',
        color: 'var(--text\\/primary)',
        border: '1.5px solid var(--border\\/default)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function BottomCTA({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="shrink-0 w-full flex flex-col gap-3 px-4"
      style={{ paddingTop: 12, paddingBottom: 32, background: 'var(--bg\\/surface)', borderTop: '1px solid var(--border\\/subtle)' }}
    >
      {children}
    </div>
  );
}

function ListRow({
  label,
  value,
  valueEl,
  check = false,
  last = false,
}: {
  label: string;
  value?: string;
  valueEl?: React.ReactNode;
  check?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-1"
      style={{
        paddingTop: 12,
        paddingBottom: 12,
        borderBottom: last ? 'none' : '1px solid var(--border\\/subtle)',
        minHeight: 46,
      }}
    >
      {check && (
        <img src={imgBullet} alt="" style={{ width: 6, height: 6, flexShrink: 0 }} />
      )}
      <p className="flex-1 min-w-0 body-small-medium" style={{ color: 'var(--text\\/secondary)' }}>
        {label}
      </p>
      {valueEl ?? (
        <p
          className="body-small-strong"
          style={{
            color: check ? 'var(--text\\/accent)' : 'var(--text\\/primary)',
            whiteSpace: 'nowrap',
            textAlign: 'right',
          }}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder: string;
  error?: string;
  inputMode?: 'numeric' | 'text';
  maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? 'var(--border\\/error)' : focused ? 'var(--border\\/focus)' : 'var(--border\\/default)';

  return (
    <div className="flex flex-col w-full" style={{ gap: 8 }}>
      <p className="body-small-medium" style={{ color: 'var(--text\\/secondary)' }}>
        {label}
      </p>
      <div
        className="flex items-center w-full pl-1"
        style={{ height: 58, borderBottom: `1.5px solid ${borderColor}`, paddingTop: 12, paddingBottom: 12 }}
      >
        <input
          className="flex-1 bg-transparent outline-none"
          style={{
            fontFamily: '"Pretendard Variable", sans-serif',
            fontWeight: 600,
            fontSize: 20,
            lineHeight: 'normal',
            color: value ? 'var(--text\\/primary)' : 'var(--text\\/placeholder)',
          }}
          value={value}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
        />
      </div>
      {error && (
        <p className="caption-medium" style={{ color: 'var(--text\\/error)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Plan List Screen ─────────────────────────────────────────────────────────

const FILTER_OPTIONS: { label: string; value: FilterValue }[] = [
  { label: '전체', value: 'all' },
  { label: '기본형', value: 'basic' },
  { label: '무제한 · 속도 제한 있음', value: 'limited_unlimited' },
  { label: '완전 무제한', value: 'full_unlimited' },
];

function PlanCard({ plan, onClick }: { plan: Plan; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col w-full text-left rounded-2xl border transition-all"
      style={{ padding: 20, gap: 12, background: 'var(--bg\\/surface)', borderColor: 'var(--border\\/default)' }}
    >
      <div className="flex flex-wrap gap-1 items-center">
        <Tag>{typeLabel(plan.type)}</Tag>
        {plan.is_recommended && <Tag accent>추천</Tag>}
      </div>
      <p className="heading-h4" style={{ color: 'var(--text\\/primary)', fontWeight: 700 }}>
        {plan.name}
      </p>
      <div style={{ width: '100%', height: 1, background: 'var(--border\\/subtle)' }} />
      <div className="flex flex-col gap-1 w-full">
        <div className="flex justify-between">
          <p className="caption-medium" style={{ color: 'var(--text\\/tertiary)' }}>기본 데이터</p>
          <p className="body-small-strong" style={{ color: 'var(--text\\/primary)' }}>
            {plan.data_gb !== null ? `${plan.data_gb}GB` : '제한 없음'}
          </p>
        </div>
        <div className="flex justify-between">
          <p className="caption-medium" style={{ color: 'var(--text\\/tertiary)' }}>소진 후 속도</p>
          <p className="body-small-strong" style={{ color: 'var(--text\\/primary)' }}>
            {plan.speed_after ?? '제한 없음'}
          </p>
        </div>
      </div>
      <div style={{ width: '100%', height: 1, background: 'var(--border\\/subtle)' }} />
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-baseline gap-2">
          <p className="caption-medium" style={{ color: 'var(--text\\/tertiary)' }}>매달 내는 돈</p>
          <p className="heading-h3" style={{ color: 'var(--text\\/primary)' }}>
            {formatPrice(plan.promo_price)}
          </p>
        </div>
        <p className="caption-medium" style={{ color: 'var(--text\\/tertiary)' }}>
          24개월 후 월 {formatPrice(plan.regular_price)}
        </p>
        <p className="body-small-medium" style={{ color: 'var(--text\\/secondary)', marginTop: 4 }}>
          {plan.description}
        </p>
      </div>
    </button>
  );
}

function PlanListScreen({
  initialFilter,
  onSelectPlan,
}: {
  initialFilter: FilterValue;
  onSelectPlan: (plan: Plan, filter: FilterValue) => void;
}) {
  const [filter, setFilter] = useState<FilterValue>(initialFilter);
  const filtered = PLANS.filter((p) => filter === 'all' || p.type === filter);

  return (
    <MobileShell bg="var(--bg\\/default)">
      <Header title="요금제 찾기" />
      <div className="flex-1 overflow-y-auto" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="flex flex-col gap-2">
          <p className="heading-h3" style={{ color: 'var(--text\\/primary)' }}>
            나에게 맞는 요금제 찾기
          </p>
          <p className="body-small-medium" style={{ color: 'var(--text\\/secondary)' }}>
            무제한 유형과 매달 내는 돈을 비교해 보세요.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <FilterChip key={opt.value} label={opt.label} selected={filter === opt.value} onClick={() => setFilter(opt.value)} />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <p className="caption-medium" style={{ color: 'var(--text\\/tertiary)' }}>
            매달 내는 돈 낮은 순 · {filtered.length}개
          </p>
          {filtered.length === 0 ? (
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{ height: 120, background: 'var(--bg\\/surface)', border: '1px solid var(--border\\/subtle)' }}
            >
              <p className="body-small-medium" style={{ color: 'var(--text\\/tertiary)' }}>
                이 유형의 요금제가 없어요.
              </p>
            </div>
          ) : (
            filtered.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onClick={() => onSelectPlan(plan, filter)} />
            ))
          )}
        </div>
      </div>
    </MobileShell>
  );
}

// ─── Plan Detail Screen ────────────────────────────────────────────────────────

function PlanDetailScreen({
  plan,
  onBack,
  onChangeClick,
}: {
  plan: Plan;
  onBack: () => void;
  onChangeClick: () => void;
}) {
  const discount = plan.regular_price - plan.promo_price;
  const pct = discountPct(plan);

  const dataConditionText = () => {
    if (plan.type === 'basic')
      return `기본 데이터 ${plan.data_gb}GB를 다 쓰면 이번 달 남은 기간 동안 최대 ${plan.speed_after}로 느려져요.`;
    if (plan.type === 'limited_unlimited')
      return `이름에 '무제한'이 있지만 기본 데이터 ${plan.data_gb}GB를 다 쓰면 이번 달 남은 기간 동안 최대 ${plan.speed_after}로 느려져요.`;
    return '기본 데이터 한도와 속도 제한이 없어요.';
  };

  return (
    <MobileShell bg="var(--bg\\/surface)">
      <Header title="요금제 상세" onBack={onBack} />
      <div className="flex-1 overflow-y-auto" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1 items-center">
            <Tag>{typeLabel(plan.type)}</Tag>
            {plan.is_recommended && <Tag accent>추천</Tag>}
          </div>
          <p className="heading-h2" style={{ color: 'var(--text\\/primary)' }}>
            {plan.name}
          </p>
          <p className="body-small-medium" style={{ color: 'var(--text\\/secondary)' }}>
            {plan.description}
          </p>
        </div>

        <div
          className="flex flex-col gap-1 rounded-xl"
          style={{ padding: 20, background: 'var(--bg\\/default)' }}
        >
          <p className="caption-medium" style={{ color: 'var(--text\\/tertiary)' }}>월 요금</p>
          <div className="flex items-center gap-1">
            <p className="heading-h2" style={{ color: 'var(--text\\/primary)' }}>
              {formatPrice(plan.promo_price)}
            </p>
            <p className="subtitle-bold" style={{ color: 'var(--text\\/accent)' }}>
              {pct}%
            </p>
          </div>
          <div className="flex items-center gap-1 caption-medium" style={{ color: 'var(--text\\/tertiary)' }}>
            <span style={{ textDecoration: 'line-through' }}>{formatPrice(plan.regular_price)}/월</span>
            <span>·</span>
            <span>24개월 할인 적용</span>
          </div>
        </div>

        <div className="flex flex-col">
          <p className="body-strong" style={{ color: 'var(--text\\/primary)', marginBottom: 0 }}>요금 구성</p>
          <ListRow label="정가" value={`월 ${formatPrice(plan.regular_price)}`} />
          <ListRow label="24개월 할인" valueEl={
            <p className="body-small-strong" style={{ color: 'var(--text\\/accent)' }}>
              −{formatPrice(discount)}
            </p>
          } />
          <ListRow label="매달 내는 돈" value={`월 ${formatPrice(plan.promo_price)}`} last />
        </div>

        <div className="flex flex-col">
          <p className="body-strong" style={{ color: 'var(--text\\/primary)' }}>데이터 조건</p>
          <ListRow label="기본 데이터" value={plan.data_gb !== null ? `${plan.data_gb}GB` : '제한 없음'} />
          <ListRow label="소진 후 속도" value={plan.speed_after ?? '제한 없음'} last />
          <div
            className="flex rounded-xl mt-3"
            style={{ padding: '12px 16px', background: 'var(--bg\\/default)' }}
          >
            <p className="body-small-medium" style={{ color: 'var(--text\\/secondary)' }}>
              {dataConditionText()}
            </p>
          </div>
        </div>
      </div>

      <div
        className="shrink-0 w-full flex flex-col gap-3 px-4"
        style={{ paddingTop: 16, paddingBottom: 32, background: 'var(--bg\\/surface)', borderTop: '1px solid var(--border\\/subtle)', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
      >
        <div className="flex items-center w-full">
          <p className="flex-1 body-small-medium" style={{ color: 'var(--text\\/secondary)' }}>월 납부 금액</p>
          <p className="subtitle-bold" style={{ color: 'var(--text\\/primary)', whiteSpace: 'nowrap' }}>
            월 {formatPrice(plan.promo_price)}
          </p>
        </div>
        <PrimaryButton onClick={onChangeClick}>이 요금제로 변경하기</PrimaryButton>
      </div>
    </MobileShell>
  );
}

// ─── Confirm Screen ───────────────────────────────────────────────────────────

function ConfirmScreen({
  plan,
  onBack,
  onApply,
  onOtherPlans,
}: {
  plan: Plan;
  onBack: () => void;
  onApply: () => void;
  onOtherPlans: () => void;
}) {
  return (
    <MobileShell bg="var(--bg\\/surface)">
      <Header title="변경 전 확인" onBack={onBack} />
      <div className="flex-1 overflow-y-auto" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          className="flex flex-col rounded-xl"
          style={{ padding: '8px 16px', background: 'var(--bg\\/default)' }}
        >
          <ListRow label="선택한 요금제" value={plan.name} />
          <ListRow label="매달 내는 돈" value={formatPrice(plan.promo_price)} />
          <ListRow label="24개월 후 월 요금" value={formatPrice(plan.regular_price)} last />
        </div>

        <div className="flex flex-col">
          <p className="body-strong" style={{ color: 'var(--text\\/primary)', marginBottom: 4 }}>변경 전 안내</p>
          {[
            {
              title: '이번 달 요금',
              desc: '이번 달 요금은 변경이 처리되는 날짜에 따라 달라질 수 있어요. 정확한 금액은 다음 달 청구서에서 확인할 수 있어요.',
            },
            {
              title: '위약금',
              desc: '약정 기간 중에 요금제를 바꾸면 위약금이 생길 수 있어요. 약정이 끝났다면 위약금 없이 바꿀 수 있어요.',
            },
            {
              title: '유심 교체',
              desc: '요금제만 바꾸는 경우 지금 쓰는 유심을 그대로 쓸 수 있어요.',
            },
          ].map(({ title, desc }, i, arr) => (
            <div
              key={title}
              className="flex flex-col gap-2 py-4"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border\\/subtle)' : 'none' }}
            >
              <p className="body-strong" style={{ color: 'var(--text\\/primary)' }}>{title}</p>
              <p className="body-small-medium" style={{ color: 'var(--text\\/secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
      <BottomCTA>
        <PrimaryButton onClick={onApply}>신청하기</PrimaryButton>
        <SecondaryButton onClick={onOtherPlans}>다른 요금제 보기</SecondaryButton>
      </BottomCTA>
    </MobileShell>
  );
}

// ─── Privacy Bottom Sheet ─────────────────────────────────────────────────────

function PrivacyBottomSheet({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] flex flex-col rounded-t-3xl"
        style={{ background: 'var(--bg\\/surface)', padding: '24px 16px 40px', maxHeight: '70vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="subtitle-bold" style={{ color: 'var(--text\\/primary)' }}>
            개인정보 수집·이용 동의
          </p>
          <button onClick={onClose} aria-label="닫기">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {[
          { title: '수집 항목', desc: '이름, 휴대폰 번호' },
          { title: '이용 목적', desc: '요금제 변경 신청 처리' },
          { title: '보관 기간', desc: '신청일로부터 3년' },
        ].map(({ title, desc }) => (
          <div key={title} className="flex flex-col gap-1 mb-4">
            <p className="body-small-strong" style={{ color: 'var(--text\\/primary)' }}>{title}</p>
            <p className="body-small-medium" style={{ color: 'var(--text\\/secondary)' }}>{desc}</p>
          </div>
        ))}
        <div style={{ marginTop: 8 }}>
          <PrimaryButton onClick={onClose}>확인</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

// ─── Apply Screen ─────────────────────────────────────────────────────────────

function ApplyScreen({
  plan,
  onCancel,
  onComplete,
}: {
  plan: Plan;
  onCancel: () => void;
  onComplete: (sub: Subscription) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const phoneDigits = phone.replace(/\D/g, '');
  const phoneValid = /^010\d{8}$/.test(phoneDigits);
  const canSubmit = name.trim().length >= 1 && phoneValid && agreed;

  function handleNameBlur() {
    if (!name.trim()) setNameError('이름을 입력해 주세요.');
    else setNameError('');
  }

  function handlePhoneBlur() {
    if (phone && !phoneValid) setPhoneError('휴대폰 번호 11자리를 정확히 입력해 주세요.');
    else setPhoneError('');
  }

  function handlePhoneChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 11);
    setPhone(formatPhoneInput(digits));
    if (phoneError && /^010\d{8}$/.test(digits)) setPhoneError('');
  }

  function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setTimeout(() => {
      const sub: Subscription = {
        id: crypto.randomUUID(),
        application_no: generateApplicationNo(),
        name: name.trim(),
        phone: phoneDigits,
        plan_id: plan.id,
        privacy_agreed: true,
        status: 'received',
        created_at: new Date().toISOString(),
      };
      onComplete(sub);
    }, 800);
  }

  return (
    <MobileShell bg="var(--bg\\/surface)">
      <Header
        title="변경 신청"
        rightAction={
          <button
            onClick={onCancel}
            className="body-medium"
            style={{ color: 'var(--text\\/secondary)' }}
          >
            취소
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <p className="heading-h3" style={{ color: 'var(--text\\/primary)' }}>
            신청 정보를{'\n'}입력해주세요
          </p>
        </div>

        <div
          className="flex flex-col rounded-xl"
          style={{ padding: '8px 16px', background: 'var(--bg\\/default)' }}
        >
          <ListRow label="선택한 요금제" value={plan.name} />
          <ListRow label="매달 내는 돈" value={formatPrice(plan.promo_price)} last />
        </div>

        <div className="flex flex-col gap-5">
          <InputField
            label="이름"
            value={name}
            onChange={(v) => {
              if (v.length > 20) { setNameError('이름은 20자까지 입력할 수 있어요.'); return; }
              setName(v);
              if (nameError && v.trim()) setNameError('');
            }}
            onBlur={handleNameBlur}
            placeholder="이름"
            error={nameError}
            maxLength={20}
          />
          <InputField
            label="휴대폰 번호"
            value={phone}
            onChange={handlePhoneChange}
            onBlur={handlePhoneBlur}
            placeholder="010-0000-0000"
            error={phoneError}
            inputMode="numeric"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAgreed(!agreed)}
              className="shrink-0 flex items-center justify-center"
              aria-label="동의 체크박스"
              style={{ width: 24, height: 24 }}
            >
              {agreed ? (
                <img src={imgCheckboxActive} alt="" style={{ width: 24, height: 24 }} />
              ) : (
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  border: '2px solid var(--border\\/default)', background: 'var(--bg\\/surface)',
                }} />
              )}
            </button>
            <p className="flex-1 body-small-medium" style={{ color: 'var(--text\\/primary)' }}>
              [필수] 개인정보 수집·이용에 동의합니다
            </p>
            <button
              onClick={() => setShowPrivacy(true)}
              className="body-small-medium"
              style={{ color: 'var(--text\\/accent)', textDecoration: 'underline', whiteSpace: 'nowrap' }}
            >
              보기
            </button>
          </div>
        </div>
      </div>

      <BottomCTA>
        <PrimaryButton disabled={!canSubmit} loading={loading} onClick={handleSubmit}>
          신청 완료하기
        </PrimaryButton>
      </BottomCTA>

      {showPrivacy && <PrivacyBottomSheet onClose={() => setShowPrivacy(false)} />}
    </MobileShell>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className="fixed bottom-24 left-1/2 z-50 transition-all duration-300"
      style={{
        transform: `translateX(-50%) ${visible ? 'translateY(0)' : 'translateY(16px)'}`,
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
      }}
    >
      <div
        className="flex items-center px-4 rounded-xl"
        style={{ height: 44, background: 'var(--bg\\/inverse)' }}
      >
        <p className="body-small-medium" style={{ color: 'var(--text\\/on-dark)', whiteSpace: 'nowrap' }}>
          {message}
        </p>
      </div>
    </div>
  );
}

// ─── Complete Screen ───────────────────────────────────────────────────────────

function CompleteScreen({
  plan,
  subscription,
  onHome,
}: {
  plan: Plan;
  subscription: Subscription;
  onHome: () => void;
}) {
  const [toastVisible, setToastVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleCopy() {
    navigator.clipboard.writeText(subscription.application_no).catch(() => {});
    setToastVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToastVisible(false), 2000);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <MobileShell bg="var(--bg\\/surface)">
      <Header title="신청 완료" />
      <div className="flex-1 overflow-y-auto" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="flex flex-col items-center gap-3 py-6">
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 64, height: 64, background: 'var(--fill\\/primary)' }}
          >
            <img src={imgCheck} alt="" style={{ width: 30, height: 30 }} />
          </div>
          <p className="heading-h3" style={{ color: 'var(--text\\/primary)', textAlign: 'center' }}>
            요금제 변경 신청이 접수됐어요
          </p>
          <p className="body-small-medium" style={{ color: 'var(--text\\/secondary)', textAlign: 'center' }}>
            개통 안내는 문자로 보내드려요
          </p>
        </div>

        <div
          className="flex flex-col rounded-xl"
          style={{ paddingTop: 16, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, background: 'var(--bg\\/default)' }}
        >
          <p className="body-strong" style={{ color: 'var(--text\\/primary)', marginBottom: 0 }}>신청 내역</p>
          <ListRow
            label="신청 번호"
            valueEl={
              <div className="flex items-center gap-2">
                <p className="body-small-strong" style={{ color: 'var(--text\\/primary)' }}>
                  {subscription.application_no}
                </p>
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center px-2 rounded caption-small"
                  style={{ height: 28, background: 'var(--bg\\/subtle)', fontWeight: 600, color: 'var(--text\\/secondary)' }}
                >
                  복사
                </button>
              </div>
            }
          />
          <ListRow label="요금제" value={plan.name} />
          <ListRow label="매달 내는 돈" value={formatPrice(plan.promo_price)} />
          <ListRow label="이름" value={subscription.name} />
          <ListRow label="휴대폰 번호" value={maskPhone(subscription.phone)} />
          <ListRow label="신청 일시" value={formatDatetime(new Date(subscription.created_at))} />
          <ListRow
            label="처리 상태"
            valueEl={<Tag accent>접수 완료</Tag>}
            last
          />
        </div>

        <div
          className="flex gap-2 rounded-xl"
          style={{ padding: '12px 16px', background: 'var(--bg\\/default)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10" stroke="var(--text\\/tertiary)" strokeWidth="2" />
            <path d="M12 8v4M12 16h.01" stroke="var(--text\\/tertiary)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="caption-medium" style={{ color: 'var(--text\\/tertiary)' }}>
            이 화면을 닫으면 신청 내용을 다시 조회할 수 없어요. 신청 번호를 복사해 두세요.
          </p>
        </div>
      </div>

      <BottomCTA>
        <PrimaryButton onClick={onHome}>처음으로</PrimaryButton>
      </BottomCTA>

      <Toast message="신청 번호를 복사했어요." visible={toastVisible} />
    </MobileShell>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'plans', filter: 'all' });

  if (screen.name === 'plans') {
    return (
      <PlanListScreen
        initialFilter={screen.filter}
        onSelectPlan={(plan, filter) => setScreen({ name: 'detail', planId: plan.id, fromFilter: filter })}
      />
    );
  }

  if (screen.name === 'detail') {
    const plan = PLANS.find((p) => p.id === screen.planId)!;
    return (
      <PlanDetailScreen
        plan={plan}
        onBack={() => setScreen({ name: 'plans', filter: screen.fromFilter })}
        onChangeClick={() => setScreen({ name: 'confirm', planId: screen.planId, fromFilter: screen.fromFilter })}
      />
    );
  }

  if (screen.name === 'confirm') {
    const plan = PLANS.find((p) => p.id === screen.planId)!;
    return (
      <ConfirmScreen
        plan={plan}
        onBack={() => setScreen({ name: 'detail', planId: screen.planId, fromFilter: screen.fromFilter })}
        onApply={() => setScreen({ name: 'apply', planId: screen.planId, fromFilter: screen.fromFilter })}
        onOtherPlans={() => setScreen({ name: 'plans', filter: screen.fromFilter })}
      />
    );
  }

  if (screen.name === 'apply') {
    const plan = PLANS.find((p) => p.id === screen.planId)!;
    return (
      <ApplyScreen
        plan={plan}
        onCancel={() => setScreen({ name: 'detail', planId: screen.planId, fromFilter: screen.fromFilter })}
        onComplete={(sub) => setScreen({ name: 'complete', subscription: sub, plan })}
      />
    );
  }

  if (screen.name === 'complete') {
    return (
      <CompleteScreen
        plan={screen.plan}
        subscription={screen.subscription}
        onHome={() => setScreen({ name: 'plans', filter: 'all' })}
      />
    );
  }

  return null;
}
