# Harold Web - AI 선박유 거래 대시보드

Harold 시스템의 웹 관리 대시보드입니다. 실시간 거래 모니터링, AI 제안 승인/거부, 채팅 관리 기능을 제공합니다.

---

## 주요 기능

### 1. 3-Column Deal 모달
- **Buyer Chat | AI Assistant | Seller Chats** 3열 레이아웃
- **실시간 메시지 동기화** (SSE 기반)
- **AI 제안 승인/거부** (옵션 선택, 메시지 수정 가능)
- **Full Context** 세션 정보 (완성도 표시, 누락 필드 클릭 시 질문 전송)
- **메시지 방향 구분** (우리 메시지 오른쪽, 상대방 메시지 왼쪽)

### 2. 실시간 거래 대시보드
- **SSE 스트리밍** (Server-Sent Events)으로 실시간 거래 업데이트
- **거래 통계** (진행 중, 완료, 거부 등)
- **거래 타임라인** 시각화
- **CSV/PDF 내보내기**

### 3. AI 제안 관리
- **제안 확장/축소** (첫 번째 제안 자동 확장)
- **옵션 선택** (여러 제안 중 선택 가능)
- **메시지 편집** (전송 전 수정 가능)
- **액션 타입별 전송**:
  - `send_to_suppliers`: 여러 판매자에게 동시 전송
  - `reply_to_customer`: 구매자에게 응답
  - `send_multiple`: 타겟별 다른 메시지 전송

### 4. Full Context 설정 관리
- **필드 정의** (vessel_name, port, delivery_date 등)
- **세션 단계** 관리 (initial_inquiry, quote_requested 등)
- **질문 템플릿** 편집

---

## 기술 스택

- **Framework**: Next.js 16.0.3 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5
- **상태 관리**: React Context API + React Query (TanStack Query)
- **UI**: Tailwind CSS + Shadcn/ui
- **실시간 통신**: Server-Sent Events (SSE)
- **차트**: Recharts
- **PDF 생성**: jsPDF + jspdf-autotable
- **날짜 처리**: date-fns (한국어 로케일)

---

## 시스템 아키텍처

```
[Harold Backend API]
    ↓ (SSE)
[SSEConnectionManager] (Singleton)
    ↓
[React Context] (DealModalContext)
    ↓
[3-Column Modal]
├─ Buyer Chat (구매자 채팅)
├─ AI Assistant (제안 승인/거부)
└─ Seller Chats (판매자 채팅 탭)
```

---

## 설치 및 실행

### 1. 환경 변수 설정

```bash
# .env.local 파일 생성
NEXT_PUBLIC_API_URL=http://220.76.122.226:59234
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

### 4. 프로덕션 빌드

```bash
npm run build
npm start
```

---

## 프로젝트 구조

```
harold-web/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── dashboard/                 # 대시보드 페이지
│   │   ├── chats/                     # 채팅 페이지
│   │   ├── analytics/                 # 분석 페이지
│   │   └── settings/fullcontext/      # Full Context 설정
│   ├── components/
│   │   ├── dashboard/                 # 대시보드 컴포넌트
│   │   │   ├── DealDetailModal3Column.tsx  # 3열 모달 (핵심)
│   │   │   ├── DealTable.tsx          # 거래 테이블
│   │   │   ├── DealStatistics.tsx     # 통계
│   │   │   └── ExportButtons.tsx      # CSV/PDF 내보내기
│   │   ├── layout/                    # 레이아웃 컴포넌트
│   │   └── ui/                        # Shadcn/ui 컴포넌트
│   ├── contexts/
│   │   └── DealModalContext.tsx       # 3열 모달 상태 관리
│   ├── hooks/
│   │   ├── useDealsSSE.ts             # 거래 SSE 훅
│   │   ├── useSessionMessagesSSE.ts   # 세션 메시지 SSE 훅
│   │   └── useSSEManager.ts           # SSE 매니저 훅
│   ├── lib/
│   │   ├── api/                       # API 클라이언트
│   │   │   ├── endpoints.ts           # 엔드포인트 정의
│   │   │   └── queries.ts             # React Query hooks
│   │   ├── sse/
│   │   │   └── SSEConnectionManager.ts # SSE Singleton
│   │   └── fullcontext/
│   │       └── config.ts              # Full Context 설정
│   └── types/
│       └── index.ts                   # TypeScript 타입 정의
├── public/
│   └── SP_logo.png                    # 씨너지파트너 로고
├── .env.local                         # 환경 변수
└── package.json
```

---

## 주요 컴포넌트 설명

### DealDetailModal3Column
3열 레이아웃 모달의 핵심 컴포넌트입니다.

**기능**:
- 구매자/판매자 채팅 실시간 표시
- AI 제안 승인/거부 (옵션 선택, 메시지 편집)
- Full Context 세션 정보 표시
- 누락 필드 클릭 시 자동 질문 전송

**상태 관리**:
- `DealModalContext`로 복잡한 상태 격리
- SSE로 실시간 메시지 업데이트
- Platform 변환 맵 (`com.kakao.talk` → `kakao`)

### SSEConnectionManager
SSE 연결을 관리하는 Singleton 클래스입니다.

**특징**:
- 단일 연결 유지 (메모리 효율성)
- 자동 재연결 (네트워크 끊김 대응)
- 이벤트 리스너 관리

---

## API 엔드포인트

### 거래 관리
- `GET /trading-sessions` - 거래 목록
- `GET /trading-sessions/:id` - 거래 상세
- `GET /messages/buyer/:sessionId` - 구매자 메시지
- `GET /messages/seller/:sessionId/:traderName` - 판매자 메시지

### AI 제안
- `GET /ai-suggestions/session/:sessionId` - 세션별 제안
- `POST /ai-suggestions/approve` - 제안 승인
- `POST /ai-suggestions/reject` - 제안 거부

### 메시지 전송
- `POST /send-message` - 메시지 전송

### SSE
- `GET /sse/deals` - 거래 실시간 스트림
- `GET /sse/session-messages/:sessionId` - 세션 메시지 스트림

---

## 개발 팁

### SSE 디버깅
```typescript
// SSEConnectionManager 로그 확인
const manager = SSEConnectionManager.getInstance();
console.log(manager.getConnectionStatus());
```

### Context API 사용
```typescript
import { useDealModal } from '@/contexts/DealModalContext';

const { buyerMessages, sellerMessages, aiSuggestions } = useDealModal();
```

### React Query 캐싱
```typescript
import { useQuery } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['deals'],
  queryFn: () => fetch('/api/trading-sessions').then(r => r.json())
});
```

---

## 배포

### Vercel 배포 (권장)
```bash
vercel --prod
```

### 일반 서버 배포
```bash
npm run build
npm start
# PM2로 프로세스 관리 권장
pm2 start npm --name "harold-web" -- start
```

---

## 라이선스

Private - Seanergy Partners

---

## 문의

개발 관련 문의: Seanergy Partners 개발팀
