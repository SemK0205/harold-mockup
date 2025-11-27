/**
 * Notification Store - 알림 및 New 뱃지 상태 관리
 *
 * - viewedDeals: 사용자가 클릭해서 본 딜 ID 목록 (localStorage 동기화)
 * - notificationPermission: 브라우저 알림 권한 상태
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

const STORAGE_KEY = 'harold-viewed-deals'

interface NotificationStore {
  // 사용자가 클릭해서 본 딜 ID 세트
  viewedDeals: Set<string>

  // 상태 변경 감지용 버전 (Set 변경 시 증가)
  viewedVersion: number

  // 브라우저 알림 권한 상태
  notificationPermission: NotificationPermission | 'unsupported'

  // 알려진 딜 ID 목록 (초기 로드 시 설정)
  knownDealIds: Set<string>

  // ===== Actions =====
  markAsViewed: (sessionId: string) => void
  isNewDeal: (sessionId: string) => boolean

  // 브라우저 알림
  requestNotificationPermission: () => Promise<void>
  showNotification: (title: string, options?: NotificationOptions) => void

  // 초기 딜 목록 설정 (SSE initial_data 시)
  setKnownDeals: (dealIds: string[]) => void
  addKnownDeal: (dealId: string) => boolean // 새로운 딜이면 true 반환
}

const useNotificationStore = create<NotificationStore>()(
  devtools(
    persist(
      (set, get) => ({
        viewedDeals: new Set<string>(),
        viewedVersion: 0,
        // SSR 중에는 'default'로 설정, 클라이언트에서 실제 값으로 업데이트
        notificationPermission: 'default' as NotificationPermission | 'unsupported',
        knownDealIds: new Set<string>(),

        markAsViewed: (sessionId) => {
          set((state) => {
            const newViewed = new Set(state.viewedDeals)
            newViewed.add(sessionId)
            return { viewedDeals: newViewed, viewedVersion: state.viewedVersion + 1 }
          })
        },

        isNewDeal: (sessionId) => {
          const state = get()
          // 본 적이 없고, 초기 로드 딜이 아닌 경우만 NEW 표시
          // (knownDealIds에 있으면서 viewedDeals에 없으면 = 새로 추가된 딜)
          // (knownDealIds에 없으면 = 아직 초기화 안됨, NEW 표시 안함)
          return state.knownDealIds.has(sessionId) && !state.viewedDeals.has(sessionId)
        },

        requestNotificationPermission: async () => {
          if (typeof Notification === 'undefined') {
            set({ notificationPermission: 'unsupported' })
            return
          }

          try {
            const permission = await Notification.requestPermission()
            set({ notificationPermission: permission })
          } catch (error) {
            console.error('Failed to request notification permission:', error)
          }
        },

        showNotification: (title, options) => {
          const state = get()
          if (state.notificationPermission !== 'granted') {
            return
          }

          try {
            new Notification(title, {
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              ...options,
            })
          } catch (error) {
            console.error('Failed to show notification:', error)
          }
        },

        setKnownDeals: (dealIds) => {
          const state = get()
          // 첫 초기화인 경우, 기존 딜들은 모두 "본 것"으로 처리
          if (state.knownDealIds.size === 0) {
            set({
              knownDealIds: new Set(dealIds),
              viewedDeals: new Set([...state.viewedDeals, ...dealIds])
            })
          } else {
            // 재연결 시에는 knownDealIds만 업데이트
            set({ knownDealIds: new Set(dealIds) })
          }
        },

        addKnownDeal: (dealId) => {
          const state = get()
          if (state.knownDealIds.has(dealId)) {
            return false // 이미 알려진 딜
          }

          set((s) => {
            const newKnown = new Set(s.knownDealIds)
            newKnown.add(dealId)
            return { knownDealIds: newKnown }
          })
          return true // 새로운 딜
        },
      }),
      {
        name: STORAGE_KEY,
        // Set을 JSON으로 직렬화/역직렬화
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name)
            if (!str) return null
            try {
              const data = JSON.parse(str)
              return {
                state: {
                  ...data.state,
                  viewedDeals: new Set(data.state.viewedDeals || []),
                  knownDealIds: new Set(data.state.knownDealIds || []),
                },
              }
            } catch {
              return null
            }
          },
          setItem: (name, value) => {
            const data = {
              state: {
                ...value.state,
                viewedDeals: Array.from(value.state.viewedDeals || []),
                knownDealIds: Array.from(value.state.knownDealIds || []),
              },
            }
            localStorage.setItem(name, JSON.stringify(data))
          },
          removeItem: (name) => localStorage.removeItem(name),
        },
        partialize: (state) => ({
          viewedDeals: state.viewedDeals,
          knownDealIds: state.knownDealIds,
        }),
      }
    ),
    { name: 'notification-store' }
  )
)

export default useNotificationStore
