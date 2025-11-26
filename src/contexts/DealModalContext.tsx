/**
 * Deal Modal Context
 * 3-Column 모달 전용 상태 관리
 * Global store와 격리되어 충돌 방지
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { ChatMessage, TradingSession, AISuggestion } from '@/types';

interface ModalColumn {
  width: number;
  minWidth: number;
  maxWidth: number;
}

interface DealModalContextType {
  // Session Data
  session: TradingSession | null;
  setSession: (session: TradingSession | null) => void;

  // Column Management
  columns: {
    buyer: ModalColumn;
    ai: ModalColumn;
    seller: ModalColumn;
  };
  resizeColumn: (column: 'buyer' | 'ai' | 'seller', width: number) => void;

  // Buyer Chat State
  buyerMessages: ChatMessage[];
  setBuyerMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  addBuyerMessage: (message: ChatMessage) => void;

  // AI Assistant State
  aiSuggestions: AISuggestion[];
  setAiSuggestions: React.Dispatch<React.SetStateAction<AISuggestion[]>>;
  selectedSuggestions: Set<number>;
  toggleSuggestion: (id: number) => void;
  fullContextCompletion: number;
  setFullContextCompletion: (value: number) => void;

  // Seller Chats State
  activeSellerTab: string | null;
  setActiveSellerTab: (trader: string) => void;
  sellerTabs: string[];
  addSellerTab: (trader: string) => void;
  removeSellerTab: (trader: string) => void;
  sellerMessages: Map<string, ChatMessage[]>;
  setSellerMessagesForTrader: (trader: string, messages: ChatMessage[]) => void;
  addSellerMessage: (trader: string, message: ChatMessage) => void;

  // UI State
  isResizing: boolean;
  setIsResizing: (resizing: boolean) => void;
  showAIPanel: boolean;
  setShowAIPanel: (show: boolean) => void;

  // Room Platform Mapping
  roomPlatforms: Map<string, string>;
  setRoomPlatforms: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  getRoomPlatform: (roomName: string) => string;
}

const DealModalContext = createContext<DealModalContextType | undefined>(undefined);

interface DealModalProviderProps {
  children: React.ReactNode;
  session: TradingSession | null;
}

export function DealModalProvider({ children, session: initialSession }: DealModalProviderProps) {
  // Session
  const [session, setSession] = useState<TradingSession | null>(initialSession);

  // Sync session state when initialSession prop changes (fixes issue where all inquiries show the same data)
  useEffect(() => {
    setSession(initialSession);
    // Reset related states when session changes
    setBuyerMessages([]);
    setSellerMessages(new Map());
    setSellerTabs([]);
    setActiveSellerTab(null);
    setAiSuggestions([]);
    setSelectedSuggestions(new Set());
    setFullContextCompletion(0);
  }, [initialSession?.session_id]);

  // Column sizes - AI 컬럼 확대, 판매자 컬럼 축소
  const [columns, setColumns] = useState({
    buyer: { width: 25, minWidth: 20, maxWidth: 35 },
    ai: { width: 40, minWidth: 30, maxWidth: 50 },
    seller: { width: 35, minWidth: 25, maxWidth: 45 }
  });

  // Buyer Chat
  const [buyerMessages, setBuyerMessages] = useState<ChatMessage[]>([]);

  // AI Assistant
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [fullContextCompletion, setFullContextCompletion] = useState(0);

  // Seller Chats
  const [activeSellerTab, setActiveSellerTab] = useState<string | null>(null);
  const [sellerTabs, setSellerTabs] = useState<string[]>([]);
  const [sellerMessages, setSellerMessages] = useState<Map<string, ChatMessage[]>>(new Map());

  // UI State
  const [isResizing, setIsResizing] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(true);

  // Room Platform Mapping
  const [roomPlatforms, setRoomPlatforms] = useState<Map<string, string>>(new Map());

  // Get platform for a room (default to com.kakao.talk if not found)
  const getRoomPlatform = useCallback((roomName: string): string => {
    return roomPlatforms.get(roomName) || 'com.kakao.talk';
  }, [roomPlatforms]);

  // Column resize handler
  const resizeColumn = useCallback((column: 'buyer' | 'ai' | 'seller', width: number) => {
    setColumns(prev => {
      const newColumns = { ...prev };
      const col = newColumns[column];

      // Clamp to min/max
      const clampedWidth = Math.max(col.minWidth, Math.min(col.maxWidth, width));
      newColumns[column] = { ...col, width: clampedWidth };

      // Adjust other columns proportionally
      const totalWidth = 100;
      const fixedWidth = clampedWidth;
      const remainingWidth = totalWidth - fixedWidth;

      if (column === 'buyer') {
        const ratio = prev.ai.width / (prev.ai.width + prev.seller.width);
        newColumns.ai.width = remainingWidth * ratio;
        newColumns.seller.width = remainingWidth * (1 - ratio);
      } else if (column === 'ai') {
        const ratio = prev.buyer.width / (prev.buyer.width + prev.seller.width);
        newColumns.buyer.width = remainingWidth * ratio;
        newColumns.seller.width = remainingWidth * (1 - ratio);
      } else {
        const ratio = prev.buyer.width / (prev.buyer.width + prev.ai.width);
        newColumns.buyer.width = remainingWidth * ratio;
        newColumns.ai.width = remainingWidth * (1 - ratio);
      }

      return newColumns;
    });
  }, []);

  // Add buyer message (with duplicate check)
  const addBuyerMessage = useCallback((message: ChatMessage) => {
    setBuyerMessages(prev => {
      const exists = prev.some(m => m.message_id === message.message_id);
      if (exists) return prev;
      return [...prev, message];
    });
  }, []);

  // Toggle AI suggestion selection
  const toggleSuggestion = useCallback((id: number) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Add seller tab
  const addSellerTab = useCallback((trader: string) => {
    setSellerTabs(prev => {
      if (prev.includes(trader)) return prev;
      return [...prev, trader];
    });

    // Initialize messages for new tab
    if (!sellerMessages.has(trader)) {
      setSellerMessages(prev => new Map(prev).set(trader, []));
    }

    // Set as active if first tab
    if (!activeSellerTab) {
      setActiveSellerTab(trader);
    }
  }, [activeSellerTab, sellerMessages]);

  // Remove seller tab
  const removeSellerTab = useCallback((trader: string) => {
    setSellerTabs(prev => prev.filter(t => t !== trader));

    // Clear messages
    setSellerMessages(prev => {
      const newMap = new Map(prev);
      newMap.delete(trader);
      return newMap;
    });

    // Update active tab if needed
    if (activeSellerTab === trader) {
      setActiveSellerTab(sellerTabs.find(t => t !== trader) || null);
    }
  }, [activeSellerTab, sellerTabs]);

  // Set all messages for a trader at once (batch update)
  const setSellerMessagesForTrader = useCallback((trader: string, messages: ChatMessage[]) => {
    setSellerMessages(prev => {
      const newMap = new Map(prev);
      newMap.set(trader, messages);
      return newMap;
    });
  }, []);

  // Add seller message (with duplicate check)
  const addSellerMessage = useCallback((trader: string, message: ChatMessage) => {
    setSellerMessages(prev => {
      const newMap = new Map(prev);
      const messages = newMap.get(trader) || [];

      // Check for duplicates
      const exists = messages.some(m => m.message_id === message.message_id);
      if (!exists) {
        newMap.set(trader, [...messages, message]);
      }

      return newMap;
    });
  }, []);

  // Memoize context value
  const contextValue = useMemo<DealModalContextType>(() => ({
    session,
    setSession,
    columns,
    resizeColumn,
    buyerMessages,
    setBuyerMessages,
    addBuyerMessage,
    aiSuggestions,
    setAiSuggestions,
    selectedSuggestions: selectedSuggestions,
    toggleSuggestion,
    fullContextCompletion,
    setFullContextCompletion,
    activeSellerTab,
    setActiveSellerTab,
    sellerTabs,
    addSellerTab,
    removeSellerTab,
    sellerMessages,
    setSellerMessagesForTrader,
    addSellerMessage,
    isResizing,
    setIsResizing,
    showAIPanel,
    setShowAIPanel,
    roomPlatforms,
    setRoomPlatforms,
    getRoomPlatform
  }), [
    session,
    columns,
    resizeColumn,
    buyerMessages,
    addBuyerMessage,
    aiSuggestions,
    selectedSuggestions,
    toggleSuggestion,
    fullContextCompletion,
    activeSellerTab,
    sellerTabs,
    addSellerTab,
    removeSellerTab,
    sellerMessages,
    setSellerMessagesForTrader,
    addSellerMessage,
    isResizing,
    showAIPanel,
    roomPlatforms,
    getRoomPlatform
  ]);

  return (
    <DealModalContext.Provider value={contextValue}>
      {children}
    </DealModalContext.Provider>
  );
}

export function useDealModal() {
  const context = useContext(DealModalContext);
  if (context === undefined) {
    throw new Error('useDealModal must be used within a DealModalProvider');
  }
  return context;
}