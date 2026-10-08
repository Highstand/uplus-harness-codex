# Design System

이 문서는 Figma 파일의 로컬 변수, 텍스트 스타일, `Components` 섹션을 기준으로 작성한 구현 가이드다. 값은 각 컬렉션의 `Default` 모드를 사용한다. 이름이 `_`로 시작하는 컴포넌트는 제외했다.

## 1. 색 팔레트

색상은 화면 요소에 primitive 색을 직접 적용하지 않고 semantic 토큰을 적용한다.

### Text

| 토큰 | 값 | 쓰는 곳 |
|---|---:|---|
| `text/primary` | `#181A1B` | 제목, 본문 등 가장 중요한 텍스트 |
| `text/secondary` | `#66707A` | 보조 설명, 부가 정보 |
| `text/tertiary` | `#878787` | 우선순위가 낮은 메타 정보 |
| `text/on-dark` | `#FFFFFF` | 어두운 배경 위 텍스트 |
| `text/accent` | `#FF2E98` | 강조 텍스트, 활성 상태 |
| `text/error` | `#E30036` | 오류 및 주의 메시지 |
| `text/placeholder` | `#B7BDC4` | 입력 전 placeholder |
| `text/on-disabled` | `#66707A` | 비활성 배경 위 텍스트 |

### Background / Surface

| 토큰 | 값 | 쓰는 곳 |
|---|---:|---|
| `bg/surface` | `#FFFFFF` | 카드, 입력 영역 등 전경 표면 |
| `bg/default` | `#F7F7F7` | 기본 화면 배경 |
| `bg/subtle` | `#EFF1F3` | 약한 구분 영역, 중립 상태 배경 |
| `bg/inverse` | `#2D2D2D` | 역상 또는 강한 대비 배경 |
| `bg/accent-subtle` | `#FFF5FA` | 선택·강조의 옅은 배경 |
| `bg/error-subtle` | `#FFF0F3` | 오류·주의의 옅은 배경 |
| `surface/default` | `#FFFFFF` | 독립된 기본 표면 |

### Border

| 토큰 | 값 | 쓰는 곳 |
|---|---:|---|
| `border/default` | `#D9DCDF` | 입력 필드와 카드의 기본 테두리 |
| `border/subtle` | `#EFF1F3` | 약한 경계 |
| `border/medium` | `#66707A` | 중간 강도의 경계 |
| `border/strong` | `#181A1B` | 선택 또는 강한 구분 |
| `border/divider` | `#0000001A` | 목록·영역 구분선 |
| `border/focus` | `#FF2E98` | 키보드·입력 focus 표시 |
| `border/error` | `#E30036` | 오류 상태 테두리 |

### Fill

| 토큰 | 값 | 쓰는 곳 |
|---|---:|---|
| `fill/primary` | `#FF2E98` | 주요 액션, 선택 표시 |
| `fill/primary-hover` | `#E6007E` | 주요 액션 hover 상태 |
| `fill/secondary` | `#181A1B` | 보조 강조 채움 |
| `fill/tertiary` | `#EFF1F3` | 중립적이고 낮은 강조 채움 |
| `fill/disabled` | `#D9DCDF` | 비활성 컨트롤 배경 |
| `fill/disabled-strong` | `#B7BDC4` | 비활성 상태의 강한 표시 |

### Icon

| 토큰 | 값 | 쓰는 곳 |
|---|---:|---|
| `icon/primary` | `#000000` | 가장 중요한 아이콘 |
| `icon/strong` | `#181A1B` | 높은 강조의 일반 아이콘 |
| `icon/default` | `#66707A` | 기본 아이콘 |
| `icon/accent` | `#FF2E98` | 선택·강조 아이콘 |
| `icon/on-dark` | `#FFFFFF` | 어두운 배경 위 아이콘 |
| `icon/disabled` | `#D9DCDF` | 비활성 아이콘 |
| `icon/error` | `#E30036` | 오류·주의 아이콘 |

### Brand

| 토큰 | 값 | 쓰는 곳 |
|---|---:|---|
| `brand/primary` | `#FF2E98` | 브랜드를 직접 나타내는 핵심 강조 요소 |

### 적용 원칙

- 색상 역할이 같으면 컴포넌트가 달라도 같은 semantic 토큰을 사용한다.
- 상태 변화는 역할 토큰으로 표현한다. 예: 기본 테두리 → `border/focus` 또는 `border/error`.
- `brand/primary`는 브랜드 표현에, `fill/primary`는 인터랙션에 사용해 역할을 구분한다.
- 반투명 구분선은 `border/divider`의 알파 값을 그대로 유지한다.

## 2. 타이포 스케일

기본 서체는 `Pretendard Variable`이다. 로컬 텍스트 스타일의 자간은 모두 `0%`다.

| 텍스트 스타일 | 크기 / 줄높이 | 굵기 | 쓰는 곳 |
|---|---:|---|---|
| `heading/h1` | 32 / 44px | Bold (700) | 화면의 최상위 제목 |
| `heading/h2` | 28 / 40px | Bold (700) | 주요 섹션 제목 |
| `heading/h3` | 24 / 32px | Bold (700) | 하위 섹션 제목 |
| `heading/h4` | 20 / 28px | Medium (500) | 작은 영역 제목, 카드 제목 |
| `subtitle/bold` | 18 / 26px | Bold (700) | 강한 부제목 |
| `subtitle/default` | 18 / 26px | SemiBold (600) | 기본 부제목 |
| `body/strong` | 16 / 24px | SemiBold (600) | 강조 본문, 주요 레이블 |
| `body/medium` | 16 / 24px | Medium (500) | 기본 본문 |
| `body/small-strong` | 14 / 21px | SemiBold (600) | 작은 강조 본문, 컨트롤 레이블 |
| `body/small-medium` | 14 / 21px | Medium (500) | 작은 본문, 보조 설명 |
| `caption/bold` | 13 / 18px | Bold (700) | 강조 캡션 |
| `caption/medium` | 13 / 18px | Medium (500) | 기본 캡션, 메타 정보 |
| `caption/small-bold` | 12 / 16px | Bold (700) | 작은 강조 레이블 |
| `caption/small` | 12 / 16px | Medium (500) | 작은 보조 정보 |
| `caption/mini` | 10 / 14px | SemiBold (600) | 제한된 영역의 최소 레이블 |

### 적용 원칙

- 텍스트 노드에는 크기와 굵기를 개별 지정하지 않고 대응하는 텍스트 스타일을 적용한다.
- 한 화면의 제목 계층은 단계를 건너뛰지 않는다.
- 본문은 기본적으로 `body/medium`, 강조가 필요할 때만 같은 크기의 `strong` 스타일을 사용한다.
- 캡션은 부가 정보에만 사용하며 본문을 대체하지 않는다.

## 3. 간격·레이아웃

### 간격 토큰

| 토큰 | 값 | 권장 용도 |
|---|---:|---|
| `spacing/4` | 4px | 밀접한 텍스트·아이콘 내부 간격 |
| `spacing/8` | 8px | 컨트롤 내부 요소, 나란한 버튼 사이 |
| `spacing/10` | 10px | 예외적으로 필요한 작은 내부 간격 |
| `spacing/12` | 12px | 관련 요소 묶음, 세로 스택 |
| `spacing/16` | 16px | 화면 좌우 여백, 카드 간 기본 간격 |
| `spacing/20` | 20px | 카드·입력 영역 내부 여백 |
| `spacing/24` | 24px | 섹션 내부 그룹 간격 |
| `spacing/32` | 32px | 큰 그룹 및 하단 안전 여백 |
| `spacing/40` | 40px | 주요 섹션 구분 |
| `spacing/48` | 48px | 큰 콘텐츠 블록 구분 |
| `spacing/80` | 80px | 최상위 영역의 큰 분리 |

### Radius 토큰

| 토큰 | 값 | 권장 용도 |
|---|---:|---|
| `radius/4` | 4px | 작은 표시 요소 |
| `radius/8` | 8px | 작은 컨트롤 |
| `radius/12` | 12px | 입력 필드, 일반 컨트롤 |
| `radius/16` | 16px | 카드와 큰 컨트롤 |
| `radius/20` | 20px | 강조 카드 |
| `radius/24` | 24px | 큰 컨테이너 |
| `radius/32` | 32px | 큰 프로모션 영역 |
| `radius/full` | 9999px | 원형·pill 형태 |

### 390 × 844 모바일 기준

- 기준 viewport는 `390 × 844px`이다.
- 화면 좌우 기본 padding은 `16px`이며, 기본 콘텐츠 폭은 `358px`이다.
- 상단 `Header` 높이는 `56px`, 좌우 padding은 `16px`이다.
- 본문은 세로 Auto Layout을 기본으로 하고, 가까운 요소는 `8–12px`, 기본 그룹은 `16px`, 큰 그룹은 `24–40px` 간격을 사용한다.
- 전체 폭 카드·입력·진행 표시에는 `358px` 콘텐츠 폭을 사용한다.
- 하단 고정 액션 영역은 화면 폭 `390px`를 사용한다. 단일·이중 액션은 높이 `97px`, 추가 요약 행이 있으면 `139px`다.
- 하단 고정 영역은 좌우 `16px`, 상단 `12–16px`, 하단 `32px`의 안전 여백을 유지한다.
- 상단과 하단을 고정하면 본문 가용 높이는 기본 액션에서 `691px`, 추가 요약 행이 있는 액션에서 `649px`다. 넘치는 본문만 세로 스크롤한다.
- 최소 컨트롤 높이는 `40px`로 두고, 주요 버튼은 `48px` 또는 `52px`를 사용한다.
- 화면 바깥 장식이 아닌 콘텐츠는 좌우 16px 안전 영역을 침범하지 않는다.

## 4. 컴포넌트 용법

아래 속성 이름에서 `Text`는 인스턴스 텍스트 교체, `Boolean`은 하위 요소 표시 여부, `Variant`는 정의된 상태 전환을 뜻한다. 예시 콘텐츠 값은 문서 범위에서 제외한다.

### 입력·선택

#### `Input`

- 변형: `State = default | focus | filled | caution | disabled`
- 속성: `errorMessage` (Boolean), `State` (Variant)
- 크기: 기본 `358 × 58px`, 주의 메시지 노출 시 `358 × 90px`
- 규칙: 입력 전에는 `default`, 활성 입력 중에는 `focus`, 값이 있으면 `filled`, 검증 실패 시 `caution`, 조작 불가 시 `disabled`를 사용한다. 오류 메시지는 오류 상태에서만 노출한다.

#### `Checkbox`

- 변형: `State = default | active`
- 크기: `24 × 24px`
- 규칙: 독립적인 다중 선택에 사용한다. 단일 선택에는 체크박스 대신 단일 선택 패턴을 사용한다.

#### `OptionItem`

- 변형: `State = default | selected`
- 속성: `Title` (Text), `Desc` (Text), `State` (Variant)
- 크기: 기본 `358 × 83px`, 선택 `358 × 86px`
- 규칙: 설명을 포함한 단일 선택 항목에 사용한다. 같은 선택 그룹에서는 한 항목만 `selected`로 둔다.

#### `FilterChip`

- 변형: `State = default | selected`
- 속성: `Label` (Text), `State` (Variant)
- 크기: 높이 `40px`, 내용에 따라 너비 Hug
- 규칙: 조건 또는 정렬의 빠른 선택에 사용한다. 같은 단일 선택 그룹에서는 한 항목만 `selected`로 둔다.

### 액션

#### `Button`

- 변형: `Type = Primary | Secondary`, `Size = sm | lg | xl`, `State = Default | Hover | Disabled`
- 속성: `Label` (Text), `Type`, `Size`, `State` (Variant)
- 높이: `sm 40px`, `lg 48px`, `xl 52px`
- 규칙: 화면의 핵심 액션은 `Primary`, 보조 액션은 `Secondary`를 사용한다. 한 영역에서 Primary를 경쟁적으로 여러 개 배치하지 않는다. 사용할 수 없는 액션은 제거하지 말고 필요 시 `Disabled`로 상태를 명시한다.

#### `BottomCTA`

- 변형: `Layout = single | double | price`
- 속성: `Amount`, `AmountLabel` (Text), `Layout` (Variant)
- 크기: `single/double 390 × 97px`, `price 390 × 139px`
- 규칙: 화면 하단의 고정 액션에 사용한다. `single`은 핵심 액션 하나, `double`은 보조+핵심 액션, `price`는 요약 값과 핵심 액션이 함께 필요할 때 사용한다. 하단 `32px` 안전 여백을 유지한다.

### 내비게이션·진행

#### `Header`

- 변형: `Type = default | root`
- 속성: `Title` (Text), `Type` (Variant)
- 크기: `390 × 56px`
- 규칙: `default`는 이전 단계로 돌아갈 수 있는 일반 화면, `root`는 상위 진입점에 사용한다. 화면당 하나만 배치한다.

#### `StepProgress`

- 변형: `Step = 1 | 2 | 3`
- 크기: `358 × 30px`
- 규칙: 정해진 3단계 흐름의 현재 위치를 표시한다. 실제 진행 단계와 Variant를 항상 동기화한다.

#### `icon/arrowLeft`

- 변형·속성: 없음
- 크기: `24 × 24px`
- 규칙: 이전 위치로 이동하는 내비게이션 액션에 사용한다. 단독 터치 영역은 주변 컨테이너에서 최소 `40 × 40px`를 확보한다.

### 정보 표시

#### `List/Row`

- 변형: `Type = default | check`
- 속성: `Label`, `Value` (Text), `Type` (Variant)
- 크기: `358 × 46px`
- 규칙: `default`는 라벨과 값을 한 줄로 비교할 때, `check`는 포함 항목 또는 완료 항목을 표시할 때 사용한다. 같은 목록에서는 행의 좌우 정렬을 일관되게 유지한다.

#### `Card/Price`

- 변형·속성: 없음
- 크기: `358 × 124px`
- 규칙: 레이블, 강조 값, 보조 설명으로 구성된 수치 요약에 사용한다. 핵심 값은 하나만 강조한다.

#### `Card/Plan`

- 변형: `State = default | selected`
- 속성: `Name`, `Desc`, `Discount`, `Price`, `Original` (Text), `Badge`, `Promo`, `Sale` (Boolean), `State` (Variant)
- 크기: 기본 `358 × 223px`, 선택 `358 × 224px`
- 규칙: 여러 속성과 액션을 포함한 비교·선택 카드에 사용한다. 부가 정보가 없으면 `Badge`, `Promo`, `Sale`을 끈다. 선택 가능한 카드에서만 `selected`를 사용한다.

#### `Chip`

- 변형: `Type = benefit | package | sale`
- 크기: `benefit/package 20px`, `sale 24px` 높이
- 규칙: 짧은 범주 또는 상태 정보를 보조적으로 표시한다. 긴 문장이나 주요 액션에는 사용하지 않는다.

#### `Tag`

- 변형·속성: 없음
- 크기: 기본 `47 × 26px`, 내부 좌우 padding `12px`
- 규칙: 카드나 목록 항목의 짧은 분류·강조 레이블에 사용한다. 인터랙션이 필요한 경우 선택형 Chip을 사용한다.

#### `icon/check`

- 변형·속성: 없음
- 크기: `24 × 24px`
- 규칙: 완료, 포함, 유효 상태를 보조한다. 의미 전달을 아이콘 하나에만 의존하지 않는다.

#### `icon/doneMark`

- 변형·속성: 없음
- 크기: `64 × 64px`
- 규칙: 완료 상태를 대표하는 큰 확인 표시에 사용한다. 반복 목록의 작은 상태 표시에는 `icon/check`를 사용한다.

#### `Logo`

- 변형·속성: 없음
- 크기: `32 × 24px`
- 규칙: 브랜드 식별이 필요한 상단 영역에 원본 비율로 사용한다. 색상·비율·벡터 형상을 임의로 변경하지 않는다.

### 공통 사용 규칙

- 인스턴스 내부 레이어를 직접 편집하기보다 공개된 Text, Boolean, Variant 속성을 사용한다.
- 상태를 색상만으로 전달하지 않고 텍스트, 아이콘, 테두리 또는 형태 변화와 함께 표현한다.
- 동일한 역할에는 동일한 컴포넌트와 Variant를 재사용한다.
- 정의되지 않은 상태가 필요하면 기존 인스턴스를 임의 수정하지 말고 컴포넌트 정의에 Variant를 추가한다.
- 모바일 전체 폭 요소는 `390px` 화면에서 좌우 `16px`를 제외한 `358px` 폭을 우선 사용한다.
