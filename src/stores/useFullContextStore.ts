import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { SessionPhase } from './useTradingStore'

interface FullContextField {
  name: string
  label: string
  required: boolean
  value?: any
  completed: boolean
}

interface PhaseContext {
  required: string[]
  optional: string[]
}

interface SessionContext {
  sessionId: string
  phase: SessionPhase
  fields: Map<string, FullContextField>
  completionRate: number
  missingRequired: string[]
  missingOptional: string[]
}

interface QuestionTemplate {
  field: string
  buyerQuestion: string
  sellerQuestion: string
  priority: number
}

interface FullContextStore {
  // 단계별 컨텍스트 정의
  phaseDefinitions: Record<SessionPhase, PhaseContext>

  // 세션별 컨텍스트 상태
  contextBySession: Map<string, SessionContext>

  // 질문 템플릿
  questionTemplates: Map<string, QuestionTemplate>

  // 액션 - 컨텍스트 관리
  initializeSessionContext: (sessionId: string, phase: SessionPhase) => void
  updateFieldValue: (sessionId: string, field: string, value: any) => void
  validateContext: (sessionId: string) => { isValid: boolean; missing: string[] }

  // 액션 - 단계 전환
  transitionPhase: (sessionId: string, newPhase: SessionPhase) => void

  // 액션 - 질문 생성
  generateQuestion: (field: string, direction: 'buyer' | 'seller') => string
  getNextMissingField: (sessionId: string) => string | null

  // 헬퍼 함수
  getSessionContext: (sessionId: string) => SessionContext | undefined
  getCompletionRate: (sessionId: string) => number
  getMissingFields: (sessionId: string) => { required: string[], optional: string[] }
}

// 단계별 필수/선택 필드 정의
const PHASE_DEFINITIONS: Record<SessionPhase, PhaseContext> = {
  pre_deal: {
    required: [],
    optional: ['vessel_name', 'port']
  },
  deal_inquiry: {
    required: ['vessel_name', 'port', 'delivery_date', 'fuel_type', 'quantity'],
    optional: ['eta', 'agent', 'special_requirements']
  },
  deal_negotiation: {
    required: ['vessel_name', 'port', 'delivery_date', 'fuel_type', 'quantity', 'price_range'],
    optional: ['payment_terms', 'vis_guarantee', 'early_date', 'agent']
  },
deal_confirmation: {    required: ['vessel_name', 'port', 'delivery_date', 'fuel_type', 'quantity', 'price_range', 'payment_terms'],    optional: ['contract_number', 'delivery_confirmation']  },
  post_deal: {
    required: ['invoice_number', 'delivery_confirmation'],
    optional: ['feedback', 'rating']
  }
}

// 질문 템플릿 기본 데이터
const DEFAULT_QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    field: 'vessel_name',
    buyerQuestion: '선박명을 알려주세요',
    sellerQuestion: '어떤 배의 견적인가요?',
    priority: 1
  },
  {
    field: 'port',
    buyerQuestion: '어느 항구에서 필요하신가요?',
    sellerQuestion: '어느 항구 견적을 원하시나요?',
    priority: 2
  },
  {
    field: 'delivery_date',
    buyerQuestion: '언제까지 배송받기 원하시나요?',
    sellerQuestion: '배송 희망일이 언제인가요?',
    priority: 3
  },
  {
    field: 'fuel_type',
    buyerQuestion: '어떤 종류의 연료가 필요하신가요? (예: VLSFO, MGO)',
    sellerQuestion: '어떤 연료 종류의 견적을 원하시나요?',
    priority: 4
  },
  {
    field: 'quantity',
    buyerQuestion: '필요한 수량을 알려주세요 (MT 단위)',
    sellerQuestion: '필요한 수량이 얼마나 되나요?',
    priority: 5
  },
  {
    field: 'eta',
    buyerQuestion: '선박 도착 예정 시간(ETA)을 알려주세요',
    sellerQuestion: '선박 ETA가 언제인가요?',
    priority: 6
  },
  {
    field: 'agent',
    buyerQuestion: '에이전트 정보가 있으신가요?',
    sellerQuestion: '에이전트는 누구인가요?',
    priority: 7
  },
  {
    field: 'price_range',
    buyerQuestion: '희망하시는 가격대가 있으신가요?',
    sellerQuestion: '톤당 가격을 알려주세요',
    priority: 8
  },
  {
    field: 'payment_terms',
    buyerQuestion: '결제 조건을 알려주세요',
    sellerQuestion: '결제 조건이 어떻게 되나요?',
    priority: 9
  },
  {
    field: 'vis_guarantee',
    buyerQuestion: 'VIS 개런티가 필요하신가요?',
    sellerQuestion: 'VIS 개런티 제공이 가능한가요?',
    priority: 10
  },
  {
    field: 'early_date',
    buyerQuestion: '가장 빠른 공급 가능일이 언제인가요?',
    sellerQuestion: '얼리(Early) 날짜가 언제인가요?',
    priority: 11
  }
]

const useFullContextStore = create<FullContextStore>()(
  devtools(
    (set, get) => ({
      phaseDefinitions: PHASE_DEFINITIONS,
      contextBySession: new Map(),
      questionTemplates: new Map(DEFAULT_QUESTION_TEMPLATES.map(q => [q.field, q])),

      initializeSessionContext: (sessionId, phase) => {
        const phaseContext = PHASE_DEFINITIONS[phase]
        const fields = new Map<string, FullContextField>()

        // 필수 필드 초기화
        phaseContext.required.forEach(fieldName => {
          fields.set(fieldName, {
            name: fieldName,
            label: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            required: true,
            completed: false
          })
        })

        // 선택 필드 초기화
        phaseContext.optional.forEach(fieldName => {
          fields.set(fieldName, {
            name: fieldName,
            label: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            required: false,
            completed: false
          })
        })

        const sessionContext: SessionContext = {
          sessionId,
          phase,
          fields,
          completionRate: 0,
          missingRequired: phaseContext.required,
          missingOptional: phaseContext.optional
        }

        set((state) => ({
          contextBySession: new Map(state.contextBySession).set(sessionId, sessionContext)
        }))
      },

      updateFieldValue: (sessionId, field, value) => {
        set((state) => {
          const context = state.contextBySession.get(sessionId)
          if (!context) return state

          const fieldInfo = context.fields.get(field)
          if (!fieldInfo) return state

          // 필드 업데이트
          const updatedField = {
            ...fieldInfo,
            value,
            completed: value !== null && value !== undefined && value !== ''
          }
          context.fields.set(field, updatedField)

          // 완성도 재계산
          const requiredFields = Array.from(context.fields.values()).filter(f => f.required)
          const completedRequired = requiredFields.filter(f => f.completed).length
          const completionRate = requiredFields.length > 0
            ? (completedRequired / requiredFields.length) * 100
            : 100

          // 미완성 필드 재계산
          const missingRequired = Array.from(context.fields.entries())
            .filter(([_, f]) => f.required && !f.completed)
            .map(([name, _]) => name)

          const missingOptional = Array.from(context.fields.entries())
            .filter(([_, f]) => !f.required && !f.completed)
            .map(([name, _]) => name)

          const updatedContext = {
            ...context,
            completionRate,
            missingRequired,
            missingOptional
          }

          return {
            contextBySession: new Map(state.contextBySession).set(sessionId, updatedContext)
          }
        })
      },

      validateContext: (sessionId) => {
        const context = get().contextBySession.get(sessionId)
        if (!context) {
          return { isValid: false, missing: [] }
        }

        const missingRequired = Array.from(context.fields.entries())
          .filter(([_, field]) => field.required && !field.completed)
          .map(([name, _]) => name)

        return {
          isValid: missingRequired.length === 0,
          missing: missingRequired
        }
      },

      transitionPhase: (sessionId, newPhase) => {
        set((state) => {
          const currentContext = state.contextBySession.get(sessionId)
          if (!currentContext) return state

          const newPhaseContext = PHASE_DEFINITIONS[newPhase]
          const fields = new Map(currentContext.fields)

          // 새 단계의 필드 추가 (기존 값 유지)
          newPhaseContext.required.forEach(fieldName => {
            if (!fields.has(fieldName)) {
              fields.set(fieldName, {
                name: fieldName,
                label: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                required: true,
                completed: false
              })
            } else {
              // 기존 선택 필드가 필수로 변경된 경우
              const existing = fields.get(fieldName)!
              fields.set(fieldName, { ...existing, required: true })
            }
          })

          newPhaseContext.optional.forEach(fieldName => {
            if (!fields.has(fieldName)) {
              fields.set(fieldName, {
                name: fieldName,
                label: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                required: false,
                completed: false
              })
            }
          })

          // 완성도 재계산
          const requiredFields = Array.from(fields.values()).filter(f => f.required)
          const completedRequired = requiredFields.filter(f => f.completed).length
          const completionRate = requiredFields.length > 0
            ? (completedRequired / requiredFields.length) * 100
            : 100

          const missingRequired = Array.from(fields.entries())
            .filter(([_, f]) => f.required && !f.completed)
            .map(([name, _]) => name)

          const missingOptional = Array.from(fields.entries())
            .filter(([_, f]) => !f.required && !f.completed)
            .map(([name, _]) => name)

          const updatedContext: SessionContext = {
            ...currentContext,
            phase: newPhase,
            fields,
            completionRate,
            missingRequired,
            missingOptional
          }

          return {
            contextBySession: new Map(state.contextBySession).set(sessionId, updatedContext)
          }
        })
      },

      generateQuestion: (field, direction) => {
        const template = get().questionTemplates.get(field)
        if (!template) {
          // 템플릿이 없으면 기본 질문 생성
          return direction === 'buyer'
            ? `${field.replace(/_/g, ' ')}을(를) 알려주세요`
            : `${field.replace(/_/g, ' ')}이(가) 어떻게 되나요?`
        }

        return direction === 'buyer' ? template.buyerQuestion : template.sellerQuestion
      },

      getNextMissingField: (sessionId) => {
        const context = get().contextBySession.get(sessionId)
        if (!context) return null

        // 우선순위에 따라 정렬된 미완성 필수 필드 반환
        const templates = get().questionTemplates
        const missingWithPriority = context.missingRequired
          .map(field => ({
            field,
            priority: templates.get(field)?.priority ?? 999
          }))
          .sort((a, b) => a.priority - b.priority)

        return missingWithPriority[0]?.field ?? null
      },

      getSessionContext: (sessionId) => {
        return get().contextBySession.get(sessionId)
      },

      getCompletionRate: (sessionId) => {
        return get().contextBySession.get(sessionId)?.completionRate ?? 0
      },

      getMissingFields: (sessionId) => {
        const context = get().contextBySession.get(sessionId)
        return {
          required: context?.missingRequired ?? [],
          optional: context?.missingOptional ?? []
        }
      }
    }),
    {
      name: 'fullcontext-store'
    }
  )
)

export default useFullContextStore