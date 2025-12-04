/**
 * Mock Data for Investor Demo
 * 투자자 시연용 목업 데이터
 *
 * IMPORTANT: All names are FAKE/FICTIONAL
 * - Company names: Not real shipping/oil companies
 * - Vessel names: Fictional vessel names
 * - Person names: Fictional names
 */

import {
  DealScoreboard,
  DealStatistics,
  ChatMessage,
  RoomInfo,
  AISuggestion,
  SellerContext,
  DealStage,
} from "@/types";

// ============================================
// FICTIONAL Company/Vessel/Person Names
// ============================================

// Fictional Buyer Companies (Shipping)
const FAKE_BUYERS = {
  BLUWAVE: "BlueWave Shipping Co.",
  STARLINE: "StarLine Maritime",
  OCEANIC: "Oceanic Transport Ltd.",
  PACIFICA: "Pacifica Carriers",
  GOLDEN: "Golden Horizon Lines",
  NEPTUNE: "Neptune Logistics",
  ATLAS: "Atlas Ocean Corp",
  HORIZON: "Horizon Marine",
  CRYSTAL: "Crystal Seas Trading",
  VOYAGER: "Voyager Shipping",
};

// Fictional Seller Companies (Fuel Suppliers)
const FAKE_SELLERS = {
  SUNPETRO: "SunPetro Energy",
  SEAFUEL: "SeaFuel Korea",
  MARINEOIL: "MarineOil Corp",
  BLUEFUEL: "BlueFuel Trading",
  OCEANGAS: "OceanGas Supply",
  ASIAENERGY: "Asia Energy Partners",
  PACIFICOIL: "Pacific Oil Trading",
};

// Fictional Vessel Names
const FAKE_VESSELS = {
  BLUWAVE1: "BLUE PIONEER",
  STARLINE1: "STAR EXCELLENCE",
  OCEANIC1: "OCEANIC DREAM",
  PACIFICA1: "PACIFIC FORTUNE",
  GOLDEN1: "GOLDEN WAVE",
  NEPTUNE1: "NEPTUNE GLORY",
  ATLAS1: "ATLAS VICTORY",
  HORIZON1: "HORIZON STAR",
  CRYSTAL1: "CRYSTAL QUEEN",
  VOYAGER1: "VOYAGER SPIRIT",
};

// Fictional Person Names
const FAKE_PERSONS = {
  BUYER1: "J. Park",
  BUYER2: "S. Kim",
  BUYER3: "M. Lee",
  BUYER4: "H. Chen",
  BUYER5: "T. Wong",
  SELLER1: "Manager Choi",
  SELLER2: "Director Yoon",
  SELLER3: "Team Lead Han",
  SELLER4: "Supervisor Lim",
};

// ============================================
// Deal Scoreboard Mock Data (15개)
// 모든 딜에는 반드시 port가 있어야 함
// ============================================

// 고정된 기준 시간 (Hydration 오류 방지)
const BASE_TIME = new Date("2025-12-04T12:00:00Z").getTime();
const now = { getTime: () => BASE_TIME };
const today = "2025-12-04";
const yesterday = "2025-12-03";

export const MOCK_DEALS: DealScoreboard[] = [
  // Stage: inquiry (2개) - FullContext 수집 중 (포트는 항상 있어야 함)
  {
    id: 1,
    session_id: "mock-001",
    customer_room_name: FAKE_BUYERS.BLUWAVE,
    vessel_name: FAKE_VESSELS.BLUWAVE1,
    imo: "9811000",
    port: "Busan",
    fuel_type: "VLSFO",
    quantity: "500MT",
    fuel_type2: null,
    quantity2: null,
    delivery_date: "2025-12-10",
    status: "active",
    stage: "inquiry",
    created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    closed_at: null,
    final_price: null,
    selected_trader: null,
    closing_reason: null,
    total_quotes_received: 0,
    negotiation_rounds: 0,
    duration_minutes: 30,
    response_time_minutes: null,
    quote_count: 0,
    last_quote_time: null,
    requested_traders: [],
    seller_contexts: {},
    unread_count: 2,
    buyer_unread_count: 2,
    seller_unread_count: 0,
  },
  {
    id: 2,
    session_id: "mock-002",
    customer_room_name: FAKE_BUYERS.STARLINE,
    vessel_name: FAKE_VESSELS.STARLINE1,
    imo: "9812345",
    port: "Singapore", // 포트 필수
    fuel_type: "MGO",
    quantity: "200MT",
    fuel_type2: null,
    quantity2: null,
    delivery_date: "2025-12-12",
    status: "active",
    stage: "inquiry",
    created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
    closed_at: null,
    final_price: null,
    selected_trader: null,
    closing_reason: null,
    total_quotes_received: 0,
    negotiation_rounds: 0,
    duration_minutes: 15,
    response_time_minutes: null,
    quote_count: 0,
    last_quote_time: null,
    requested_traders: [],
    seller_contexts: {},
    unread_count: 1,
    buyer_unread_count: 1,
    seller_unread_count: 0,
  },

  // Stage: deal_started (2개) - 판매처에 인쿼리 송신
  {
    id: 3,
    session_id: "mock-003",
    customer_room_name: FAKE_BUYERS.OCEANIC,
    vessel_name: FAKE_VESSELS.OCEANIC1,
    imo: "9778791",
    port: "Singapore",
    fuel_type: "VLSFO",
    quantity: "1000MT",
    fuel_type2: "MGO",
    quantity2: "100MT",
    delivery_date: "2025-12-12",
    status: "active",
    stage: "deal_started",
    created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    closed_at: null,
    final_price: null,
    selected_trader: null,
    closing_reason: null,
    total_quotes_received: 0,
    negotiation_rounds: 0,
    duration_minutes: 120,
    response_time_minutes: null,
    quote_count: 0,
    last_quote_time: null,
    requested_traders: [FAKE_SELLERS.SUNPETRO, FAKE_SELLERS.SEAFUEL, FAKE_SELLERS.MARINEOIL],
    seller_contexts: {
      [FAKE_SELLERS.SUNPETRO]: { status: "waiting_quote", quote: null, requested_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), contacted_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString() },
      [FAKE_SELLERS.SEAFUEL]: { status: "waiting_quote", quote: null, requested_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), contacted_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString() },
      [FAKE_SELLERS.MARINEOIL]: { status: "waiting_quote", quote: null, requested_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), contacted_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString() },
    },
    unread_count: 0,
    buyer_unread_count: 0,
    seller_unread_count: 0,
  },
  {
    id: 4,
    session_id: "mock-004",
    customer_room_name: FAKE_BUYERS.PACIFICA,
    vessel_name: FAKE_VESSELS.PACIFICA1,
    imo: "9454436",
    port: "Ulsan",
    fuel_type: "HSFO", // HSFO 가격만 견적
    quantity: "800MT",
    fuel_type2: null,
    quantity2: null,
    delivery_date: "2025-12-15",
    status: "active",
    stage: "deal_started",
    created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
    closed_at: null,
    final_price: null,
    selected_trader: null,
    closing_reason: null,
    total_quotes_received: 0,
    negotiation_rounds: 0,
    duration_minutes: 60,
    response_time_minutes: null,
    quote_count: 0,
    last_quote_time: null,
    requested_traders: [FAKE_SELLERS.BLUEFUEL, FAKE_SELLERS.SUNPETRO],
    seller_contexts: {
      [FAKE_SELLERS.BLUEFUEL]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$582/MT",  // HSFO
          barge_fee: "$800",
          term: "30 days",
          supplier: FAKE_SELLERS.BLUEFUEL,
          fuel1_margin: "$8/MT",
        },
        earliest: "2025-12-08",
        received_at: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      },
      [FAKE_SELLERS.SUNPETRO]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$720/MT",  // HSFO
          barge_fee: "$1200",
          term: "30 days",
          supplier: FAKE_SELLERS.SUNPETRO,
          fuel1_margin: "$10/MT",
        },
        earliest: "2025-12-08",
        received_at: new Date(now.getTime() - 180 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      },
    },
    unread_count: 0,
    buyer_unread_count: 0,
    seller_unread_count: 0,
  },

  // Stage: quote_collecting (3개) - 오퍼가격 취합 단계
  // VLSFO 딜 - VLSFO 가격으로 견적
  {
    id: 5,
    session_id: "mock-005",
    customer_room_name: FAKE_BUYERS.GOLDEN,
    vessel_name: FAKE_VESSELS.GOLDEN1,
    imo: "9704657",
    port: "Busan",
    fuel_type: "VLSFO",
    quantity: "600MT",
    fuel_type2: "MGO",
    quantity2: "50MT",
    delivery_date: "2025-12-08",
    status: "active",
    stage: "quote_collecting",
    created_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    closed_at: null,
    final_price: null,
    selected_trader: null,
    closing_reason: null,
    total_quotes_received: 2,
    negotiation_rounds: 0,
    duration_minutes: 240,
    response_time_minutes: 45,
    quote_count: 2,
    last_quote_time: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    requested_traders: [FAKE_SELLERS.SUNPETRO, FAKE_SELLERS.SEAFUEL, FAKE_SELLERS.MARINEOIL],
    seller_contexts: {
      [FAKE_SELLERS.SUNPETRO]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$582/MT",  // VLSFO
          fuel2_price: "$720/MT",  // MGO
          barge_fee: "$800",
          term: "30 days",
          supplier: FAKE_SELLERS.SUNPETRO,
          fuel1_margin: "$8/MT",
          fuel2_margin: "$12/MT",
        },
        earliest: "2025-12-08",
        received_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      },
      [FAKE_SELLERS.SEAFUEL]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$578/MT",  // VLSFO
          fuel2_price: "$715/MT",  // MGO
          barge_fee: "$500",
          term: "30 days",
          supplier: FAKE_SELLERS.SEAFUEL,
          fuel1_margin: "$12/MT",
          fuel2_margin: "$17/MT",
        },
        earliest: "2025-12-09",
        received_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      },
      [FAKE_SELLERS.MARINEOIL]: {
        status: "waiting_quote",
        quote: null,
        requested_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      },
    },
    unread_count: 3,
    buyer_unread_count: 0,
    seller_unread_count: 3,
  },
  // VLSFO 싱가포르 딜
  {
    id: 6,
    session_id: "mock-006",
    customer_room_name: FAKE_BUYERS.NEPTUNE,
    vessel_name: FAKE_VESSELS.NEPTUNE1,
    imo: "9501368",
    port: "Singapore",
    fuel_type: "VLSFO",
    quantity: "1200MT",
    fuel_type2: null,
    quantity2: null,
    delivery_date: "2025-12-11",
    status: "active",
    stage: "quote_collecting",
    created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    closed_at: null,
    final_price: null,
    selected_trader: null,
    closing_reason: null,
    total_quotes_received: 3,
    negotiation_rounds: 0,
    duration_minutes: 300,
    response_time_minutes: 35,
    quote_count: 3,
    last_quote_time: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    requested_traders: [FAKE_SELLERS.ASIAENERGY, FAKE_SELLERS.PACIFICOIL, FAKE_SELLERS.OCEANGAS],
    seller_contexts: {
      [FAKE_SELLERS.ASIAENERGY]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$565/MT",  // VLSFO
          barge_fee: "$1200",
          term: "15 days",
          supplier: FAKE_SELLERS.ASIAENERGY,
          fuel1_margin: "$15/MT",
        },
        earliest: "2025-12-11",
        received_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      },
      [FAKE_SELLERS.PACIFICOIL]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$568/MT",  // VLSFO
          barge_fee: "$900",
          term: "15 days",
          supplier: FAKE_SELLERS.PACIFICOIL,
          fuel1_margin: "$12/MT",
        },
        earliest: "2025-12-11",
        received_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      },
      [FAKE_SELLERS.OCEANGAS]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$572/MT",  // VLSFO
          barge_fee: "$700",
          term: "30 days",
          supplier: FAKE_SELLERS.OCEANGAS,
          fuel1_margin: "$8/MT",
        },
        earliest: "2025-12-10",
        received_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      },
    },
    unread_count: 1,
    buyer_unread_count: 0,
    seller_unread_count: 1,
  },
  // VLSFO + LSMGO 여수 딜
  {
    id: 7,
    session_id: "mock-007",
    customer_room_name: FAKE_BUYERS.ATLAS,
    vessel_name: FAKE_VESSELS.ATLAS1,
    imo: "9703318",
    port: "Yeosu",
    fuel_type: "VLSFO",
    quantity: "900MT",
    fuel_type2: "LSMGO",
    quantity2: "80MT",
    delivery_date: "2025-12-09",
    status: "active",
    stage: "quote_collecting",
    created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    closed_at: null,
    final_price: null,
    selected_trader: null,
    closing_reason: null,
    total_quotes_received: 1,
    negotiation_rounds: 0,
    duration_minutes: 180,
    response_time_minutes: 50,
    quote_count: 1,
    last_quote_time: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    requested_traders: [FAKE_SELLERS.SUNPETRO, FAKE_SELLERS.BLUEFUEL],
    seller_contexts: {
      [FAKE_SELLERS.SUNPETRO]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$580/MT",  // VLSFO
          fuel2_price: "$730/MT",  // LSMGO
          barge_fee: "$600",
          term: "30 days",
          supplier: FAKE_SELLERS.SUNPETRO,
          fuel1_margin: "$10/MT",
          fuel2_margin: "$15/MT",
        },
        earliest: "2025-12-09",
        received_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString(),
      },
      [FAKE_SELLERS.BLUEFUEL]: {
        status: "waiting_quote",
        quote: null,
        requested_at: new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString(),
      },
    },
    unread_count: 2,
    buyer_unread_count: 1,
    seller_unread_count: 1,
  },

  // Stage: customer_feedback (2개) - 선주 피드백 대기
  {
    id: 8,
    session_id: "mock-008",
    customer_room_name: FAKE_BUYERS.HORIZON,
    vessel_name: FAKE_VESSELS.HORIZON1,
    imo: "9516428",
    port: "Busan",
    fuel_type: "VLSFO",
    quantity: "700MT",
    fuel_type2: null,
    quantity2: null,
    delivery_date: "2025-12-07",
    status: "quoted",
    stage: "customer_feedback",
    created_at: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    closed_at: null,
    final_price: null,
    selected_trader: null,
    closing_reason: null,
    total_quotes_received: 3,
    negotiation_rounds: 0,
    duration_minutes: 480,
    response_time_minutes: 40,
    quote_count: 3,
    last_quote_time: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    requested_traders: [FAKE_SELLERS.SUNPETRO, FAKE_SELLERS.SEAFUEL, FAKE_SELLERS.MARINEOIL],
    seller_contexts: {
      [FAKE_SELLERS.SUNPETRO]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$575/MT",  // VLSFO
          barge_fee: "$650",
          term: "30 days",
          supplier: FAKE_SELLERS.SUNPETRO,
          fuel1_margin: "$10/MT",
        },
        earliest: "2025-12-07",
        received_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString(),
      },
      [FAKE_SELLERS.SEAFUEL]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$572/MT",  // VLSFO
          barge_fee: "$750",
          term: "30 days",
          supplier: FAKE_SELLERS.SEAFUEL,
          fuel1_margin: "$13/MT",
        },
        earliest: "2025-12-07",
        received_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString(),
      },
      [FAKE_SELLERS.MARINEOIL]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$577/MT",  // VLSFO
          barge_fee: "$550",
          term: "30 days",
          supplier: FAKE_SELLERS.MARINEOIL,
          fuel1_margin: "$8/MT",
        },
        earliest: "2025-12-08",
        received_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString(),
      },
    },
    unread_count: 0,
    buyer_unread_count: 0,
    seller_unread_count: 0,
  },
  {
    id: 9,
    session_id: "mock-009",
    customer_room_name: FAKE_BUYERS.CRYSTAL,
    vessel_name: FAKE_VESSELS.CRYSTAL1,
    imo: "9806079",
    port: "Singapore",
    fuel_type: "VLSFO",
    quantity: "1500MT",
    fuel_type2: "MGO",
    quantity2: "150MT",
    delivery_date: "2025-12-14",
    status: "quoted",
    stage: "customer_feedback",
    created_at: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    closed_at: null,
    final_price: null,
    selected_trader: null,
    closing_reason: null,
    total_quotes_received: 2,
    negotiation_rounds: 0,
    duration_minutes: 600,
    response_time_minutes: 55,
    quote_count: 2,
    last_quote_time: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    requested_traders: [FAKE_SELLERS.ASIAENERGY, FAKE_SELLERS.OCEANGAS],
    seller_contexts: {
      [FAKE_SELLERS.ASIAENERGY]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$560/MT",  // VLSFO
          fuel2_price: "$705/MT",  // MGO
          barge_fee: "$1500",
          term: "15 days",
          supplier: FAKE_SELLERS.ASIAENERGY,
          fuel1_margin: "$20/MT",
          fuel2_margin: "$27/MT",
        },
        earliest: "2025-12-14",
        received_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 9 * 60 * 60 * 1000).toISOString(),
      },
      [FAKE_SELLERS.OCEANGAS]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$567/MT",  // VLSFO
          fuel2_price: "$712/MT",  // MGO
          barge_fee: "$1100",
          term: "30 days",
          supplier: FAKE_SELLERS.OCEANGAS,
          fuel1_margin: "$13/MT",
          fuel2_margin: "$20/MT",
        },
        earliest: "2025-12-13",
        received_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 9 * 60 * 60 * 1000).toISOString(),
      },
    },
    unread_count: 1,
    buyer_unread_count: 1,
    seller_unread_count: 0,
  },

  // Stage: negotiating (2개) - 협상 중
  {
    id: 10,
    session_id: "mock-010",
    customer_room_name: FAKE_BUYERS.VOYAGER,
    vessel_name: FAKE_VESSELS.VOYAGER1,
    imo: "9863297",
    port: "Busan",
    fuel_type: "VLSFO",
    quantity: "1100MT",
    fuel_type2: null,
    quantity2: null,
    delivery_date: "2025-12-06",
    status: "negotiating",
    stage: "renegotiating",
    created_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    closed_at: null,
    final_price: null,
    selected_trader: null,
    closing_reason: null,
    total_quotes_received: 3,
    negotiation_rounds: 2,
    duration_minutes: 720,
    response_time_minutes: 35,
    quote_count: 3,
    last_quote_time: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    requested_traders: [FAKE_SELLERS.SUNPETRO, FAKE_SELLERS.SEAFUEL, FAKE_SELLERS.MARINEOIL],
    seller_contexts: {
      [FAKE_SELLERS.SUNPETRO]: {
        status: "renegotiating",
        quote: {
          fuel1_price: "$570/MT",  // VLSFO
          barge_fee: "$700",
          term: "30 days",
          supplier: FAKE_SELLERS.SUNPETRO,
          fuel1_margin: "$10/MT",
        },
        earliest: "2025-12-06",
        received_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 11 * 60 * 60 * 1000).toISOString(),
      },
      [FAKE_SELLERS.SEAFUEL]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$568/MT",  // VLSFO
          barge_fee: "$750",
          term: "30 days",
          supplier: FAKE_SELLERS.SEAFUEL,
          fuel1_margin: "$12/MT",
        },
        earliest: "2025-12-06",
        received_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 11 * 60 * 60 * 1000).toISOString(),
      },
      [FAKE_SELLERS.MARINEOIL]: {
        status: "no_offer",
        quote: null,
        no_offer_reason: "Out of stock",
        contacted_at: new Date(now.getTime() - 11 * 60 * 60 * 1000).toISOString(),
      },
    },
    unread_count: 2,
    buyer_unread_count: 1,
    seller_unread_count: 1,
  },
  // HSFO 딜 - HSFO 가격으로 견적
  {
    id: 11,
    session_id: "mock-011",
    customer_room_name: FAKE_BUYERS.BLUWAVE,
    vessel_name: "BLUE HORIZON",
    imo: "9674671",
    port: "Ulsan",
    fuel_type: "HSFO",
    quantity: "500MT",
    fuel_type2: "LSMGO",
    quantity2: "40MT",
    delivery_date: "2025-12-05",
    status: "negotiating",
    stage: "seller_feedback",
    created_at: new Date(now.getTime() - 15 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    closed_at: null,
    final_price: null,
    selected_trader: null,
    closing_reason: null,
    total_quotes_received: 2,
    negotiation_rounds: 1,
    duration_minutes: 900,
    response_time_minutes: 42,
    quote_count: 2,
    last_quote_time: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    requested_traders: [FAKE_SELLERS.BLUEFUEL, FAKE_SELLERS.SUNPETRO],
    seller_contexts: {
      [FAKE_SELLERS.BLUEFUEL]: {
        status: "renegotiating",
        quote: {
          fuel1_price: "$485/MT",  // HSFO (HSFO는 VLSFO보다 저렴)
          fuel2_price: "$725/MT",  // LSMGO
          barge_fee: "$450",
          term: "30 days",
          supplier: FAKE_SELLERS.BLUEFUEL,
          fuel1_margin: "$15/MT",
          fuel2_margin: "$18/MT",
        },
        earliest: "2025-12-05",
        received_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString(),
      },
      [FAKE_SELLERS.SUNPETRO]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$490/MT",  // HSFO
          fuel2_price: "$730/MT",  // LSMGO
          barge_fee: "$10,500",
          term: "30 days",
          supplier: FAKE_SELLERS.SUNPETRO,
          fuel1_margin: "$10/MT",
          fuel2_margin: "$13/MT",
        },
        earliest: "2025-12-05",
        received_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        contacted_at: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString(),
      },
    },
    unread_count: 1,
    buyer_unread_count: 0,
    seller_unread_count: 1,
  },

  // Stage: deal_done (3개) - 딜 완료
  {
    id: 12,
    session_id: "mock-012",
    customer_room_name: FAKE_BUYERS.STARLINE,
    vessel_name: "STAR NAVIGATOR",
    imo: "9690551",
    port: "Busan",
    fuel_type: "VLSFO",
    quantity: "800MT",
    fuel_type2: null,
    quantity2: null,
    delivery_date: "2025-12-03",
    status: "closed_success",
    stage: "deal_done",
    created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    closed_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    final_price: 571,
    selected_trader: FAKE_SELLERS.SEAFUEL,
    closing_reason: "Best price and earliest delivery",
    total_quotes_received: 3,
    negotiation_rounds: 1,
    duration_minutes: 1080,
    response_time_minutes: 38,
    quote_count: 3,
    last_quote_time: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
    requested_traders: [FAKE_SELLERS.SUNPETRO, FAKE_SELLERS.SEAFUEL, FAKE_SELLERS.MARINEOIL],
    seller_contexts: {
      [FAKE_SELLERS.SEAFUEL]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$571/MT",  // VLSFO
          barge_fee: "$650",
          term: "30 days",
          supplier: FAKE_SELLERS.SEAFUEL,
          fuel1_margin: "$14/MT",
        },
        earliest: "2025-12-03",
        contacted_at: new Date(now.getTime() - 22 * 60 * 60 * 1000).toISOString(),
      },
    },
    unread_count: 0,
    buyer_unread_count: 0,
    seller_unread_count: 0,
  },
  {
    id: 13,
    session_id: "mock-013",
    customer_room_name: FAKE_BUYERS.OCEANIC,
    vessel_name: "OCEANIC STAR",
    imo: "9448031",
    port: "Singapore",
    fuel_type: "VLSFO",
    quantity: "650MT",
    fuel_type2: "MGO",
    quantity2: "60MT",
    delivery_date: "2025-12-02",
    status: "closed_success",
    stage: "deal_done",
    created_at: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    closed_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    final_price: 562,
    selected_trader: FAKE_SELLERS.ASIAENERGY,
    closing_reason: "Competitive price with good terms",
    total_quotes_received: 2,
    negotiation_rounds: 0,
    duration_minutes: 1440,
    response_time_minutes: 45,
    quote_count: 2,
    last_quote_time: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
    requested_traders: [FAKE_SELLERS.ASIAENERGY, FAKE_SELLERS.OCEANGAS],
    seller_contexts: {
      [FAKE_SELLERS.ASIAENERGY]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$562/MT",  // VLSFO
          fuel2_price: "$708/MT",  // MGO
          barge_fee: "$17,000",
          term: "15 days",
          supplier: FAKE_SELLERS.ASIAENERGY,
          fuel1_margin: "$18/MT",
          fuel2_margin: "$24/MT",
        },
        earliest: "2025-12-02",
        contacted_at: new Date(now.getTime() - 34 * 60 * 60 * 1000).toISOString(),
      },
    },
    unread_count: 0,
    buyer_unread_count: 0,
    seller_unread_count: 0,
  },
  {
    id: 14,
    session_id: "mock-014",
    customer_room_name: FAKE_BUYERS.GOLDEN,
    vessel_name: "GOLDEN SUNRISE",
    imo: "9893890",
    port: "Yeosu",
    fuel_type: "VLSFO",
    quantity: "1000MT",
    fuel_type2: null,
    quantity2: null,
    delivery_date: "2025-12-01",
    status: "closed_success",
    stage: "deal_done",
    created_at: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
    closed_at: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
    final_price: 575,
    selected_trader: FAKE_SELLERS.SUNPETRO,
    closing_reason: "Long-term relationship",
    total_quotes_received: 2,
    negotiation_rounds: 0,
    duration_minutes: 1680,
    response_time_minutes: 32,
    quote_count: 2,
    last_quote_time: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    requested_traders: [FAKE_SELLERS.SUNPETRO, FAKE_SELLERS.BLUEFUEL],
    seller_contexts: {
      [FAKE_SELLERS.SUNPETRO]: {
        status: "quote_received",
        quote: {
          fuel1_price: "$575/MT",  // VLSFO
          barge_fee: "$600",
          term: "30 days",
          supplier: FAKE_SELLERS.SUNPETRO,
          fuel1_margin: "$10/MT",
        },
        earliest: "2025-12-01",
        contacted_at: new Date(now.getTime() - 46 * 60 * 60 * 1000).toISOString(),
      },
    },
    unread_count: 0,
    buyer_unread_count: 0,
    seller_unread_count: 0,
  },

  // Stage: lost (1개) - 로스트
  {
    id: 15,
    session_id: "mock-015",
    customer_room_name: FAKE_BUYERS.NEPTUNE,
    vessel_name: "NEPTUNE CHALLENGER",
    imo: "9608265",
    port: "Busan",
    fuel_type: "VLSFO",
    quantity: "400MT",
    fuel_type2: null,
    quantity2: null,
    delivery_date: "2025-12-04",
    status: "closed_lost",
    stage: "lost",
    created_at: new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
    closed_at: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
    final_price: null,
    selected_trader: null,
    closing_reason: "Customer chose competitor",
    total_quotes_received: 2,
    negotiation_rounds: 1,
    duration_minutes: 1200,
    response_time_minutes: 55,
    quote_count: 2,
    last_quote_time: new Date(now.getTime() - 15 * 60 * 60 * 1000).toISOString(),
    requested_traders: [FAKE_SELLERS.SUNPETRO, FAKE_SELLERS.SEAFUEL],
    seller_contexts: {},
    unread_count: 0,
    buyer_unread_count: 0,
    seller_unread_count: 0,
  },
];

// ============================================
// Chat Rooms Mock Data
// ============================================

export const MOCK_CHAT_ROOMS: RoomInfo[] = [
  // Buyer (Customer) Rooms
  { room_name: FAKE_BUYERS.BLUWAVE, platform: "com.kakao.talk", category: "buy" },
  { room_name: FAKE_BUYERS.STARLINE, platform: "com.kakao.talk", category: "buy" },
  { room_name: FAKE_BUYERS.OCEANIC, platform: "com.whatsapp", category: "buy" },
  { room_name: FAKE_BUYERS.PACIFICA, platform: "com.whatsapp", category: "buy" },
  { room_name: FAKE_BUYERS.GOLDEN, platform: "com.kakao.talk", category: "buy" },
  { room_name: FAKE_BUYERS.NEPTUNE, platform: "com.whatsapp", category: "buy" },
  { room_name: FAKE_BUYERS.ATLAS, platform: "com.whatsapp", category: "buy" },
  { room_name: FAKE_BUYERS.HORIZON, platform: "com.wechat", category: "buy" },
  { room_name: FAKE_BUYERS.CRYSTAL, platform: "com.kakao.talk", category: "buy" },
  { room_name: FAKE_BUYERS.VOYAGER, platform: "com.kakao.talk", category: "buy" },

  // Seller (Trader) Rooms
  { room_name: FAKE_SELLERS.SUNPETRO, platform: "com.kakao.yellowid", category: "sell" },
  { room_name: FAKE_SELLERS.SEAFUEL, platform: "com.kakao.yellowid", category: "sell" },
  { room_name: FAKE_SELLERS.MARINEOIL, platform: "com.kakao.yellowid", category: "sell" },
  { room_name: FAKE_SELLERS.BLUEFUEL, platform: "com.kakao.yellowid", category: "sell" },
  { room_name: FAKE_SELLERS.ASIAENERGY, platform: "com.wechat", category: "sell" },
  { room_name: FAKE_SELLERS.OCEANGAS, platform: "com.whatsapp", category: "sell" },
  { room_name: FAKE_SELLERS.PACIFICOIL, platform: "com.wechat", category: "sell" },

  // Other
  { room_name: "Harold Team", platform: "com.kakao.talk", category: "other" },
];

// ============================================
// Chat Messages Mock Data - 모든 딜에 채팅 있음
// ============================================

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  // === BUYER CHATS ===

  // mock-001: BlueWave (inquiry stage)
  [FAKE_BUYERS.BLUWAVE]: [
    {
      message_id: 1001,
      room_name: FAKE_BUYERS.BLUWAVE,
      sender: FAKE_PERSONS.BUYER1,
      message: "Hello, we need bunker fuel for BLUE PIONEER.",
      package_name: "com.kakao.talk",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
    {
      message_id: 1002,
      room_name: FAKE_BUYERS.BLUWAVE,
      sender: FAKE_PERSONS.BUYER1,
      message: "VLSFO 500MT needed at Busan port.\nETA: December 10th.",
      package_name: "com.kakao.talk",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 28 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 28 * 60 * 1000).toISOString(),
    },
    {
      message_id: 1003,
      room_name: FAKE_BUYERS.BLUWAVE,
      sender: "Harold AI",
      message: "Thank you for your inquiry. We have received your request and will provide you with competitive quotes shortly.",
      package_name: "com.kakao.talk",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
    },
    {
      message_id: 1004,
      room_name: FAKE_BUYERS.BLUWAVE,
      sender: FAKE_PERSONS.BUYER1,
      message: "IMO number is 9811000. Thanks.",
      package_name: "com.kakao.talk",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
    },
    {
      message_id: 1005,
      room_name: FAKE_BUYERS.BLUWAVE,
      sender: "Harold AI",
      message: "Perfect, we have all the required information. I'll contact our suppliers now and get back to you with the best offers.",
      package_name: "com.kakao.talk",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 18 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 18 * 60 * 1000).toISOString(),
    },
  ],

  // mock-002: StarLine (inquiry stage)
  [FAKE_BUYERS.STARLINE]: [
    {
      message_id: 1101,
      room_name: FAKE_BUYERS.STARLINE,
      sender: FAKE_PERSONS.BUYER2,
      message: "Hi, need MGO for STAR EXCELLENCE at Singapore.",
      package_name: "com.kakao.talk",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    },
    {
      message_id: 1102,
      room_name: FAKE_BUYERS.STARLINE,
      sender: FAKE_PERSONS.BUYER2,
      message: "MGO 200MT\nETA: Dec 12\nIMO: 9812345",
      package_name: "com.kakao.talk",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
    },
    {
      message_id: 1103,
      room_name: FAKE_BUYERS.STARLINE,
      sender: "Harold AI",
      message: "Thank you. We'll get you competitive MGO quotes for Singapore shortly.",
      package_name: "com.kakao.talk",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    },
  ],

  // mock-003: Oceanic (deal_started stage)
  [FAKE_BUYERS.OCEANIC]: [
    {
      message_id: 1201,
      room_name: FAKE_BUYERS.OCEANIC,
      sender: FAKE_PERSONS.BUYER3,
      message: "Need bunker for OCEANIC DREAM at Singapore.",
      package_name: "com.whatsapp",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 1202,
      room_name: FAKE_BUYERS.OCEANIC,
      sender: FAKE_PERSONS.BUYER3,
      message: "VLSFO 1000MT + MGO 100MT\nETA: Dec 12\nIMO: 9778791",
      package_name: "com.whatsapp",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 1.9 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 1.9 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 1203,
      room_name: FAKE_BUYERS.OCEANIC,
      sender: "Harold AI",
      message: "Understood. We're now reaching out to our Singapore suppliers for VLSFO and MGO quotes.",
      package_name: "com.whatsapp",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 1.8 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 1.8 * 60 * 60 * 1000).toISOString(),
    },
  ],

  // mock-004: Pacifica (deal_started stage - HSFO)
  [FAKE_BUYERS.PACIFICA]: [
    {
      message_id: 1301,
      room_name: FAKE_BUYERS.PACIFICA,
      sender: FAKE_PERSONS.BUYER4,
      message: "Need HSFO for PACIFIC FORTUNE at Ulsan.",
      package_name: "com.whatsapp",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 1302,
      room_name: FAKE_BUYERS.PACIFICA,
      sender: FAKE_PERSONS.BUYER4,
      message: "HSFO 800MT\nETA: Dec 15\nIMO: 9454436",
      package_name: "com.whatsapp",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 55 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 55 * 60 * 1000).toISOString(),
    },
    {
      message_id: 1303,
      room_name: FAKE_BUYERS.PACIFICA,
      sender: "Harold AI",
      message: "Thank you. Contacting Ulsan suppliers for HSFO quotes now.",
      package_name: "com.whatsapp",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
    },
  ],

  // mock-005: Golden (quote_collecting stage)
  [FAKE_BUYERS.GOLDEN]: [
    {
      message_id: 2001,
      room_name: FAKE_BUYERS.GOLDEN,
      sender: FAKE_PERSONS.BUYER2,
      message: "Hi, we need bunker for GOLDEN WAVE at Busan.",
      package_name: "com.kakao.talk",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 2002,
      room_name: FAKE_BUYERS.GOLDEN,
      sender: FAKE_PERSONS.BUYER2,
      message: "VLSFO 600MT + MGO 50MT\nETA: Dec 8th\nIMO: 9704657",
      package_name: "com.kakao.talk",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 3.9 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 3.9 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 2003,
      room_name: FAKE_BUYERS.GOLDEN,
      sender: "Harold AI",
      message: "Thank you for your inquiry. We will send you the best offers shortly.",
      package_name: "com.kakao.talk",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 3.8 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 3.8 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 2004,
      room_name: FAKE_BUYERS.GOLDEN,
      sender: "Harold AI",
      message: "[Quote Update]\n\nWe have received 2 quotes so far:\n\n1. SunPetro Energy\n   - VLSFO: $582/MT\n   - MGO: $720/MT\n   - Earliest: Dec 8\n\n2. SeaFuel Korea (Best Price)\n   - VLSFO: $578/MT\n   - MGO: $715/MT\n   - Earliest: Dec 9\n\nWaiting for 1 more supplier. Would you like to proceed with current offers?",
      package_name: "com.kakao.talk",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    },
    {
      message_id: 2005,
      room_name: FAKE_BUYERS.GOLDEN,
      sender: FAKE_PERSONS.BUYER2,
      message: "Let's wait for the third quote. When do you expect it?",
      package_name: "com.kakao.talk",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    },
  ],

  // mock-006: Neptune (quote_collecting stage)
  [FAKE_BUYERS.NEPTUNE]: [
    {
      message_id: 7001,
      room_name: FAKE_BUYERS.NEPTUNE,
      sender: FAKE_PERSONS.BUYER4,
      message: "Need bunker quote for NEPTUNE GLORY at Singapore.",
      package_name: "com.whatsapp",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 7002,
      room_name: FAKE_BUYERS.NEPTUNE,
      sender: FAKE_PERSONS.BUYER4,
      message: "VLSFO 1200MT\nETA: Dec 11\nIMO: 9501368",
      package_name: "com.whatsapp",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 4.9 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 4.9 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 7003,
      room_name: FAKE_BUYERS.NEPTUNE,
      sender: "Harold AI",
      message: "Thank you. We'll reach out to our Singapore suppliers and provide quotes within the hour.",
      package_name: "com.whatsapp",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 4.8 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 4.8 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 7004,
      room_name: FAKE_BUYERS.NEPTUNE,
      sender: "Harold AI",
      message: "[Quotes Received]\n\nAll 3 quotes are in:\n\n1. Asia Energy: $565/MT (Earliest: Dec 11)\n2. Pacific Oil: $568/MT (Earliest: Dec 11)\n3. OceanGas: $572/MT (Earliest: Dec 10)\n\nAsia Energy offers the best price. Would you like to proceed?",
      package_name: "com.whatsapp",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
    },
  ],

  // mock-007: Atlas (quote_collecting stage)
  [FAKE_BUYERS.ATLAS]: [
    {
      message_id: 7101,
      room_name: FAKE_BUYERS.ATLAS,
      sender: FAKE_PERSONS.BUYER5,
      message: "Hi, need bunker for ATLAS VICTORY at Yeosu.",
      package_name: "com.whatsapp",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 7102,
      room_name: FAKE_BUYERS.ATLAS,
      sender: FAKE_PERSONS.BUYER5,
      message: "VLSFO 900MT + LSMGO 80MT\nETA: Dec 9\nIMO: 9703318",
      package_name: "com.whatsapp",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 2.9 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 2.9 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 7103,
      room_name: FAKE_BUYERS.ATLAS,
      sender: "Harold AI",
      message: "Got it. Contacting Yeosu suppliers now for VLSFO and LSMGO quotes.",
      package_name: "com.whatsapp",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 2.8 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 2.8 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 7104,
      room_name: FAKE_BUYERS.ATLAS,
      sender: "Harold AI",
      message: "[First Quote]\n\nSunPetro Energy:\n- VLSFO: $580/MT\n- LSMGO: $730/MT\n- Earliest: Dec 9\n\nWaiting for 1 more supplier.",
      package_name: "com.whatsapp",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
    },
  ],

  // mock-008: Horizon (customer_feedback stage)
  [FAKE_BUYERS.HORIZON]: [
    {
      message_id: 7201,
      room_name: FAKE_BUYERS.HORIZON,
      sender: FAKE_PERSONS.BUYER1,
      message: "Need bunker for HORIZON STAR at Busan.",
      package_name: "com.wechat",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 7202,
      room_name: FAKE_BUYERS.HORIZON,
      sender: FAKE_PERSONS.BUYER1,
      message: "VLSFO 700MT\nETA: Dec 7\nIMO: 9516428",
      package_name: "com.wechat",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 7.9 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 7.9 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 7203,
      room_name: FAKE_BUYERS.HORIZON,
      sender: "Harold AI",
      message: "[Final Quote Summary]\n\nAll 3 suppliers have quoted:\n\n1. SeaFuel Korea: $572/MT (Best Price, Dec 7)\n2. SunPetro: $575/MT (Dec 7)\n3. MarineOil: $577/MT (Dec 8)\n\nPlease let us know which one you'd like to proceed with.",
      package_name: "com.wechat",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 1.5 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 1.5 * 60 * 60 * 1000).toISOString(),
    },
  ],

  // mock-009: Crystal (customer_feedback stage)
  [FAKE_BUYERS.CRYSTAL]: [
    {
      message_id: 7301,
      room_name: FAKE_BUYERS.CRYSTAL,
      sender: FAKE_PERSONS.BUYER2,
      message: "Need bunker for CRYSTAL QUEEN at Singapore.",
      package_name: "com.kakao.talk",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 7302,
      room_name: FAKE_BUYERS.CRYSTAL,
      sender: FAKE_PERSONS.BUYER2,
      message: "VLSFO 1500MT + MGO 150MT\nETA: Dec 14\nIMO: 9806079",
      package_name: "com.kakao.talk",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 9.8 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 9.8 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 7303,
      room_name: FAKE_BUYERS.CRYSTAL,
      sender: "Harold AI",
      message: "[Quote Comparison]\n\n1. Asia Energy (Best):\n   - VLSFO: $560/MT\n   - MGO: $705/MT\n   - Earliest: Dec 14\n\n2. OceanGas:\n   - VLSFO: $567/MT\n   - MGO: $712/MT\n   - Earliest: Dec 13\n\nAsia Energy offers the best overall price. Please confirm to proceed.",
      package_name: "com.kakao.talk",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString(),
    },
  ],

  // mock-010: Voyager (negotiating stage)
  [FAKE_BUYERS.VOYAGER]: [
    {
      message_id: 5001,
      room_name: FAKE_BUYERS.VOYAGER,
      sender: FAKE_PERSONS.BUYER3,
      message: "We need bunker for VOYAGER SPIRIT at Busan port.",
      package_name: "com.kakao.talk",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 5002,
      room_name: FAKE_BUYERS.VOYAGER,
      sender: FAKE_PERSONS.BUYER3,
      message: "VLSFO 1100MT needed.\nDecember 6th arrival.\nTarget price: under $570",
      package_name: "com.kakao.talk",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 11.5 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 11.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 5003,
      room_name: FAKE_BUYERS.VOYAGER,
      sender: "Harold AI",
      message: "Understood. We'll get you the best price available.",
      package_name: "com.kakao.talk",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 11 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 11 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 5004,
      room_name: FAKE_BUYERS.VOYAGER,
      sender: "Harold AI",
      message: "[Quote Summary]\n\nSeaFuel Korea: $568/MT (Earliest: Dec 6)\nSunPetro Energy: $570/MT (Earliest: Dec 6)\n\nSeaFuel Korea meets your target price of under $570.\nWould you like to proceed?",
      package_name: "com.kakao.talk",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 5005,
      room_name: FAKE_BUYERS.VOYAGER,
      sender: FAKE_PERSONS.BUYER3,
      message: "Can you check if SeaFuel can do $565? With 1100MT volume they should give better price.",
      package_name: "com.kakao.talk",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 5006,
      room_name: FAKE_BUYERS.VOYAGER,
      sender: "Harold AI",
      message: "I'll contact SeaFuel Korea to negotiate for $565/MT. Will update you shortly.",
      package_name: "com.kakao.talk",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 1.5 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 1.5 * 60 * 60 * 1000).toISOString(),
    },
  ],

  // === SELLER CHATS ===

  // SunPetro Energy
  [FAKE_SELLERS.SUNPETRO]: [
    // mock-004 (PACIFIC FORTUNE, Ulsan, HSFO 800MT)
    {
      message_id: 3000,
      room_name: FAKE_SELLERS.SUNPETRO,
      sender: "Harold AI",
      message: "[Inquiry Request]\nVessel: PACIFIC FORTUNE (IMO: 9454436)\nPort: Ulsan\nFuel: HSFO 800MT\nETA: 2025-12-15\n\nPlease provide your best quote.",
      package_name: "com.kakao.yellowid",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 3000.1,
      room_name: FAKE_SELLERS.SUNPETRO,
      sender: FAKE_PERSONS.SELLER1,
      message: "[Quote]\nHSFO: $720/MT\nBarge Fee: $1,200\nEarliest: Dec 8th\nTerm: 30 days",
      package_name: "com.kakao.yellowid",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 180 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 180 * 60 * 1000).toISOString(),
    },
    // mock-005 (GOLDEN WAVE, Busan, VLSFO + MGO)
    {
      message_id: 3001,
      room_name: FAKE_SELLERS.SUNPETRO,
      sender: "Harold AI",
      message: "[Inquiry Request]\nVessel: GOLDEN WAVE (IMO: 9704657)\nPort: Busan\nFuel: VLSFO 600MT + MGO 50MT\nETA: 2025-12-08\n\nPlease provide your best quote.",
      package_name: "com.kakao.yellowid",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 3.5 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 3.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 3002,
      room_name: FAKE_SELLERS.SUNPETRO,
      sender: FAKE_PERSONS.SELLER1,
      message: "Received. Let me check availability.",
      package_name: "com.kakao.yellowid",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 3003,
      room_name: FAKE_SELLERS.SUNPETRO,
      sender: FAKE_PERSONS.SELLER1,
      message: "[Quote]\nVLSFO: $582/MT\nMGO: $720/MT\nBarge Fee: $800\nEarliest: Dec 8th\nTerm: 30 days",
      package_name: "com.kakao.yellowid",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 3004,
      room_name: FAKE_SELLERS.SUNPETRO,
      sender: "Harold AI",
      message: "Thank you for the quote. We'll get back to you with the customer's decision.",
      package_name: "com.kakao.yellowid",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 55 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 55 * 60 * 1000).toISOString(),
    },
  ],

  // SeaFuel Korea
  [FAKE_SELLERS.SEAFUEL]: [
    {
      message_id: 4001,
      room_name: FAKE_SELLERS.SEAFUEL,
      sender: "Harold AI",
      message: "[Inquiry Request]\nVessel: GOLDEN WAVE (IMO: 9704657)\nPort: Busan\nFuel: VLSFO 600MT + MGO 50MT\nETA: 2025-12-08\n\nPlease provide your best quote.",
      package_name: "com.kakao.yellowid",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 3.5 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 3.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 4002,
      room_name: FAKE_SELLERS.SEAFUEL,
      sender: FAKE_PERSONS.SELLER2,
      message: "Checking stock and pricing. One moment please.",
      package_name: "com.kakao.yellowid",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 4003,
      room_name: FAKE_SELLERS.SEAFUEL,
      sender: FAKE_PERSONS.SELLER2,
      message: "[Quote]\nVLSFO: $578/MT\nMGO: $715/MT\nBarge Fee: $14,500\nEarliest: Dec 9th\nTerm: 30 days",
      package_name: "com.kakao.yellowid",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    },
    {
      message_id: 4004,
      room_name: FAKE_SELLERS.SEAFUEL,
      sender: "Harold AI",
      message: "Great pricing! I'll present this to the customer.",
      package_name: "com.kakao.yellowid",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
    },
  ],

  // MarineOil Corp
  [FAKE_SELLERS.MARINEOIL]: [
    {
      message_id: 6001,
      room_name: FAKE_SELLERS.MARINEOIL,
      sender: "Harold AI",
      message: "[Inquiry Request]\nVessel: GOLDEN WAVE (IMO: 9704657)\nPort: Busan\nFuel: VLSFO 600MT + MGO 50MT\nETA: 2025-12-08\n\nPlease provide your best quote.",
      package_name: "com.kakao.yellowid",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 3.5 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 3.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 6002,
      room_name: FAKE_SELLERS.MARINEOIL,
      sender: FAKE_PERSONS.SELLER3,
      message: "Noted. Will check and revert.",
      package_name: "com.kakao.yellowid",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ],

  // BlueFuel Trading (HSFO quotes)
  [FAKE_SELLERS.BLUEFUEL]: [
    // mock-004 (PACIFIC FORTUNE, Ulsan, HSFO 800MT)
    {
      message_id: 6001,
      room_name: FAKE_SELLERS.BLUEFUEL,
      sender: "Harold AI",
      message: "[Inquiry Request]\nVessel: PACIFIC FORTUNE (IMO: 9454436)\nPort: Ulsan\nFuel: HSFO 800MT\nETA: 2025-12-15\n\nPlease provide your best quote.",
      package_name: "com.kakao.yellowid",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 6002,
      room_name: FAKE_SELLERS.BLUEFUEL,
      sender: FAKE_PERSONS.SELLER3,
      message: "Received. Let me check availability.",
      package_name: "com.kakao.yellowid",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
    },
    {
      message_id: 6003,
      room_name: FAKE_SELLERS.BLUEFUEL,
      sender: FAKE_PERSONS.SELLER3,
      message: "[Quote]\nHSFO: $582/MT\nBarge Fee: $800\nEarliest: Dec 8th\nTerm: 30 days",
      package_name: "com.kakao.yellowid",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
    },
    // mock-011 (BLUE HORIZON, Ulsan, HSFO + LSMGO)
    {
      message_id: 6101,
      room_name: FAKE_SELLERS.BLUEFUEL,
      sender: "Harold AI",
      message: "[Inquiry Request]\nVessel: BLUE HORIZON (IMO: 9674671)\nPort: Ulsan\nFuel: HSFO 500MT + LSMGO 40MT\nETA: 2025-12-05\n\nPlease provide your best quote.",
      package_name: "com.kakao.yellowid",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 6102,
      room_name: FAKE_SELLERS.BLUEFUEL,
      sender: FAKE_PERSONS.SELLER3,
      message: "[Quote]\nHSFO: $485/MT\nLSMGO: $725/MT\nBarge Fee: $450\nEarliest: Dec 5th\nTerm: 30 days",
      package_name: "com.kakao.yellowid",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    },
  ],

  // Asia Energy Partners
  [FAKE_SELLERS.ASIAENERGY]: [
    {
      message_id: 8001,
      room_name: FAKE_SELLERS.ASIAENERGY,
      sender: "Harold AI",
      message: "[Inquiry]\nVessel: NEPTUNE GLORY\nPort: Singapore\nFuel: VLSFO 1200MT\nETA: Dec 11\n\nKindly quote.",
      package_name: "com.wechat",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 4.5 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 4.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 8002,
      room_name: FAKE_SELLERS.ASIAENERGY,
      sender: FAKE_PERSONS.SELLER4,
      message: "OK, checking now.",
      package_name: "com.wechat",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 8003,
      room_name: FAKE_SELLERS.ASIAENERGY,
      sender: FAKE_PERSONS.SELLER4,
      message: "[Quote]\nVLSFO: $565/MT\nBarge: $18,000\nEarliest: Dec 11\nPayment: 15 days",
      package_name: "com.wechat",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ],

  // OceanGas Supply
  [FAKE_SELLERS.OCEANGAS]: [
    {
      message_id: 8101,
      room_name: FAKE_SELLERS.OCEANGAS,
      sender: "Harold AI",
      message: "[Inquiry]\nVessel: NEPTUNE GLORY\nPort: Singapore\nFuel: VLSFO 1200MT\nETA: Dec 11\n\nPlease quote.",
      package_name: "com.whatsapp",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 4.5 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 4.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 8102,
      room_name: FAKE_SELLERS.OCEANGAS,
      sender: FAKE_PERSONS.SELLER4,
      message: "[Quote]\nVLSFO: $572/MT\nBarge: $16,000\nEarliest: Dec 10\nPayment: 30 days",
      package_name: "com.whatsapp",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
  ],

  // Pacific Oil Trading
  [FAKE_SELLERS.PACIFICOIL]: [
    {
      message_id: 8201,
      room_name: FAKE_SELLERS.PACIFICOIL,
      sender: "Harold AI",
      message: "[Inquiry]\nVessel: NEPTUNE GLORY\nPort: Singapore\nFuel: VLSFO 1200MT\nETA: Dec 11\n\nPlease quote.",
      package_name: "com.wechat",
      direction: "outgoing",
      timestamp: new Date(now.getTime() - 4.5 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 4.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      message_id: 8202,
      room_name: FAKE_SELLERS.PACIFICOIL,
      sender: FAKE_PERSONS.SELLER4,
      message: "[Quote]\nVLSFO: $568/MT\nBarge: $17,500\nEarliest: Dec 11\nPayment: 15 days",
      package_name: "com.wechat",
      direction: "incoming",
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

// ============================================
// AI Suggestions Mock Data
// ============================================

export const MOCK_AI_SUGGESTIONS: Record<string, AISuggestion[]> = {
  "mock-001": [
    {
      id: 101,
      room_name: FAKE_BUYERS.BLUWAVE,
      sender: FAKE_PERSONS.BUYER1,
      message: "IMO number is 9811000. Thanks.",
      category: "inquiry",
      confidence: 0.95,
      suggestions: [
        {
          option: 1,
          action: "send_to_suppliers",
          targets: [FAKE_SELLERS.SUNPETRO, FAKE_SELLERS.SEAFUEL, FAKE_SELLERS.MARINEOIL],
          message: `BLUE PIONEER (IMO: 9811000)\nBusan\n2025-12-10\nVLSFO 500MT\n\n상기 건 얼리 및 가격 확인 부탁드립니다. 감사합니다!`,
          reason: "FullContext is complete. Ready to send inquiry to suppliers.",
        },
      ],
      original_message: {
        room_name: FAKE_BUYERS.BLUWAVE,
        sender: FAKE_PERSONS.BUYER1,
        message: "IMO number is 9811000. Thanks.",
        created_at: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
      },
      trading_context: {
        vessel_name: FAKE_VESSELS.BLUWAVE1,
        imo: "9811000",
        port: "Busan",
        delivery_date: "2025-12-10",
        eta: "2025-12-10",
        fuel_type: "VLSFO",
        quantity: "500MT",
        fuel_type2: null,
        quantity2: null,
      },
      status: "pending",
      rejection_reason: null,
      created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    },
  ],

  "mock-005": [
    {
      id: 102,
      room_name: FAKE_SELLERS.SEAFUEL,
      sender: FAKE_PERSONS.SELLER2,
      message: "[Quote]\nVLSFO: $578/MT\nMGO: $715/MT",
      category: "quote",
      confidence: 0.92,
      suggestions: [
        {
          option: 1,
          action: "reply_to_customer",
          targets: [FAKE_BUYERS.GOLDEN],
          message: `[Quote Comparison]\n\n${FAKE_SELLERS.SUNPETRO}:\n- VLSFO: $582/MT\n- MGO: $720/MT\n- Earliest: Dec 8\n\n${FAKE_SELLERS.SEAFUEL} (Best Price):\n- VLSFO: $578/MT\n- MGO: $715/MT\n- Earliest: Dec 9\n\n${FAKE_SELLERS.SEAFUEL} is $4/MT cheaper. Would you like to proceed?`,
          reason: "Present quote comparison to customer with recommendation.",
        },
      ],
      original_message: {
        room_name: FAKE_SELLERS.SEAFUEL,
        sender: FAKE_PERSONS.SELLER2,
        message: "[Quote]\nVLSFO: $578/MT\nMGO: $715/MT",
        created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      },
      trading_context: {
        vessel_name: FAKE_VESSELS.GOLDEN1,
        imo: "9704657",
        port: "Busan",
        delivery_date: "2025-12-08",
        eta: "2025-12-08",
        fuel_type: "VLSFO",
        quantity: "600MT",
        fuel_type2: "MGO",
        quantity2: "50MT",
      },
      status: "pending",
      rejection_reason: null,
      created_at: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
    },
  ],

  "mock-010": [
    {
      id: 103,
      room_name: FAKE_BUYERS.VOYAGER,
      sender: FAKE_PERSONS.BUYER3,
      message: "Can you check if SeaFuel can do $565?",
      category: "negotiation",
      confidence: 0.88,
      suggestions: [
        {
          option: 1,
          action: "send_to_suppliers",
          targets: [FAKE_SELLERS.SEAFUEL],
          message: "Customer is requesting $565/MT for 1100MT volume.\nCan you match this price? This is a high-volume order with potential for repeat business.",
          reason: "Send counter-offer to SeaFuel Korea.",
        },
      ],
      original_message: {
        room_name: FAKE_BUYERS.VOYAGER,
        sender: FAKE_PERSONS.BUYER3,
        message: "Can you check if SeaFuel can do $565? With 1100MT volume they should give better price.",
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
      trading_context: {
        vessel_name: FAKE_VESSELS.VOYAGER1,
        imo: "9863297",
        port: "Busan",
        delivery_date: "2025-12-06",
        eta: "2025-12-06",
        fuel_type: "VLSFO",
        quantity: "1100MT",
        fuel_type2: null,
        quantity2: null,
      },
      status: "pending",
      rejection_reason: null,
      created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
  ],
};

// ============================================
// Statistics Mock Data
// ============================================

export const MOCK_STATISTICS: DealStatistics = {
  overall: {
    total_deals: 45,
    active_deals: 8,
    quoted_deals: 2,
    negotiating_deals: 2,
    successful_deals: 38,
    failed_deals: 5,
    cancelled_deals: 0,
    success_rate: 84,
    avg_response_time_minutes: 42,
    avg_deal_duration_minutes: 480,
    total_revenue: 15250000,
    today_revenue: 856000,
  },
  by_port: [
    { port: "Busan", total_deals: 18, successful_deals: 15, total_revenue: 6500000, avg_deal_value: 433333, avg_duration_minutes: 420 },
    { port: "Singapore", total_deals: 12, successful_deals: 10, total_revenue: 4800000, avg_deal_value: 480000, avg_duration_minutes: 510 },
    { port: "Ulsan", total_deals: 8, successful_deals: 7, total_revenue: 2200000, avg_deal_value: 314286, avg_duration_minutes: 380 },
    { port: "Yeosu", total_deals: 5, successful_deals: 4, total_revenue: 1350000, avg_deal_value: 337500, avg_duration_minutes: 440 },
    { port: "Gwangyang", total_deals: 2, successful_deals: 2, total_revenue: 400000, avg_deal_value: 200000, avg_duration_minutes: 360 },
  ],
  by_trader: [
    { trader: FAKE_SELLERS.SUNPETRO, total_deals: 15, total_revenue: 5200000, avg_deal_value: 346667, avg_negotiation_rounds: 0.8, fastest_response: "25min", avg_response_minutes: 38 },
    { trader: FAKE_SELLERS.SEAFUEL, total_deals: 12, total_revenue: 4100000, avg_deal_value: 341667, avg_negotiation_rounds: 0.5, fastest_response: "18min", avg_response_minutes: 32 },
    { trader: FAKE_SELLERS.MARINEOIL, total_deals: 8, total_revenue: 2600000, avg_deal_value: 325000, avg_negotiation_rounds: 0.6, fastest_response: "30min", avg_response_minutes: 45 },
    { trader: FAKE_SELLERS.BLUEFUEL, total_deals: 6, total_revenue: 1800000, avg_deal_value: 300000, avg_negotiation_rounds: 0.3, fastest_response: "22min", avg_response_minutes: 40 },
    { trader: FAKE_SELLERS.ASIAENERGY, total_deals: 4, total_revenue: 1550000, avg_deal_value: 387500, avg_negotiation_rounds: 0.2, fastest_response: "35min", avg_response_minutes: 55 },
  ],
  daily_trend: [
    { date: "2025-11-28", total_deals: 5, successful_deals: 4, failed_deals: 1, revenue: 1850000 },
    { date: "2025-11-29", total_deals: 7, successful_deals: 6, failed_deals: 1, revenue: 2200000 },
    { date: "2025-11-30", total_deals: 6, successful_deals: 5, failed_deals: 1, revenue: 1950000 },
    { date: "2025-12-01", total_deals: 8, successful_deals: 7, failed_deals: 1, revenue: 2650000 },
    { date: "2025-12-02", total_deals: 6, successful_deals: 6, failed_deals: 0, revenue: 2100000 },
    { date: "2025-12-03", total_deals: 7, successful_deals: 6, failed_deals: 1, revenue: 2350000 },
    { date: today, total_deals: 6, successful_deals: 4, failed_deals: 0, revenue: 2150000 },
  ],
};

// ============================================
// Helper Functions
// ============================================

export function generateNewInquiryDeal(): DealScoreboard {
  const vessels = ["OCEAN EXPLORER", "SEA VOYAGER", "MARINE SPIRIT", "WAVE RIDER", "PACIFIC DREAM"];
  const customers = [FAKE_BUYERS.BLUWAVE, FAKE_BUYERS.STARLINE, FAKE_BUYERS.OCEANIC, FAKE_BUYERS.PACIFICA, FAKE_BUYERS.GOLDEN];
  const ports = ["Busan", "Singapore", "Ulsan", "Yeosu", "Hong Kong"]; // 항상 포트 있음
  const fuelTypes = ["VLSFO", "HSFO", "MGO", "LSMGO"];

  const randomVessel = vessels[Math.floor(Math.random() * vessels.length)];
  const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
  const randomPort = ports[Math.floor(Math.random() * ports.length)];
  const randomFuel = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
  const randomQuantity = (Math.floor(Math.random() * 15) + 3) * 100;

  return {
    id: Date.now(),
    session_id: `mock-new-${Date.now()}`,
    customer_room_name: randomCustomer,
    vessel_name: randomVessel,
    imo: `98${Math.floor(Math.random() * 90000) + 10000}`,
    port: randomPort,
    fuel_type: randomFuel,
    quantity: `${randomQuantity}MT`,
    fuel_type2: null,
    quantity2: null,
    delivery_date: "2025-12-15",
    status: "active",
    stage: "inquiry",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    closed_at: null,
    final_price: null,
    selected_trader: null,
    closing_reason: null,
    total_quotes_received: 0,
    negotiation_rounds: 0,
    duration_minutes: 0,
    response_time_minutes: null,
    quote_count: 0,
    last_quote_time: null,
    requested_traders: [],
    seller_contexts: {},
    unread_count: 1,
    buyer_unread_count: 1,
    seller_unread_count: 0,
  };
}

export function generateNewMessage(roomName: string, isIncoming: boolean = true): ChatMessage {
  const incomingMessages = [
    "Please send me the quote details.",
    "What's the status of our inquiry?",
    "Thanks, I'll review and get back to you.",
    "Can you get a better price?",
    "Need a quick response please.",
  ];

  const outgoingMessages = [
    "I'll check and get back to you shortly.",
    "Compiling quotes now, will update soon.",
    "Message delivered to customer.",
    "Working on it, please wait.",
  ];

  const messages = isIncoming ? incomingMessages : outgoingMessages;
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  return {
    message_id: Date.now(),
    room_name: roomName,
    sender: isIncoming ? "Customer" : "Harold AI",
    message: randomMessage,
    package_name: "com.kakao.talk",
    direction: isIncoming ? "incoming" : "outgoing",
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}

// Export fake name constants for use in other components
export { FAKE_BUYERS, FAKE_SELLERS, FAKE_VESSELS, FAKE_PERSONS };
