import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type Platform = 'kakao' | 'kakao_biz' | 'whatsapp' | 'wechat'
export type RoomCategory = 'buy' | 'sell' | 'other'

interface ChatMessage {
  id: number
  roomName: string
  sender: string
  message: string
  platform: Platform
  createdAt: Date
  isOurCompany?: boolean  // 우리 회사 발신자 여부
  sessionId?: string       // 연관된 세션 ID
}

interface ChatRoom {
  roomName: string
  platform: Platform
  category: RoomCategory
  lastMessage?: ChatMessage
  lastActivity: Date
  unreadCount: number
  isActive: boolean
  metadata?: {
    companyName?: string
    contactPerson?: string
    phoneNumber?: string
  }
}

interface ChatStore {
  // 채팅방 데이터
  rooms: Map<string, ChatRoom>

  // 메시지 데이터 (roomName별)
  messagesByRoom: Map<string, ChatMessage[]>

  // 우리 회사 발신자 목록
  ourCompanySenders: Set<string>

  // 활성 채팅방 (현재 보고 있는)
  activeRoomName: string | null

  // 새 메시지 알림 상태
  notifications: Map<string, boolean>

  // 액션 - 채팅방 관리
  initializeRoom: (room: ChatRoom) => void
  updateRoomCategory: (roomName: string, category: RoomCategory) => void
  setActiveRoom: (roomName: string | null) => void
  updateRoomMetadata: (roomName: string, metadata: ChatRoom['metadata']) => void

  // 액션 - 메시지 관리
  addMessage: (message: ChatMessage) => void
  addMessages: (roomName: string, messages: ChatMessage[]) => void
  markAsRead: (roomName: string) => void

  // 액션 - 발신자 관리
  setOurCompanySenders: (senders: string[]) => void
  isOurCompanySender: (sender: string) => boolean

  // 액션 - 알림 관리
  setNotification: (roomName: string, hasNew: boolean) => void
  clearNotification: (roomName: string) => void
  getUnreadCount: (roomName: string) => number

  // 헬퍼 함수
  getRoomByName: (roomName: string) => ChatRoom | undefined
  getMessagesByRoom: (roomName: string) => ChatMessage[]
  getRoomsByCategory: (category: RoomCategory) => ChatRoom[]
  getLatestMessage: (roomName: string) => ChatMessage | undefined
  searchMessages: (query: string, roomName?: string) => ChatMessage[]
}

const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      rooms: new Map(),
      messagesByRoom: new Map(),
      ourCompanySenders: new Set(),
      activeRoomName: null,
      notifications: new Map(),

      initializeRoom: (room) => {
        set((state) => ({
          rooms: new Map(state.rooms).set(room.roomName, room),
          messagesByRoom: state.messagesByRoom.has(room.roomName)
            ? state.messagesByRoom
            : new Map(state.messagesByRoom).set(room.roomName, [])
        }))
      },

      updateRoomCategory: (roomName, category) => {
        set((state) => {
          const room = state.rooms.get(roomName)
          if (!room) return state

          const updatedRoom = { ...room, category }
          return {
            rooms: new Map(state.rooms).set(roomName, updatedRoom)
          }
        })
      },

      setActiveRoom: (roomName) => {
        set({ activeRoomName: roomName })

        // 활성 채팅방으로 설정하면 알림 자동 제거
        if (roomName) {
          get().clearNotification(roomName)
          get().markAsRead(roomName)
        }
      },

      updateRoomMetadata: (roomName, metadata) => {
        set((state) => {
          const room = state.rooms.get(roomName)
          if (!room) return state

          const updatedRoom = {
            ...room,
            metadata: { ...room.metadata, ...metadata }
          }

          return {
            rooms: new Map(state.rooms).set(roomName, updatedRoom)
          }
        })
      },

      addMessage: (message) => {
        set((state) => {
          const roomMessages = state.messagesByRoom.get(message.roomName) || []
          const updatedMessages = [...roomMessages, message].sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          )

          // 채팅방 정보 업데이트
          const room = state.rooms.get(message.roomName)
          if (room) {
            const updatedRoom = {
              ...room,
              lastMessage: message,
              lastActivity: message.createdAt,
              unreadCount: state.activeRoomName === message.roomName
                ? room.unreadCount
                : room.unreadCount + 1
            }
            state.rooms.set(message.roomName, updatedRoom)
          }

          // 새 메시지 알림 (활성 채팅방이 아닌 경우)
          if (state.activeRoomName !== message.roomName) {
            state.notifications.set(message.roomName, true)
          }

          return {
            messagesByRoom: new Map(state.messagesByRoom).set(message.roomName, updatedMessages),
            rooms: new Map(state.rooms),
            notifications: new Map(state.notifications)
          }
        })
      },

      addMessages: (roomName, messages) => {
        set((state) => {
          const existingMessages = state.messagesByRoom.get(roomName) || []
          const existingIds = new Set(existingMessages.map(m => m.id))

          // 중복 제거하고 추가
          const newMessages = messages.filter(m => !existingIds.has(m.id))
          const allMessages = [...existingMessages, ...newMessages].sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          )

          // 마지막 메시지로 채팅방 정보 업데이트
          const lastMessage = allMessages[allMessages.length - 1]
          if (lastMessage) {
            const room = state.rooms.get(roomName)
            if (room) {
              const updatedRoom = {
                ...room,
                lastMessage,
                lastActivity: lastMessage.createdAt
              }
              state.rooms.set(roomName, updatedRoom)
            }
          }

          return {
            messagesByRoom: new Map(state.messagesByRoom).set(roomName, allMessages),
            rooms: new Map(state.rooms)
          }
        })
      },

      markAsRead: (roomName) => {
        set((state) => {
          const room = state.rooms.get(roomName)
          if (!room) return state

          const updatedRoom = { ...room, unreadCount: 0 }
          return {
            rooms: new Map(state.rooms).set(roomName, updatedRoom)
          }
        })
      },

      setOurCompanySenders: (senders) => {
        set({ ourCompanySenders: new Set(senders) })
      },

      isOurCompanySender: (sender) => {
        return get().ourCompanySenders.has(sender)
      },

      setNotification: (roomName, hasNew) => {
        set((state) => ({
          notifications: new Map(state.notifications).set(roomName, hasNew)
        }))
      },

      clearNotification: (roomName) => {
        set((state) => {
          const newNotifications = new Map(state.notifications)
          newNotifications.delete(roomName)
          return { notifications: newNotifications }
        })
      },

      getUnreadCount: (roomName) => {
        return get().rooms.get(roomName)?.unreadCount || 0
      },

      getRoomByName: (roomName) => {
        return get().rooms.get(roomName)
      },

      getMessagesByRoom: (roomName) => {
        return get().messagesByRoom.get(roomName) || []
      },

      getRoomsByCategory: (category) => {
        return Array.from(get().rooms.values()).filter(room => room.category === category)
      },

      getLatestMessage: (roomName) => {
        const messages = get().messagesByRoom.get(roomName)
        return messages?.[messages.length - 1]
      },

      searchMessages: (query, roomName) => {
        const lowerQuery = query.toLowerCase()
        const messages = roomName
          ? get().messagesByRoom.get(roomName) || []
          : Array.from(get().messagesByRoom.values()).flat()

        return messages.filter(msg =>
          msg.message.toLowerCase().includes(lowerQuery) ||
          msg.sender.toLowerCase().includes(lowerQuery)
        )
      }
    }),
    {
      name: 'chat-store'
    }
  )
)

export default useChatStore