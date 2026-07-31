import { SOAPNotes } from './medical-record-types';

/**
 * Generate SOAP notes from clinical data
 * This is a reusable utility for creating SOAP notes structure
 */
export function generateSOAPNotes(data: {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}): SOAPNotes {
  return {
    subjective: data.subjective || '',
    objective: data.objective || '',
    assessment: data.assessment || '',
    plan: data.plan || '',
  };
}

/**
 * Validate SOAP notes completeness
 * Checks if all required sections are present
 */
export function validateSOAPNotesCompleteness(soapNotes: SOAPNotes): {
  isComplete: boolean;
  missingSections: string[];
} {
  const missingSections: string[] = [];

  if (!soapNotes.subjective || soapNotes.subjective.trim().length === 0) {
    missingSections.push('subjective');
  }

  if (!soapNotes.objective || soapNotes.objective.trim().length === 0) {
    missingSections.push('objective');
  }

  if (!soapNotes.assessment || soapNotes.assessment.trim().length === 0) {
    missingSections.push('assessment');
  }

  if (!soapNotes.plan || soapNotes.plan.trim().length === 0) {
    missingSections.push('plan');
  }

  return {
    isComplete: missingSections.length === 0,
    missingSections,
  };
}

/**
 * Format SOAP notes for display
 * Returns a formatted string representation
 */
export function formatSOAPNotes(soapNotes: SOAPNotes): string {
  const sections: string[] = [];

  if (soapNotes.subjective) {
    sections.push(`S: ${soapNotes.subjective}`);
  }

  if (soapNotes.objective) {
    sections.push(`O: ${soapNotes.objective}`);
  }

  if (soapNotes.assessment) {
    sections.push(`A: ${soapNotes.assessment}`);
  }

  if (soapNotes.plan) {
    sections.push(`P: ${soapNotes.plan}`);
  }

  return sections.join('\n\n');
}

/**
 * Parse SOAP notes from formatted string
 * Extracts sections from a formatted SOAP notes string
 */
export function parseSOAPNotes(formattedText: string): SOAPNotes {
  const soapNotes: SOAPNotes = {
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  };

  const lines = formattedText.split('\n');
  let currentSection: keyof SOAPNotes | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('S:')) {
      currentSection = 'subjective';
      soapNotes.subjective = trimmedLine.substring(2).trim();
    } else if (trimmedLine.startsWith('O:')) {
      currentSection = 'objective';
      soapNotes.objective = trimmedLine.substring(2).trim();
    } else if (trimmedLine.startsWith('A:')) {
      currentSection = 'assessment';
      soapNotes.assessment = trimmedLine.substring(2).trim();
    } else if (trimmedLine.startsWith('P:')) {
      currentSection = 'plan';
      soapNotes.plan = trimmedLine.substring(2).trim();
    } else if (currentSection) {
      // Append to current section
      soapNotes[currentSection] += '\n' + trimmedLine;
    }
  }

  return soapNotes;
}

/**
 * Merge SOAP notes
 * Combines two SOAP notes, preferring non-empty values
 */
export function mergeSOAPNotes(base: SOAPNotes, override: Partial<SOAPNotes>): SOAPNotes {
  return {
    subjective: override.subjective || base.subjective,
    objective: override.objective || base.objective,
    assessment: override.assessment || base.assessment,
    plan: override.plan || base.plan,
  };
}

/**
 * Placeholder for AI SOAP Notes generation
 * This function is prepared for future AI integration
 */
export async function generateAISOAPNotes(
  clinicalData: {
    chiefComplaint?: string;
    history?: string;
    vitals?: Record<string, unknown>;
    physicalExamination?: Record<string, unknown>;
  }
): Promise<SOAPNotes> {
  // TODO: Integrate with AI service for SOAP notes generation
  // This is a placeholder for future AI integration
  return {
    subjective: '[AI Generated] Subjective notes will be generated here',
    objective: '[AI Generated] Objective notes will be generated here',
    assessment: '[AI Generated] Assessment will be generated here',
    plan: '[AI Generated] Plan will be generated here',
  };
}
