/**
 * FullContext Configuration
 * 단계별 필수/선택 필드와 질문 템플릿 정의
 *
 * 이 설정은 설정 관리 UI에서 수정 가능하며,
 * 수정사항은 localStorage에 저장됩니다.
 */

export type SessionPhase = 'pre_deal' | 'deal_inquiry' | 'deal_negotiation' | 'deal_confirmation' | 'post_deal'

export interface FieldDefinition {
  name: string
  label: string
  description?: string
  type: 'text' | 'number' | 'date' | 'select'
  options?: string[] // select 타입일 때
}

export interface PhaseDefinition {
  name: SessionPhase
  label: string
  description: string
  required: string[]
  optional: string[]
}

export interface QuestionTemplate {
  field: string
  buyerQuestion: string
  sellerQuestion: string
  priority: number
}

export interface FullContextConfig {
  version: string
  lastModified: string

  // 필드 정의
  fields: Record<string, FieldDefinition>

  // 단계별 정의
  phases: Record<SessionPhase, PhaseDefinition>

  // 질문 템플릿
  questions: Record<string, QuestionTemplate>
}

// 기본 설정 - 나중에 수정 가능
export const DEFAULT_FULLCONTEXT_CONFIG: FullContextConfig = {
  version: '1.0.0',
  lastModified: new Date().toISOString(),

  fields: {
    vessel_name: {
      name: 'vessel_name',
      label: '선박명',
      description: '거래 대상 선박의 이름',
      type: 'text'
    },
    port: {
      name: 'port',
      label: '항구',
      description: '연료 공급 항구',
      type: 'text'
    },
    delivery_date: {
      name: 'delivery_date',
      label: '배송일',
      description: '연료 배송 희망일',
      type: 'date'
    },
    fuel_type: {
      name: 'fuel_type',
      label: '연료 종류',
      description: '필요한 연료 타입',
      type: 'select',
      options: ['VLSFO', 'MGO', 'HSFO', 'LSMGO', 'ULSFO']
    },
    quantity: {
      name: 'quantity',
      label: '수량',
      description: '필요 수량 (MT)',
      type: 'number'
    },
    eta: {
      name: 'eta',
      label: 'ETA',
      description: '선박 도착 예정 시간',
      type: 'date'
    },
    agent: {
      name: 'agent',
      label: '에이전트',
      description: '거래 에이전트 정보',
      type: 'text'
    },
    price_range: {
      name: 'price_range',
      label: '희망 가격대',
      description: '톤당 희망 가격 범위',
      type: 'text'
    },
    payment_terms: {
      name: 'payment_terms',
      label: '결제 조건',
      description: '결제 조건 및 기한',
      type: 'text'
    },
    vis_guarantee: {
      name: 'vis_guarantee',
      label: 'VIS 개런티',
      description: 'VIS 품질 보증 여부',
      type: 'select',
      options: ['필요', '불필요', '협의 필요']
    },
    early_date: {
      name: 'early_date',
      label: '얼리 날짜',
      description: '가장 빠른 공급 가능일',
      type: 'date'
    },
    invoice_number: {
      name: 'invoice_number',
      label: '인보이스 번호',
      description: '거래 인보이스 번호',
      type: 'text'
    },
    delivery_confirmation: {
      name: 'delivery_confirmation',
      label: '배송 확인',
      description: '배송 완료 확인 여부',
      type: 'select',
      options: ['완료', '진행중', '미완료']
    }
  },

  phases: {
    pre_deal: {
      name: 'pre_deal',
      label: '딜 전',
      description: '거래 전 문의/탐색 단계',
      required: [],
      optional: ['vessel_name', 'port']
    },
    deal_inquiry: {
      name: 'deal_inquiry',
      label: '인쿼리',
      description: '인쿼리 수신 및 기본 정보 수집',
      required: ['vessel_name', 'port', 'delivery_date', 'fuel_type', 'quantity'],
      optional: ['eta', 'agent']
    },
    deal_negotiation: {
      name: 'deal_negotiation',
      label: '협상',
      description: '가격 협상 및 조건 조율',
      required: ['vessel_name', 'port', 'delivery_date', 'fuel_type', 'quantity', 'price_range'],
      optional: ['payment_terms', 'vis_guarantee', 'early_date']
    },
    deal_confirmation: {
      name: 'deal_confirmation',
      label: '확정',
      description: '거래 최종 확정 단계',
      required: ['vessel_name', 'port', 'delivery_date', 'fuel_type', 'quantity', 'price_range', 'payment_terms'],
      optional: ['vis_guarantee', 'early_date']
    },
    post_deal: {
      name: 'post_deal',
      label: '딜 후',
      description: '거래 후 정산 및 확인',
      required: ['invoice_number', 'delivery_confirmation'],
      optional: []
    }
  },

  questions: {
    vessel_name: {
      field: 'vessel_name',
      buyerQuestion: '선박명을 알려주세요',
      sellerQuestion: '어떤 배의 견적인가요?',
      priority: 1
    },
    port: {
      field: 'port',
      buyerQuestion: '어느 항구에서 필요하신가요?',
      sellerQuestion: '어느 항구 견적을 원하시나요?',
      priority: 2
    },
    delivery_date: {
      field: 'delivery_date',
      buyerQuestion: '언제까지 배송받기 원하시나요?',
      sellerQuestion: '배송 희망일이 언제인가요?',
      priority: 3
    },
    fuel_type: {
      field: 'fuel_type',
      buyerQuestion: '어떤 종류의 연료가 필요하신가요? (예: VLSFO, MGO)',
      sellerQuestion: '어떤 연료 종류의 견적을 원하시나요?',
      priority: 4
    },
    quantity: {
      field: 'quantity',
      buyerQuestion: '필요한 수량을 알려주세요 (MT 단위)',
      sellerQuestion: '필요한 수량이 얼마나 되나요?',
      priority: 5
    },
    eta: {
      field: 'eta',
      buyerQuestion: '선박 도착 예정 시간(ETA)을 알려주세요',
      sellerQuestion: '선박 ETA가 언제인가요?',
      priority: 6
    },
    agent: {
      field: 'agent',
      buyerQuestion: '에이전트 정보가 있으신가요?',
      sellerQuestion: '에이전트는 누구인가요?',
      priority: 7
    },
    price_range: {
      field: 'price_range',
      buyerQuestion: '희망하시는 가격대가 있으신가요?',
      sellerQuestion: '톤당 가격을 알려주세요',
      priority: 8
    },
    payment_terms: {
      field: 'payment_terms',
      buyerQuestion: '결제 조건을 알려주세요',
      sellerQuestion: '결제 조건이 어떻게 되나요?',
      priority: 9
    },
    vis_guarantee: {
      field: 'vis_guarantee',
      buyerQuestion: 'VIS 개런티가 필요하신가요?',
      sellerQuestion: 'VIS 개런티 제공이 가능한가요?',
      priority: 10
    },
    early_date: {
      field: 'early_date',
      buyerQuestion: '가장 빠른 공급 가능일이 언제인가요?',
      sellerQuestion: '얼리(Early) 날짜가 언제인가요?',
      priority: 11
    },
    invoice_number: {
      field: 'invoice_number',
      buyerQuestion: '인보이스 번호를 알려주세요',
      sellerQuestion: '인보이스 번호가 무엇인가요?',
      priority: 12
    },
    delivery_confirmation: {
      field: 'delivery_confirmation',
      buyerQuestion: '배송이 완료되었나요?',
      sellerQuestion: '배송 상태를 확인해주세요',
      priority: 13
    }
  }
}

// localStorage 키
const STORAGE_KEY = 'harold_fullcontext_config'

/**
 * 현재 설정을 가져옵니다.
 * localStorage에 저장된 설정이 있으면 사용, 없으면 기본값 사용
 */
export function getFullContextConfig(): FullContextConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_FULLCONTEXT_CONFIG
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as FullContextConfig
      // 버전 체크 등 마이그레이션 로직 추가 가능
      return parsed
    }
  } catch (error) {
    console.error('Failed to load FullContext config:', error)
  }

  return DEFAULT_FULLCONTEXT_CONFIG
}

/**
 * 설정을 저장합니다.
 */
export function saveFullContextConfig(config: FullContextConfig): void {
  if (typeof window === 'undefined') return

  try {
    const updated = {
      ...config,
      lastModified: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save FullContext config:', error)
  }
}

/**
 * 설정을 기본값으로 초기화합니다.
 */
export function resetFullContextConfig(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 특정 단계의 필드 목록을 가져옵니다.
 */
export function getPhaseFields(phase: SessionPhase): {
  required: FieldDefinition[]
  optional: FieldDefinition[]
} {
  const config = getFullContextConfig()
  const phaseConfig = config.phases[phase]

  return {
    required: phaseConfig.required
      .map(name => config.fields[name])
      .filter(Boolean),
    optional: phaseConfig.optional
      .map(name => config.fields[name])
      .filter(Boolean)
  }
}

/**
 * 필드의 질문을 가져옵니다.
 */
export function getFieldQuestion(
  field: string,
  direction: 'buyer' | 'seller'
): string {
  const config = getFullContextConfig()
  const question = config.questions[field]

  if (!question) {
    const fieldDef = config.fields[field]
    return direction === 'buyer'
      ? `${fieldDef?.label || field}을(를) 알려주세요`
      : `${fieldDef?.label || field}이(가) 어떻게 되나요?`
  }

  return direction === 'buyer' ? question.buyerQuestion : question.sellerQuestion
}