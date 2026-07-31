import { DrugInteraction, InteractionSeverity, InteractionType } from './prescription-types';

/**
 * Check for drug-drug interactions
 */
export async function checkDrugDrugInteractions(
  medicines: string[]
): Promise<DrugInteraction[]> {
  // TODO: Integrate with drug interaction API (e.g., DrugBank, RxNorm)
  // This is a placeholder for future API integration
  const interactions: DrugInteraction[] = [];

  // Example placeholder logic - replace with actual API call
  for (let i = 0; i < medicines.length; i++) {
    for (let j = i + 1; j < medicines.length; j++) {
      const interaction = await checkPairwiseInteraction(medicines[i], medicines[j]);
      if (interaction) {
        interactions.push(interaction);
      }
    }
  }

  return interactions;
}

/**
 * Check pairwise interaction between two medicines
 */
async function checkPairwiseInteraction(
  medicine1: string,
  medicine2: string
): Promise<DrugInteraction | null> {
  // TODO: Implement actual interaction checking via API
  // This is a placeholder for future implementation
  return null;
}

/**
 * Check for drug-allergy interactions
 */
export async function checkDrugAllergyInteractions(
  medicines: string[],
  patientAllergies: string[]
): Promise<DrugInteraction[]> {
  const interactions: DrugInteraction[] = [];

  for (const medicine of medicines) {
    for (const allergy of patientAllergies) {
      if (isAllergyMatch(medicine, allergy)) {
        interactions.push({
          id: generateInteractionId(),
          medicine_1: medicine,
          medicine_2: allergy,
          interaction_type: 'drug_allergy',
          severity: 'critical',
          description: `Patient has known allergy to ${allergy}`,
          recommendation: 'Do not prescribe this medication',
        });
      }
    }
  }

  return interactions;
}

/**
 * Check if medicine matches allergy
 */
function isAllergyMatch(medicine: string, allergy: string): boolean {
  const medicineLower = medicine.toLowerCase();
  const allergyLower = allergy.toLowerCase();

  // Direct match
  if (medicineLower.includes(allergyLower) || allergyLower.includes(medicineLower)) {
    return true;
  }

  // Check for common drug class matches (placeholder logic)
  const drugClasses: Record<string, string[]> = {
    penicillin: ['amoxicillin', 'ampicillin', 'penicillin', 'amoxicillin-clavulanate'],
    sulfa: ['sulfamethoxazole', 'sulfadiazine', 'sulfasalazine'],
    aspirin: ['aspirin', 'acetylsalicylic acid'],
    nsaids: ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib'],
  };

  for (const [classKey, drugs] of Object.entries(drugClasses)) {
    if (allergyLower.includes(classKey) && drugs.some(d => medicineLower.includes(d))) {
      return true;
    }
  }

  return false;
}

/**
 * Check for drug-food interactions
 */
export async function checkDrugFoodInteractions(
  medicines: string[]
): Promise<DrugInteraction[]> {
  // TODO: Integrate with drug-food interaction API
  // This is a placeholder for future implementation
  const interactions: DrugInteraction[] = [];

  // Example placeholder - common drug-food interactions
  const foodInteractions: Record<string, { food: string; severity: InteractionSeverity; description: string }> = {
    warfarin: {
      food: 'Vitamin K-rich foods (leafy greens)',
      severity: 'moderate',
      description: 'Warfarin interacts with Vitamin K, affecting anticoagulant effect',
    },
    tetracycline: {
      food: 'Dairy products, antacids',
      severity: 'moderate',
      description: 'Calcium binds to tetracycline, reducing absorption',
    },
    statins: {
      food: 'Grapefruit juice',
      severity: 'moderate',
      description: 'Grapefruit juice inhibits CYP3A4, increasing statin levels',
    },
    maoi: {
      food: 'Tyramine-rich foods (aged cheese, cured meats)',
      severity: 'critical',
      description: 'MAOIs interact with tyramine, causing hypertensive crisis',
    },
  };

  for (const medicine of medicines) {
    const medicineLower = medicine.toLowerCase();
    for (const [drugKey, interaction] of Object.entries(foodInteractions)) {
      if (medicineLower.includes(drugKey)) {
        interactions.push({
          id: generateInteractionId(),
          medicine_1: medicine,
          medicine_2: interaction.food,
          interaction_type: 'drug_food',
          severity: interaction.severity,
          description: interaction.description,
          recommendation: 'Advise patient to avoid or limit consumption',
        });
      }
    }
  }

  return interactions;
}

/**
 * Check for drug-disease interactions
 */
export async function checkDrugDiseaseInteractions(
  medicines: string[],
  patientConditions: string[]
): Promise<DrugInteraction[]> {
  // TODO: Integrate with drug-disease interaction API
  // This is a placeholder for future implementation
  const interactions: DrugInteraction[] = [];

  // Example placeholder - common drug-disease interactions
  const diseaseInteractions: Record<string, { disease: string; severity: InteractionSeverity; description: string }> = {
    nsaids: {
      disease: 'Peptic ulcer disease, GI bleeding',
      severity: 'high',
      description: 'NSAIDs increase risk of GI bleeding and ulcer formation',
    },
    ace_inhibitors: {
      disease: 'Renal impairment, hyperkalemia',
      severity: 'moderate',
      description: 'ACE inhibitors can worsen renal function and cause hyperkalemia',
    },
    beta_blockers: {
      disease: 'Asthma, COPD',
      severity: 'moderate',
      description: 'Beta-blockers can trigger bronchospasm in asthmatic patients',
    },
    diuretics: {
      disease: 'Gout',
      severity: 'moderate',
      description: 'Diuretics can increase uric acid levels, triggering gout attacks',
    },
  };

  for (const medicine of medicines) {
    const medicineLower = medicine.toLowerCase();
    for (const [drugKey, interaction] of Object.entries(diseaseInteractions)) {
      if (medicineLower.includes(drugKey)) {
        for (const condition of patientConditions) {
          if (condition.toLowerCase().includes(interaction.disease.toLowerCase()) ||
              interaction.disease.toLowerCase().includes(condition.toLowerCase())) {
            interactions.push({
              id: generateInteractionId(),
              medicine_1: medicine,
              medicine_2: condition,
              interaction_type: 'drug_disease',
              severity: interaction.severity,
              description: interaction.description,
              recommendation: 'Consider alternative medication or monitor closely',
            });
          }
        }
      }
    }
  }

  return interactions;
}

/**
 * Check all interaction types
 */
export async function checkAllInteractions(
  medicines: string[],
  patientAllergies: string[],
  patientConditions: string[]
): Promise<{
  drugDrug: DrugInteraction[];
  drugAllergy: DrugInteraction[];
  drugFood: DrugInteraction[];
  drugDisease: DrugInteraction[];
  critical: DrugInteraction[];
}> {
  const [drugDrug, drugAllergy, drugFood, drugDisease] = await Promise.all([
    checkDrugDrugInteractions(medicines),
    checkDrugAllergyInteractions(medicines, patientAllergies),
    checkDrugFoodInteractions(medicines),
    checkDrugDiseaseInteractions(medicines, patientConditions),
  ]);

  const critical = [
    ...drugDrug.filter(i => i.severity === 'critical'),
    ...drugAllergy.filter(i => i.severity === 'critical'),
    ...drugFood.filter(i => i.severity === 'critical'),
    ...drugDisease.filter(i => i.severity === 'critical'),
  ];

  return {
    drugDrug,
    drugAllergy,
    drugFood,
    drugDisease,
    critical,
  };
}

/**
 * Generate interaction summary
 */
export function generateInteractionSummary(interactions: {
  drugDrug: DrugInteraction[];
  drugAllergy: DrugInteraction[];
  drugFood: DrugInteraction[];
  drugDisease: DrugInteraction[];
  critical: DrugInteraction[];
}): string {
  const lines: string[] = [];

  if (interactions.critical.length > 0) {
    lines.push(`CRITICAL: ${interactions.critical.length} critical interaction(s) found`);
    interactions.critical.forEach(i => {
      lines.push(`  - ${i.medicine_1} + ${i.medicine_2}: ${i.description}`);
    });
  }

  if (interactions.drugDrug.length > 0) {
    lines.push(`Drug-Drug: ${interactions.drugDrug.length} interaction(s) found`);
  }

  if (interactions.drugAllergy.length > 0) {
    lines.push(`Drug-Allergy: ${interactions.drugAllergy.length} interaction(s) found`);
  }

  if (interactions.drugFood.length > 0) {
    lines.push(`Drug-Food: ${interactions.drugFood.length} interaction(s) found`);
  }

  if (interactions.drugDisease.length > 0) {
    lines.push(`Drug-Disease: ${interactions.drugDisease.length} interaction(s) found`);
  }

  if (lines.length === 0) {
    lines.push('No interactions detected');
  }

  return lines.join('\n');
}

/**
 * Generate unique interaction ID
 */
function generateInteractionId(): string {
  return `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Placeholder for AI drug interaction analysis
 * This function is prepared for future AI integration
 */
export async function analyzeDrugInteractionsAI(
  medicines: string[],
  patientData: Record<string, unknown>
): Promise<{
  interactions: DrugInteraction[];
  recommendations: string[];
  riskScore: number;
}> {
  // TODO: Integrate with AI service for advanced interaction analysis
  // This is a placeholder for future AI integration
  return {
    interactions: [],
    recommendations: ['AI analysis not yet implemented'],
    riskScore: 0,
  };
}
