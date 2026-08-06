import { logger } from '../shared/logger';
import { cache } from '../shared/cache';

// ============================================================================
// HL7 (Health Level 7)
// HL7 v2.x interface for healthcare data exchange
// ============================================================================

/**
 * HL7 Message Types
 */
export enum Hl7MessageType {
  ADT_A01 = 'ADT^A01', // Patient admission
  ADT_A02 = 'ADT^A02', // Patient transfer
  ADT_A03 = 'ADT^A03', // Patient discharge
  ADT_A04 = 'ADT^A04', // Patient registration
  ORU_R01 = 'ORU^R01', // Observation result
  ORM_O01 = 'ORM^O01', // Order message
  ORR_O02 = 'ORR^O02', // Order response
  DFT_P03 = 'DFT^P03', // Financial transaction
  MDM_T02 = 'MDM^T02', // Document notification
}

/**
 * HL7 Segment Types
 */
export enum Hl7SegmentType {
  MSH = 'MSH', // Message header
  PID = 'PID', // Patient identification
  PV1 = 'PV1', // Patient visit
  OBR = 'OBR', // Observation request
  OBX = 'OBX', // Observation/result
  ORC = 'ORC', // Common order
  IN1 = 'IN1', // Insurance
  DG1 = 'DG1', // Diagnosis
}

/**
 * HL7 Message
 */
export interface Hl7Message {
  messageType: Hl7MessageType;
  segments: Hl7Segment[];
  rawMessage?: string;
}

/**
 * HL7 Segment
 */
export interface Hl7Segment {
  segmentType: Hl7SegmentType;
  fields: string[];
}

/**
 * HL7 Interface Configuration
 */
export interface Hl7InterfaceConfig {
  host: string;
  port: number;
  useTls: boolean;
  timeout: number;
  sendingFacility: string;
  receivingFacility: string;
}

/**
 * Default HL7 interface configuration
 */
const DEFAULT_HL7_CONFIG: Hl7InterfaceConfig = {
  host: process.env.HL7_HOST || 'localhost',
  port: parseInt(process.env.HL7_PORT || '2575'),
  useTls: process.env.HL7_USE_TLS === 'true',
  timeout: 30000,
  sendingFacility: process.env.HL7_SENDING_FACILITY || 'CLINIC',
  receivingFacility: process.env.HL7_RECEIVING_FACILITY || 'HOSPITAL',
};

/**
 * Parse HL7 message
 */
export function parseHl7Message(rawMessage: string): Hl7Message {
  const segments: Hl7Segment[] = [];
  const lines = rawMessage.split('\r').filter((line) => line.trim() !== '');

  for (const line of lines) {
    const parts = line.split('|');
    const segmentType = parts[0] as Hl7SegmentType;

    segments.push({
      segmentType,
      fields: parts.slice(1),
    });
  }

  const messageType = extractMessageType(segments);

  return {
    messageType,
    segments,
    rawMessage,
  };
}

/**
 * Build HL7 message
 */
export function buildHl7Message(message: Hl7Message): string {
  const lines: string[] = [];

  for (const segment of message.segments) {
    const line = `${segment.segmentType}|${segment.fields.join('|')}`;
    lines.push(line);
  }

  return lines.join('\r');
}

/**
 * Create MSH segment (Message Header)
 */
export function createMshSegment(
  messageType: Hl7MessageType,
  messageId: string,
  timestamp: string = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14)
): Hl7Segment {
  const [messageCode, triggerEvent] = messageType.split('^');

  return {
    segmentType: Hl7SegmentType.MSH,
    fields: [
      '|^~\\&', // Encoding characters
      DEFAULT_HL7_CONFIG.sendingFacility,
      '',
      DEFAULT_HL7_CONFIG.receivingFacility,
      '',
      timestamp,
      '',
      messageType,
      messageId,
      'P', // Processing ID
      '2.5', // Version ID
    ],
  };
}

/**
 * Create PID segment (Patient Identification)
 */
export function createPidSegment(
  patientId: string,
  patientName: string,
  patientDob: string,
  patientSex: string = 'U'
): Hl7Segment {
  return {
    segmentType: Hl7SegmentType.PID,
    fields: [
      '1', // Set ID
      patientId, // Patient ID
      '', // Patient ID list
      patientName, // Patient name
      '', // Mother's maiden name
      patientDob, // Date of birth
      patientSex, // Sex
      '', // Patient alias
      '', // Race
      '', // Patient address
      '', // County code
      '', // Phone number
      '', // Business phone
      '', // Language
      '', // Marital status
      '', // Religion
      '', // Patient account number
      '', // SSN number
      '', // Driver's license
      '', // Mother's identifier
      '', // Ethnic group
      '', // Birth place
      '', // Multiple birth indicator
      '', // Birth order
      '', // Citizenship
      '', // Veteran status
    ],
  };
}

/**
 * Create OBR segment (Observation Request)
 */
export function createObrSegment(
  placerOrderNumber: string,
  fillerOrderNumber: string,
  universalServiceId: string,
  observationDateTime: string = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14)
): Hl7Segment {
  return {
    segmentType: Hl7SegmentType.OBR,
    fields: [
      '1', // Set ID
      placerOrderNumber, // Placer order number
      fillerOrderNumber, // Filler order number
      universalServiceId, // Universal service ID
      observationDateTime, // Observation date/time
      '', // Observation end date/time
      '', // Collection volume
      '', // Collector identifier
      '', // Specimen action code
      '', // Danger code
      '', // Relevant clinical info
      '', // Specimen received date/time
      '', // Specimen source
      '', // Ordering provider
      '', // Order callback phone number
      '', // Placer field 1
      '', // Placer field 2
 observationDateTime, // Filler field 1
      '', // Filler field 2
      '', // Results report/change status
      '', // Parent result
      '', // Observation/timing
      '', // Result status
    ],
  };
}

/**
 * Create OBX segment (Observation/Result)
 */
export function createObxSegment(
  set_id: string,
  observationIdentifier: string,
  observationValue: string,
  observationDateTime: string = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14)
): Hl7Segment {
  return {
    segmentType: Hl7SegmentType.OBX,
    fields: [
      set_id, // Set ID
      'ST', // Value type (String)
      observationIdentifier, // Observation identifier
      observationIdentifier, // Observation sub-id
      observationValue, // Observation value
      '', // Units
      '', // Reference range
      '', // Abnormal flags
      '', // Probability
      observationDateTime, // Observation date/time
      '', // Producer's reference
      '', // Responsible observer
      '', // Observation method
      '', // Equipment instance identifier
      '', // DateTime of analysis
      '', // Coded value
      '', // Value qualifier
      '', // Probability
      '', // Last OBX in this set
    ],
  };
}

/**
 * Extract message type from segments
 */
function extractMessageType(segments: Hl7Segment[]): Hl7MessageType {
  const mshSegment = segments.find((s) => s.segmentType === Hl7SegmentType.MSH);
  if (mshSegment && mshSegment.fields[8]) {
    return mshSegment.fields[8] as Hl7MessageType;
  }
  return Hl7MessageType.ADT_A01; // Default
}

/**
 * Validate HL7 message
 */
export function validateHl7Message(message: Hl7Message): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!message.messageType) {
    errors.push('Message type is required');
  }

  if (!message.segments || message.segments.length === 0) {
    errors.push('At least one segment is required');
  }

  const hasMsh = message.segments.some((s) => s.segmentType === Hl7SegmentType.MSH);
  if (!hasMsh) {
    errors.push('MSH segment is required');
  }

  // Validate message type
  const validMessageTypes = Object.values(Hl7MessageType);
  if (message.messageType && !validMessageTypes.includes(message.messageType)) {
    errors.push(`Invalid message type: ${message.messageType}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Send HL7 message
 */
export async function sendHl7Message(message: Hl7Message): Promise<boolean> {
  try {
    const rawMessage = buildHl7Message(message);

    // Placeholder for actual HL7 message sending
    // In production, this would connect to an HL7 interface via MLLP or TCP
    await new Promise((resolve) => setTimeout(resolve, 500));

    logger.info('HL7 message sent', { 
      messageType: message.messageType,
      segments: message.segments.length,
    });

    return true;
  } catch (error) {
    logger.error('HL7 message sending failed', { error, messageType: message.messageType });
    return false;
  }
}

/**
 * Receive HL7 message
 */
export async function receiveHl7Message(): Promise<Hl7Message | null> {
  try {
    // Placeholder for actual HL7 message receiving
    // In production, this would listen for messages from an HL7 interface
    await new Promise((resolve) => setTimeout(resolve, 500));

    return null;
  } catch (error) {
    logger.error('HL7 message receiving failed', { error });
    return null;
  }
}

/**
 * Acknowledge HL7 message
 */
export function acknowledgeHl7Message(messageId: string, accepted: boolean = true): string {
  const ackCode = accepted ? 'AA' : 'AE';
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);

  const ackMessage = `MSH|^~\\&|${DEFAULT_HL7_CONFIG.sendingFacility}||${DEFAULT_HL7_CONFIG.receivingFacility}||${timestamp}||ACK^R01|${messageId}|P|2.5\rMSA|${ackCode}|${messageId}`;

  return ackMessage;
}

/**
 * Parse acknowledgment
 */
export function parseAcknowledgment(ackMessage: string): {
  accepted: boolean;
  messageId: string;
  error?: string;
} {
  const lines = ackMessage.split('\r');
  const msaLine = lines.find((line) => line.startsWith('MSA'));

  if (!msaLine) {
    return { accepted: false, messageId: '', error: 'Invalid acknowledgment message' };
  }

  const parts = msaLine.split('|');
  const ackCode = parts[1];
  const messageId = parts[2] || '';

  return {
    accepted: ackCode === 'AA',
    messageId,
    error: ackCode !== 'AA' ? `Acknowledgment code: ${ackCode}` : undefined,
  };
}

/**
 * Get HL7 configuration
 */
export function getHl7Config(): Hl7InterfaceConfig {
  return { ...DEFAULT_HL7_CONFIG };
}

/**
 * Update HL7 configuration
 */
export function updateHl7Config(config: Partial<Hl7InterfaceConfig>): Hl7InterfaceConfig {
  Object.assign(DEFAULT_HL7_CONFIG, config);
  logger.info('HL7 configuration updated', { config: DEFAULT_HL7_CONFIG });
  return { ...DEFAULT_HL7_CONFIG };
}

/**
 * Convert HL7 date to ISO string
 */
export function hl7DateToIso(hl7Date: string): string {
  if (hl7Date.length === 8) {
    // YYYYMMDD
    const year = hl7Date.substring(0, 4);
    const month = hl7Date.substring(4, 6);
    const day = hl7Date.substring(6, 8);
    return `${year}-${month}-${day}`;
  } else if (hl7Date.length === 14) {
    // YYYYMMDDHHMMSS
    const year = hl7Date.substring(0, 4);
    const month = hl7Date.substring(4, 6);
    const day = hl7Date.substring(6, 8);
    const hour = hl7Date.substring(8, 10);
    const minute = hl7Date.substring(10, 12);
    const second = hl7Date.substring(12, 14);
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }
  return hl7Date;
}

/**
 * Convert ISO date to HL7 date
 */
export function isoToHl7Date(isoDate: string, includeTime: boolean = false): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (includeTime) {
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  return `${year}${month}${day}`;
}
