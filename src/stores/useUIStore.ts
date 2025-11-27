import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface PanelSize {
  buyer: number    // 구매 채팅 패널 너비 (%)
  ai: number       // AI 제안 패널 너비 (%)
  seller: number   // 판매 채팅 패널 너비 (%)
}

interface UIStore {
  // 레이아웃 설정
  panelSizes: PanelSize
  isPanelResizable: boolean
  showAIPanel: boolean

  // 판매자 탭 관리
  activeSellerTab: string | null
  sellerTabOrder: string[]
  maxVisibleTabs: number
  showTabOverflowMenu: boolean

  // 모달/다이얼로그 상태
  isDealDetailModalOpen: boolean
  activeSessionId: string | null

  // FullContext UI 상태
  showFullContextOverlay: boolean
  highlightMissingFields: boolean
  autoScrollToMissing: boolean

  // 알림/토스트 설정
  showNotifications: boolean
  notificationPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

  // 테마 설정
  theme: 'light' | 'dark' | 'auto'
  compactMode: boolean

  // 액션 - 레이아웃 관리
  setPanelSizes: (sizes: Partial<PanelSize>) => void
  resetPanelSizes: () => void
  toggleAIPanel: () => void
  setPanelResizable: (resizable: boolean) => void

  // 액션 - 판매자 탭 관리
  setActiveSellerTab: (tabId: string | null) => void
  addSellerTab: (sellerId: string) => void
  removeSellerTab: (sellerId: string) => void
  reorderSellerTabs: (newOrder: string[]) => void
  setMaxVisibleTabs: (count: number) => void

  // 액션 - 모달 관리
  openDealDetailModal: (sessionId: string) => void
  closeDealDetailModal: () => void

  // 액션 - FullContext UI
  toggleFullContextOverlay: () => void
  setHighlightMissingFields: (highlight: boolean) => void
  setAutoScrollToMissing: (autoScroll: boolean) => void

  // 액션 - 알림 설정
  setShowNotifications: (show: boolean) => void
  setNotificationPosition: (position: UIStore['notificationPosition']) => void

  // 액션 - 테마 설정
  setTheme: (theme: UIStore['theme']) => void
  toggleCompactMode: () => void

  // 헬퍼 함수
  getVisibleTabs: () => string[]
  getHiddenTabs: () => string[]
  isTabVisible: (tabId: string) => boolean
}

const DEFAULT_PANEL_SIZES: PanelSize = {
  buyer: 30,
  ai: 25,
  seller: 45
}

const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 초기 상태
        panelSizes: DEFAULT_PANEL_SIZES,
        isPanelResizable: true,
        showAIPanel: true,

        activeSellerTab: null,
        sellerTabOrder: [],
        maxVisibleTabs: 4,
        showTabOverflowMenu: false,

        isDealDetailModalOpen: false,
        activeSessionId: null,

        showFullContextOverlay: true,
        highlightMissingFields: true,
        autoScrollToMissing: false,

        showNotifications: true,
        notificationPosition: 'top-right',

        theme: 'auto',
        compactMode: false,

        // 레이아웃 관리
        setPanelSizes: (sizes) => {
          set((state) => {
            const newSizes = { ...state.panelSizes, ...sizes }

            // 패널 크기 합이 100%가 되도록 조정
            const total = newSizes.buyer + newSizes.ai + newSizes.seller
            if (Math.abs(total - 100) > 0.1) {
              // 비율 유지하며 조정
              const scale = 100 / total
              newSizes.buyer *= scale
              newSizes.ai *= scale
              newSizes.seller *= scale
            }

            return { panelSizes: newSizes }
          })
        },

        resetPanelSizes: () => {
          set({ panelSizes: DEFAULT_PANEL_SIZES })
        },

        toggleAIPanel: () => {
          set((state) => {
            if (state.showAIPanel) {
              // AI 패널 숨기기 - 공간을 판매 패널에 할당
              return {
                showAIPanel: false,
                panelSizes: {
                  buyer: state.panelSizes.buyer,
                  ai: 0,
                  seller: state.panelSizes.seller + state.panelSizes.ai
                }
              }
            } else {
              // AI 패널 보이기 - 기본 크기로 복원
              return {
                showAIPanel: true,
                panelSizes: DEFAULT_PANEL_SIZES
              }
            }
          })
        },

        setPanelResizable: (resizable) => {
          set({ isPanelResizable: resizable })
        },

        // 판매자 탭 관리
        setActiveSellerTab: (tabId) => {
          set({ activeSellerTab: tabId })
        },

        addSellerTab: (sellerId) => {
          set((state) => {
            if (state.sellerTabOrder.includes(sellerId)) {
              // 이미 존재하면 활성화만
              return { activeSellerTab: sellerId }
            }

            const newOrder = [...state.sellerTabOrder, sellerId]
            return {
              sellerTabOrder: newOrder,
              activeSellerTab: sellerId,
              showTabOverflowMenu: newOrder.length > state.maxVisibleTabs
            }
          })
        },

        removeSellerTab: (sellerId) => {
          set((state) => {
            const newOrder = state.sellerTabOrder.filter(id => id !== sellerId)
            const newActiveTab = state.activeSellerTab === sellerId
              ? newOrder[0] || null
              : state.activeSellerTab

            return {
              sellerTabOrder: newOrder,
              activeSellerTab: newActiveTab,
              showTabOverflowMenu: newOrder.length > state.maxVisibleTabs
            }
          })
        },

        reorderSellerTabs: (newOrder) => {
          set({ sellerTabOrder: newOrder })
        },

        setMaxVisibleTabs: (count) => {
          set((state) => ({
            maxVisibleTabs: count,
            showTabOverflowMenu: state.sellerTabOrder.length > count
          }))
        },

        // 모달 관리
        openDealDetailModal: (sessionId) => {
          set({
            isDealDetailModalOpen: true,
            activeSessionId: sessionId
          })
        },

        closeDealDetailModal: () => {
          set({
            isDealDetailModalOpen: false,
            activeSessionId: null
          })
        },

        // FullContext UI
        toggleFullContextOverlay: () => {
          set((state) => ({ showFullContextOverlay: !state.showFullContextOverlay }))
        },

        setHighlightMissingFields: (highlight) => {
          set({ highlightMissingFields: highlight })
        },

        setAutoScrollToMissing: (autoScroll) => {
          set({ autoScrollToMissing: autoScroll })
        },

        // 알림 설정
        setShowNotifications: (show) => {
          set({ showNotifications: show })
        },

        setNotificationPosition: (position) => {
          set({ notificationPosition: position })
        },

        // 테마 설정
        setTheme: (theme) => {
          set({ theme })
        },

        toggleCompactMode: () => {
          set((state) => ({ compactMode: !state.compactMode }))
        },

        // 헬퍼 함수
        getVisibleTabs: () => {
          const state = get()
          return state.sellerTabOrder.slice(0, state.maxVisibleTabs)
        },

        getHiddenTabs: () => {
          const state = get()
          return state.sellerTabOrder.slice(state.maxVisibleTabs)
        },

        isTabVisible: (tabId) => {
          const state = get()
          const index = state.sellerTabOrder.indexOf(tabId)
          return index >= 0 && index < state.maxVisibleTabs
        }
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          // 유지할 설정들
          panelSizes: state.panelSizes,
          isPanelResizable: state.isPanelResizable,
          maxVisibleTabs: state.maxVisibleTabs,
          showNotifications: state.showNotifications,
          notificationPosition: state.notificationPosition,
          theme: state.theme,
          compactMode: state.compactMode,
          highlightMissingFields: state.highlightMissingFields,
          autoScrollToMissing: state.autoScrollToMissing
        })
      }
    ),
    {
      name: 'ui-store'
    }
  )
)

export default useUIStore