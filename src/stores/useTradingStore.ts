import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type SessionPhase = 'pre_deal' | 'deal_inquiry' | 'deal_negotiation' | 'deal_confirmation' | 'post_deal'
export type SessionStatus = 'active' | 'quoted' | 'negotiating' | 'closed_success' | 'closed_failed' | 'cancelled'

interface SellerSession {
  traderId: string
  traderName: string
  roomName: string
  platform: 'kakao' | 'kakao_biz' | 'whatsapp' | 'wechat'
  quotes: Quote[]
  lastActivity: Date
  status: 'pending' | 'inquired' | 'quoted' | 'negotiating' | 'closed'
}

interface Quote {
  price: number
  quantity: number
  deliveryDate: string
  timestamp: Date
  terms?: string
  validUntil?: Date
}

interface TradingSession {
  sessionId: string              // trading_sessions.session_id
  orderId: string                // 부모 주문 ID
  customerRoom: string           // trading_sessions.customer_room_name
  customerPlatform: string      // 고객 플랫폼
  originalInquiry: string        // 원본 인쿼리

  // 거래 정보
  vesselName?: string
  port?: string
  fuelType?: string
  quantity?: number
  deliveryDate?: Date

  // 세션 계층 구조
  sellerSessions: Map<string, SellerSession>

  // 상태 관리
  status: SessionStatus
  phase: SessionPhase

  // 메타데이터
  createdAt: Date
  updatedAt: Date
  closedAt?: Date
  finalPrice?: number
  selectedTrader?: string
  closingReason?: string
}

interface TradingStore {
  // 세션 데이터
  sessions: Map<string, TradingSession>
  activeOrderId: string | null
  activeSellerTab: string | null

  // 액션 - 세션 관리
  createOrderSession: (orderId: string, customerRoom: string, platform: string, inquiry: string) => void
  addSellerSession: (orderId: string, sellerId: string, sellerInfo: Omit<SellerSession, 'quotes'>) => void
  updateSessionPhase: (sessionId: string, phase: SessionPhase) => void
  updateSessionStatus: (sessionId: string, status: SessionStatus) => void

  // 액션 - 판매자 관리
  setActiveSellerTab: (sellerId: string | null) => void
  updateSellerQuote: (orderId: string, sellerId: string, quote: Quote) => void
  updateSellerStatus: (orderId: string, sellerId: string, status: SellerSession['status']) => void

  // 액션 - 거래 정보 업데이트
  updateTradingInfo: (sessionId: string, info: Partial<{
    vesselName: string
    port: string
    fuelType: string
    quantity: number
    deliveryDate: Date
  }>) => void

  // 액션 - 세션 종료
  closeSession: (sessionId: string, reason: 'success' | 'failed' | 'cancelled', finalPrice?: number, selectedTrader?: string) => void

  // 헬퍼 함수
  getSessionByOrderId: (orderId: string) => TradingSession | undefined
  getActiveSellerSessions: (orderId: string) => SellerSession[]
  getSessionsByStatus: (status: SessionStatus) => TradingSession[]
}

const useTradingStore = create<TradingStore>()(
  devtools(
    (set, get) => ({
      sessions: new Map(),
      activeOrderId: null,
      activeSellerTab: null,

      createOrderSession: (orderId, customerRoom, platform, inquiry) => {
        const sessionId = `SESSION_${orderId}_${Date.now()}`
        const newSession: TradingSession = {
          sessionId,
          orderId,
          customerRoom,
          customerPlatform: platform,
          originalInquiry: inquiry,
          sellerSessions: new Map(),
          status: 'active',
          phase: 'deal_inquiry', // 인쿼리로 시작
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        set((state) => ({
          sessions: new Map(state.sessions).set(sessionId, newSession),
          activeOrderId: orderId
        }))
      },

      addSellerSession: (orderId, sellerId, sellerInfo) => {
        set((state) => {
          const session = Array.from(state.sessions.values()).find(s => s.orderId === orderId)
          if (!session) return state

          const newSellerSession: SellerSession = {
            ...sellerInfo,
            quotes: [],
            lastActivity: new Date(),
            status: 'pending'
          }

          const updatedSession = {
            ...session,
            sellerSessions: new Map(session.sellerSessions).set(sellerId, newSellerSession),
            updatedAt: new Date()
          }

          return {
            sessions: new Map(state.sessions).set(session.sessionId, updatedSession)
          }
        })
      },

      updateSessionPhase: (sessionId, phase) => {
        set((state) => {
          const session = state.sessions.get(sessionId)
          if (!session) return state

          const updatedSession = {
            ...session,
            phase,
            updatedAt: new Date()
          }

          return {
            sessions: new Map(state.sessions).set(sessionId, updatedSession)
          }
        })
      },

      updateSessionStatus: (sessionId, status) => {
        set((state) => {
          const session = state.sessions.get(sessionId)
          if (!session) return state

          const updatedSession = {
            ...session,
            status,
            updatedAt: new Date()
          }

          return {
            sessions: new Map(state.sessions).set(sessionId, updatedSession)
          }
        })
      },

      setActiveSellerTab: (sellerId) => {
        set({ activeSellerTab: sellerId })
      },

      updateSellerQuote: (orderId, sellerId, quote) => {
        set((state) => {
          const session = Array.from(state.sessions.values()).find(s => s.orderId === orderId)
          if (!session) return state

          const sellerSession = session.sellerSessions.get(sellerId)
          if (!sellerSession) return state

          const updatedSellerSession = {
            ...sellerSession,
            quotes: [...sellerSession.quotes, quote],
            lastActivity: new Date(),
            status: 'quoted' as const
          }

          const updatedSession = {
            ...session,
            sellerSessions: new Map(session.sellerSessions).set(sellerId, updatedSellerSession),
            status: 'quoted' as SessionStatus,
            updatedAt: new Date()
          }

          return {
            sessions: new Map(state.sessions).set(session.sessionId, updatedSession)
          }
        })
      },

      updateSellerStatus: (orderId, sellerId, status) => {
        set((state) => {
          const session = Array.from(state.sessions.values()).find(s => s.orderId === orderId)
          if (!session) return state

          const sellerSession = session.sellerSessions.get(sellerId)
          if (!sellerSession) return state

          const updatedSellerSession = {
            ...sellerSession,
            status,
            lastActivity: new Date()
          }

          const updatedSession = {
            ...session,
            sellerSessions: new Map(session.sellerSessions).set(sellerId, updatedSellerSession),
            updatedAt: new Date()
          }

          return {
            sessions: new Map(state.sessions).set(session.sessionId, updatedSession)
          }
        })
      },

      updateTradingInfo: (sessionId, info) => {
        set((state) => {
          const session = state.sessions.get(sessionId)
          if (!session) return state

          const updatedSession = {
            ...session,
            ...info,
            updatedAt: new Date()
          }

          return {
            sessions: new Map(state.sessions).set(sessionId, updatedSession)
          }
        })
      },

      closeSession: (sessionId, reason, finalPrice, selectedTrader) => {
        set((state) => {
          const session = state.sessions.get(sessionId)
          if (!session) return state

          const statusMap = {
            'success': 'closed_success',
            'failed': 'closed_failed',
            'cancelled': 'cancelled'
          } as const

          const updatedSession = {
            ...session,
            status: statusMap[reason],
            closedAt: new Date(),
            closingReason: reason,
            finalPrice,
            selectedTrader,
            updatedAt: new Date()
          }

          return {
            sessions: new Map(state.sessions).set(sessionId, updatedSession)
          }
        })
      },

      getSessionByOrderId: (orderId) => {
        return Array.from(get().sessions.values()).find(s => s.orderId === orderId)
      },

      getActiveSellerSessions: (orderId) => {
        const session = get().getSessionByOrderId(orderId)
        if (!session) return []

        return Array.from(session.sellerSessions.values()).filter(
          s => s.status !== 'closed'
        )
      },

      getSessionsByStatus: (status) => {
        return Array.from(get().sessions.values()).filter(s => s.status === status)
      }
    }),
    {
      name: 'trading-store'
    }
  )
)

export default useTradingStore