/**
 * Deal Store - 거래 세션별 상태 전역 관리
 *
 * 모달 닫아도 유지되어야 하는 상태:
 * - seller_contexts (판매자별 상태: Waiting, Quoted 등)
 * - unread counts (판매자별 안읽은 메시지 수)
 * - 메시지 캐시 (최근 5개 세션만 LRU)
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { SellerContext, ChatMessage } from '@/types'

const MAX_CACHED_SESSIONS = 5

interface DealStore {
  // session_id -> seller_contexts
  sellerContextsBySession: Map<string, Record<string, SellerContext>>

  // session_id -> { trader -> unread count }
  unreadCountsBySession: Map<string, Record<string, number>>

  // session_id -> { trader -> messages[] } (LRU 캐싱)
  messagesBySession: Map<string, Map<string, ChatMessage[]>>

  // LRU 순서 추적 (가장 최근 사용된 session_id가 마지막)
  sessionAccessOrder: string[]

  // ===== Actions: Seller Contexts =====
  setSellerContexts: (sessionId: string, contexts: Record<string, SellerContext>) => void
  updateSellerContext: (sessionId: string, trader: string, context: Partial<SellerContext>) => void
  getSellerContexts: (sessionId: string) => Record<string, SellerContext> | undefined
  getSellerContext: (sessionId: string, trader: string) => SellerContext | undefined

  // ===== Actions: Unread Counts =====
  incrementUnread: (sessionId: string, trader: string) => void
  clearUnread: (sessionId: string, trader: string) => void
  getUnreadCount: (sessionId: string, trader: string) => number
  getUnreadCounts: (sessionId: string) => Record<string, number>

  // ===== Actions: Messages (LRU Cache) =====
  setMessages: (sessionId: string, trader: string, messages: ChatMessage[]) => void
  addMessage: (sessionId: string, trader: string, message: ChatMessage) => void
  getMessages: (sessionId: string, trader: string) => ChatMessage[]
  hasMessages: (sessionId: string, trader: string) => boolean

  // ===== Utility =====
  touchSession: (sessionId: string) => void
  clearSession: (sessionId: string) => void
}

const useDealStore = create<DealStore>()(
  devtools(
    (set, get) => ({
      sellerContextsBySession: new Map(),
      unreadCountsBySession: new Map(),
      messagesBySession: new Map(),
      sessionAccessOrder: [],

      // ===== Seller Contexts =====
      setSellerContexts: (sessionId, contexts) => {
        set((state) => {
          const newMap = new Map(state.sellerContextsBySession)
          newMap.set(sessionId, contexts)
          return { sellerContextsBySession: newMap }
        })
        get().touchSession(sessionId)
      },

      updateSellerContext: (sessionId, trader, context) => {
        set((state) => {
          const newMap = new Map(state.sellerContextsBySession)
          const existing = newMap.get(sessionId) || {}
          const existingContext = existing[trader] || { status: 'waiting_quote', quote: null }

          newMap.set(sessionId, {
            ...existing,
            [trader]: { ...existingContext, ...context }
          })
          return { sellerContextsBySession: newMap }
        })
      },

      getSellerContexts: (sessionId) => {
        return get().sellerContextsBySession.get(sessionId)
      },

      getSellerContext: (sessionId, trader) => {
        return get().sellerContextsBySession.get(sessionId)?.[trader]
      },

      // ===== Unread Counts =====
      incrementUnread: (sessionId, trader) => {
        set((state) => {
          const newMap = new Map(state.unreadCountsBySession)
          const existing = newMap.get(sessionId) || {}
          newMap.set(sessionId, {
            ...existing,
            [trader]: (existing[trader] || 0) + 1
          })
          return { unreadCountsBySession: newMap }
        })
      },

      clearUnread: (sessionId, trader) => {
        set((state) => {
          const newMap = new Map(state.unreadCountsBySession)
          const existing = newMap.get(sessionId)
          if (existing) {
            newMap.set(sessionId, { ...existing, [trader]: 0 })
          }
          return { unreadCountsBySession: newMap }
        })
      },

      getUnreadCount: (sessionId, trader) => {
        return get().unreadCountsBySession.get(sessionId)?.[trader] || 0
      },

      getUnreadCounts: (sessionId) => {
        return get().unreadCountsBySession.get(sessionId) || {}
      },

      // ===== Messages (LRU Cache) =====
      setMessages: (sessionId, trader, messages) => {
        set((state) => {
          const newMap = new Map(state.messagesBySession)
          const sessionMessages = new Map(newMap.get(sessionId) || new Map())
          sessionMessages.set(trader, messages)
          newMap.set(sessionId, sessionMessages)
          return { messagesBySession: newMap }
        })
        get().touchSession(sessionId)
      },

      addMessage: (sessionId, trader, message) => {
        set((state) => {
          const newMap = new Map(state.messagesBySession)
          const sessionMessages = new Map(newMap.get(sessionId) || new Map())
          const existing = sessionMessages.get(trader) || []

          // 중복 체크
          if (existing.some((m: ChatMessage) => m.message_id === message.message_id)) {
            return state
          }

          sessionMessages.set(trader, [...existing, message])
          newMap.set(sessionId, sessionMessages)
          return { messagesBySession: newMap }
        })
      },

      getMessages: (sessionId, trader) => {
        return get().messagesBySession.get(sessionId)?.get(trader) || []
      },

      hasMessages: (sessionId, trader) => {
        const messages = get().messagesBySession.get(sessionId)?.get(trader)
        return messages !== undefined && messages.length > 0
      },

      // ===== Utility =====
      touchSession: (sessionId) => {
        set((state) => {
          // LRU 업데이트: 해당 session을 맨 뒤로 이동
          const order = state.sessionAccessOrder.filter(id => id !== sessionId)
          order.push(sessionId)

          // 캐시 크기 초과 시 가장 오래된 세션 제거
          if (order.length > MAX_CACHED_SESSIONS) {
            const oldestSession = order.shift()
            if (oldestSession) {
              const newMessages = new Map(state.messagesBySession)
              newMessages.delete(oldestSession)
              return {
                sessionAccessOrder: order,
                messagesBySession: newMessages
              }
            }
          }

          return { sessionAccessOrder: order }
        })
      },

      clearSession: (sessionId) => {
        set((state) => {
          const newContexts = new Map(state.sellerContextsBySession)
          const newUnread = new Map(state.unreadCountsBySession)
          const newMessages = new Map(state.messagesBySession)

          newContexts.delete(sessionId)
          newUnread.delete(sessionId)
          newMessages.delete(sessionId)

          return {
            sellerContextsBySession: newContexts,
            unreadCountsBySession: newUnread,
            messagesBySession: newMessages,
            sessionAccessOrder: state.sessionAccessOrder.filter(id => id !== sessionId)
          }
        })
      }
    }),
    { name: 'deal-store' }
  )
)

export default useDealStore
