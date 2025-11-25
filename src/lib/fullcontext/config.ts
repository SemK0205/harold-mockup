/**
 * FullContext Configuration V2
 * New 9-stage deal flow system
 *
 * Deal Flow: inquiry → deal_started → quote_collecting → renegotiating →
 *            customer_feedback → seller_feedback → deal_done/lost/no_offer
 */

import {
  DealStage,
  DEAL_STAGE_LABELS,
  DEAL_STAGE_COLORS,
  InquiryType,
  QuoteType,
  RenegotiationIssue,
  CustomerFeedbackType
} from '@/types'

// Re-export types from index.ts
export {
  DealStage,
  DEAL_STAGE_LABELS,
  DEAL_STAGE_COLORS,
  InquiryType,
  QuoteType,
  RenegotiationIssue,
  CustomerFeedbackType
}

// ============================================
// Field Definitions
// ============================================

export interface FieldDefinition {
  name: string
  label: string
  labelKo: string
  description?: string
  descriptionKo?: string
  type: 'text' | 'number' | 'date' | 'select'
  options?: string[]
}

export const FIELD_DEFINITIONS: Record<string, FieldDefinition> = {
  // Inquiry Fields
  vessel_name: {
    name: 'vessel_name',
    label: 'Vessel Name',
    labelKo: 'Vessel Name',
    description: 'Name of the vessel',
    type: 'text'
  },
  imo: {
    name: 'imo',
    label: 'IMO',
    labelKo: 'IMO',
    description: 'IMO number (7 digits)',
    type: 'text'
  },
  port: {
    name: 'port',
    label: 'Port',
    labelKo: 'Port',
    description: 'Bunkering port',
    type: 'text'
  },
  port1: {
    name: 'port1',
    label: 'Port 1',
    labelKo: 'Port 1',
    description: 'First port option',
    type: 'text'
  },
  port2: {
    name: 'port2',
    label: 'Port 2',
    labelKo: 'Port 2',
    description: 'Second port option',
    type: 'text'
  },
  eta: {
    name: 'eta',
    label: 'ETA',
    labelKo: 'ETA',
    description: 'Estimated time of arrival',
    type: 'date'
  },
  fuel_type: {
    name: 'fuel_type',
    label: 'Fuel Type',
    labelKo: 'Fuel Type',
    description: 'Primary fuel type',
    type: 'select',
    options: ['VLSFO', 'LSFO', 'MGO', 'LSMGO', 'HSFO', 'ULSFO']
  },
  quantity: {
    name: 'quantity',
    label: 'Quantity',
    labelKo: 'Quantity',
    description: 'Quantity in MT',
    type: 'number'
  },
  fuel_type2: {
    name: 'fuel_type2',
    label: 'Fuel Type 2',
    labelKo: 'Fuel Type 2',
    description: 'Secondary fuel type',
    type: 'select',
    options: ['VLSFO', 'LSFO', 'MGO', 'LSMGO', 'HSFO', 'ULSFO']
  },
  quantity2: {
    name: 'quantity2',
    label: 'Quantity 2',
    labelKo: 'Quantity 2',
    description: 'Secondary fuel quantity in MT',
    type: 'number'
  },
  fuel_type3: {
    name: 'fuel_type3',
    label: 'Fuel Type 3',
    labelKo: 'Fuel Type 3',
    description: 'Third fuel type',
    type: 'select',
    options: ['VLSFO', 'LSFO', 'MGO', 'LSMGO', 'HSFO', 'ULSFO']
  },
  quantity3: {
    name: 'quantity3',
    label: 'Quantity 3',
    labelKo: 'Quantity 3',
    description: 'Third fuel quantity in MT',
    type: 'number'
  },
  // Quote Fields
  fuel_price: {
    name: 'fuel_price',
    label: 'Fuel Price',
    labelKo: 'Fuel Price',
    description: 'Price per MT (USD)',
    type: 'number'
  },
  fuel1_price: {
    name: 'fuel1_price',
    label: 'Fuel 1 Price',
    labelKo: 'Fuel 1 Price',
    description: 'First fuel price per MT',
    type: 'number'
  },
  fuel2_price: {
    name: 'fuel2_price',
    label: 'Fuel 2 Price',
    labelKo: 'Fuel 2 Price',
    description: 'Second fuel price per MT',
    type: 'number'
  },
  fuel3_price: {
    name: 'fuel3_price',
    label: 'Fuel 3 Price',
    labelKo: 'Fuel 3 Price',
    description: 'Third fuel price per MT',
    type: 'number'
  },
  barge_fee: {
    name: 'barge_fee',
    label: 'Barge Fee',
    labelKo: 'Barge Fee',
    description: 'Barge delivery fee',
    type: 'number'
  },
  earliest: {
    name: 'earliest',
    label: 'Earliest',
    labelKo: 'Earliest',
    description: 'Earliest available date',
    type: 'text'
  }
}

// ============================================
// Inquiry FullContext Definitions
// ============================================

export interface InquiryFullContextDef {
  required: string[]
  optional: string[]
  format: string
  example?: string
}

export const INQUIRY_FULLCONTEXT: Record<InquiryType, InquiryFullContextDef> = {
  inquiry_single_fuel_single_port: {
    required: ['vessel_name', 'port', 'eta', 'fuel_type', 'quantity'],
    optional: ['imo'],
    format: '<VesselName> / <IMO> / <Port> / <ETA> / <Fuel> / <FuelQuantity>',
    example: 'Ram Commander / 9648312 / Singapore / 10th Dec / LSFO 180cst 0.5% / 650MT'
  },
  inquiry_single_fuel_multi_port: {
    required: ['vessel_name', 'port1', 'port2', 'eta', 'fuel_type', 'quantity'],
    optional: ['imo'],
    format: '<VesselName> / <IMO> / <Port1> or <Port2> / <ETA> / <Fuel> / <FuelQuantity>'
  },
  inquiry_dual_fuel_single_port: {
    required: ['vessel_name', 'port', 'eta', 'fuel_type', 'quantity', 'fuel_type2', 'quantity2'],
    optional: ['imo'],
    format: '<VesselName> / <IMO> / <Port> / <ETA> / <Fuel1> / <Fuel1Quantity> / <Fuel2> / <Fuel2Quantity>'
  },
  inquiry_dual_fuel_multi_port: {
    required: ['vessel_name', 'port1', 'port2', 'eta', 'fuel_type', 'quantity', 'fuel_type2', 'quantity2'],
    optional: ['imo']
  },
  inquiry_triple_fuel_single_port: {
    required: ['vessel_name', 'port', 'eta', 'fuel_type', 'quantity', 'fuel_type2', 'quantity2', 'fuel_type3', 'quantity3'],
    optional: ['imo']
  },
  inquiry_triple_fuel_multi_port: {
    required: ['vessel_name', 'port1', 'port2', 'eta', 'fuel_type', 'quantity', 'fuel_type2', 'quantity2', 'fuel_type3', 'quantity3'],
    optional: ['imo']
  }
}

// ============================================
// Quote FullContext Definitions
// ============================================

export interface QuoteFullContextDef {
  required: string[]
  optional: string[]
  format: string
}

export const QUOTE_FULLCONTEXT: Record<QuoteType, QuoteFullContextDef> = {
  quote_single_no_barge: {
    required: ['fuel_price'],
    optional: [],
    format: '<FuelPrice>'
  },
  quote_single_with_barge: {
    required: ['fuel_price', 'barge_fee'],
    optional: [],
    format: '<FuelPrice>+<BargeFee>'
  },
  quote_dual_no_barge: {
    required: ['fuel1_price', 'fuel2_price'],
    optional: [],
    format: '<Fuel1Price> / <Fuel2Price>'
  },
  quote_dual_with_barge: {
    required: ['fuel1_price', 'fuel2_price', 'barge_fee'],
    optional: [],
    format: '<Fuel1Price> / <Fuel2Price>+<BargeFee>'
  },
  quote_triple_no_barge: {
    required: ['fuel1_price', 'fuel2_price', 'fuel3_price'],
    optional: [],
    format: '<Fuel1Price> / <Fuel2Price> / <Fuel3Price>'
  },
  quote_triple_with_barge: {
    required: ['fuel1_price', 'fuel2_price', 'fuel3_price', 'barge_fee'],
    optional: [],
    format: '<Fuel1Price> / <Fuel2Price> / <Fuel3Price>+<BargeFee>'
  }
}

// ============================================
// Question Templates (Bilingual)
// ============================================

export interface QuestionTemplate {
  field: string
  ko: string
  en: string
  priority: number
}

export const QUESTION_TEMPLATES: Record<string, QuestionTemplate> = {
  vessel_name: {
    field: 'vessel_name',
    ko: 'Vessel Name?',
    en: 'What is the vessel name?',
    priority: 1
  },
  port: {
    field: 'port',
    ko: 'Port?',
    en: 'Which port?',
    priority: 2
  },
  port1: {
    field: 'port1',
    ko: 'First port?',
    en: 'What is the first port?',
    priority: 2
  },
  port2: {
    field: 'port2',
    ko: 'Second port?',
    en: 'What is the second port?',
    priority: 3
  },
  eta: {
    field: 'eta',
    ko: 'ETA?',
    en: 'What is the ETA?',
    priority: 4
  },
  fuel_type: {
    field: 'fuel_type',
    ko: 'Grade?',
    en: 'What is the fuel type?',
    priority: 5
  },
  quantity: {
    field: 'quantity',
    ko: 'Qty?',
    en: 'What is the quantity?',
    priority: 6
  },
  fuel_type2: {
    field: 'fuel_type2',
    ko: 'Second grade?',
    en: 'What is the second fuel type?',
    priority: 7
  },
  quantity2: {
    field: 'quantity2',
    ko: 'Second qty?',
    en: 'What is the quantity for the second fuel?',
    priority: 8
  },
  fuel_type3: {
    field: 'fuel_type3',
    ko: 'Third grade?',
    en: 'What is the third fuel type?',
    priority: 9
  },
  quantity3: {
    field: 'quantity3',
    ko: 'Third qty?',
    en: 'What is the quantity for the third fuel?',
    priority: 10
  },
  earliest: {
    field: 'earliest',
    ko: 'Earliest?',
    en: 'What is the earliest date?',
    priority: 11
  }
}

// ============================================
// Stage-specific Required Fields
// ============================================

export interface StageRequirements {
  stage: DealStage
  label: string
  labelKo: string
  description: string
  descriptionKo: string
  required: string[]
  optional: string[]
}

export const STAGE_REQUIREMENTS: Record<DealStage, StageRequirements> = {
  inquiry: {
    stage: 'inquiry',
    label: 'Inquiry',
    labelKo: 'Inquiry',
    description: 'Collecting inquiry information',
    descriptionKo: 'Inquiry FullContext',
    required: ['vessel_name', 'port', 'eta', 'fuel_type', 'quantity'],
    optional: ['imo', 'fuel_type2', 'quantity2']
  },
  deal_started: {
    stage: 'deal_started',
    label: 'Deal Started',
    labelKo: 'Deal Started',
    description: 'Inquiry sent to suppliers',
    descriptionKo: 'Inquiry sent to suppliers',
    required: ['vessel_name', 'port', 'eta', 'fuel_type', 'quantity'],
    optional: []
  },
  quote_collecting: {
    stage: 'quote_collecting',
    label: 'Collecting Quotes',
    labelKo: 'Collecting Quotes',
    description: 'Collecting quotes from suppliers',
    descriptionKo: 'Collecting offers',
    required: ['fuel_price'],
    optional: ['barge_fee', 'fuel1_price', 'fuel2_price']
  },
  renegotiating: {
    stage: 'renegotiating',
    label: 'Renegotiating',
    labelKo: 'Renegotiating',
    description: 'Renegotiating terms',
    descriptionKo: 'Renegotiation',
    required: [],
    optional: ['earliest', 'fuel_price']
  },
  customer_feedback: {
    stage: 'customer_feedback',
    label: 'Customer Feedback',
    labelKo: 'Customer Feedback',
    description: 'Awaiting customer response',
    descriptionKo: 'Customer feedback',
    required: [],
    optional: []
  },
  seller_feedback: {
    stage: 'seller_feedback',
    label: 'Seller Feedback',
    labelKo: 'Seller Feedback',
    description: 'Awaiting seller response',
    descriptionKo: 'Seller feedback',
    required: [],
    optional: ['earliest']
  },
  no_offer: {
    stage: 'no_offer',
    label: 'No Offer',
    labelKo: 'No Offer',
    description: 'Deal closed - no offer available',
    descriptionKo: 'No Offer',
    required: [],
    optional: []
  },
  lost: {
    stage: 'lost',
    label: 'Lost',
    labelKo: 'Lost',
    description: 'Deal lost',
    descriptionKo: 'Lost',
    required: [],
    optional: []
  },
  deal_done: {
    stage: 'deal_done',
    label: 'Deal Done',
    labelKo: 'Deal Done',
    description: 'Deal completed successfully',
    descriptionKo: 'Deal Done',
    required: [],
    optional: []
  }
}

// ============================================
// Renegotiation Patterns
// ============================================

export const RENEGOTIATION_PATTERNS: Record<RenegotiationIssue, string[]> = {
  schedule_issue: [
    'early', 'earliest', 'schedule', 'ETA',
    'too early', 'too late', 'date'
  ],
  credit_issue: [
    'credit', 'payment', 'prepay'
  ],
  stock_issue: [
    'out of stock', 'no stock', 'not available', 'no offer'
  ],
  price_issue: [
    'price', 'expensive', 'cheaper', 'better price', 'discount'
  ]
}

// ============================================
// Customer Feedback Patterns
// ============================================

export const CUSTOMER_FEEDBACK_PATTERNS: Record<CustomerFeedbackType, string[]> = {
  earliest_request: ['earliest', 'early', 'when'],
  price_negotiation: ['price', 'expensive', 'cheaper', 'discount', 'better'],
  lost: ['lost', 'cancel', 'pass', 'no', 'not']
}

// ============================================
// Message Templates
// ============================================

export const INQUIRY_MESSAGE_TEMPLATES = {
  ko: '{fullcontext}\nPls quote',
  en: '{fullcontext}\nPlease quote for the above.'
}

export const QUOTE_TO_CUSTOMER_TEMPLATES = {
  single_no_barge: '<VesselName> -> <FuelPrice>',
  single_with_barge: '<VesselName> -> <FuelPrice>+<BargeFee>',
  dual_no_barge: '<VesselName> -> <Fuel1Price> / <Fuel2Price>',
  dual_with_barge: '<VesselName> -> <Fuel1Price> / <Fuel2Price>+<BargeFee>',
  triple_no_barge: '<VesselName> -> <Fuel1Price> / <Fuel2Price> / <Fuel3Price>',
  triple_with_barge: '<VesselName> -> <Fuel1Price> / <Fuel2Price> / <Fuel3Price>+<BargeFee>'
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get question for a missing field
 */
export function getFieldQuestion(field: string, language: 'ko' | 'en' = 'en'): string {
  const template = QUESTION_TEMPLATES[field]
  if (!template) {
    return language === 'en' ? `What is the ${field}?` : `${field}?`
  }
  return template[language]
}

/**
 * Get stage requirements
 */
export function getStageRequirements(stage: DealStage): StageRequirements {
  return STAGE_REQUIREMENTS[stage]
}

/**
 * Check if stage is a terminal stage
 */
export function isTerminalStage(stage: DealStage): boolean {
  return ['no_offer', 'lost', 'deal_done'].includes(stage)
}

/**
 * Get next possible stages from current stage
 */
export function getNextPossibleStages(currentStage: DealStage): DealStage[] {
  const transitions: Record<DealStage, DealStage[]> = {
    inquiry: ['deal_started'],
    deal_started: ['quote_collecting', 'no_offer'],
    quote_collecting: ['customer_feedback', 'renegotiating', 'no_offer'],
    renegotiating: ['quote_collecting', 'customer_feedback', 'no_offer'],
    customer_feedback: ['seller_feedback', 'deal_done', 'lost'],
    seller_feedback: ['customer_feedback', 'deal_done', 'lost'],
    no_offer: [],
    lost: [],
    deal_done: []
  }
  return transitions[currentStage] || []
}

// ============================================
// LocalStorage Config (for UI customization)
// ============================================

export interface FullContextConfig {
  version: string
  lastModified: string
  customQuestions?: Record<string, { ko: string; en: string }>
}

const STORAGE_KEY = 'harold_fullcontext_config_v2'

export function getFullContextConfig(): FullContextConfig {
  if (typeof window === 'undefined') {
    return { version: '2.0.0', lastModified: new Date().toISOString() }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as FullContextConfig
    }
  } catch (error) {
    console.error('Failed to load FullContext config:', error)
  }

  return { version: '2.0.0', lastModified: new Date().toISOString() }
}

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

export function resetFullContextConfig(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
