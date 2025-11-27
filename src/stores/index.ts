/**
 * 중앙 상태 관리 스토어 Export
 *
 * 이 파일은 모든 Zustand 스토어를 중앙에서 관리합니다.
 * 각 스토어의 역할:
 *
 * - useTradingStore: 거래 세션 및 계층 구조 관리
 * - useFullContextStore: FullContext 달성도 및 질문 템플릿 관리
 * - useChatStore: 채팅 메시지 및 채팅방 관리
 * - useUIStore: UI 상태 및 레이아웃 관리
 */

export { default as useTradingStore } from './useTradingStore'
export type { SessionPhase, SessionStatus } from './useTradingStore'

export { default as useFullContextStore } from './useFullContextStore'

export { default as useChatStore } from './useChatStore'
export type { Platform, RoomCategory } from './useChatStore'

export { default as useUIStore } from './useUIStore'

export { default as useDealStore } from './useDealStore'

export { default as useNotificationStore } from './useNotificationStore'

// 스토어 초기화 헬퍼
export const initializeStores = async () => {
  // 필요한 경우 여기서 스토어 초기 데이터를 설정
  // 예: API에서 초기 데이터 로드, 로컬 스토리지 동기화 등
}