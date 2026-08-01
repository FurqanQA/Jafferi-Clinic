import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateManageTemplatePermission } from './laboratory-permissions';
import { createLabPanelSchema } from './laboratory-validation';
import { LabPanel, LabCategory, LabTest } from './laboratory-types';

/**
 * Predefined laboratory panels
 */
export const PREDEFINED_PANELS: Record<string, LabPanel> = {
  cbc: {
    id: 'panel-cbc',
    clinic_id: '',
    panel_name: 'Complete Blood Count (CBC)',
    panel_code: 'CBC',
    category: 'blood_tests',
    description: 'Complete blood count with differential',
    tests: [
      {
        test_id: 'test-hemoglobin',
        test_name: 'Hemoglobin',
        test_code: 'HGB',
        category: 'blood_tests',
        department: 'Hematology',
        specimen_type: 'blood',
      },
      {
        test_id: 'test-hematocrit',
        test_name: 'Hematocrit',
        test_code: 'HCT',
        category: 'blood_tests',
        department: 'Hematology',
        specimen_type: 'blood',
      },
      {
        test_id: 'test-wbc',
        test_name: 'White Blood Cell Count',
        test_code: 'WBC',
        category: 'blood_tests',
        department: 'Hematology',
        specimen_type: 'blood',
      },
      {
        test_id: 'test-rbc',
        test_name: 'Red Blood Cell Count',
        test_code: 'RBC',
        category: 'blood_tests',
        department: 'Hematology',
        specimen_type: 'blood',
      },
      {
        test_id: 'test-platelets',
        test_name: 'Platelet Count',
        test_code: 'PLT',
        category: 'blood_tests',
        department: 'Hematology',
        specimen_type: 'blood',
      },
    ],
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  lft: {
    id: 'panel-lft',
    clinic_id: '',
    panel_name: 'Liver Function Test (LFT)',
    panel_code: 'LFT',
    category: 'biochemistry',
    description: 'Liver function panel',
    tests: [
      {
        test_id: 'test-alt',
        test_name: 'Alanine Aminotransferase (ALT)',
        test_code: 'ALT',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-ast',
        test_name: 'Aspartate Aminotransferase (AST)',
        test_code: 'AST',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-bilirubin',
        test_name: 'Total Bilirubin',
        test_code: 'TBIL',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-alp',
        test_name: 'Alkaline Phosphatase',
        test_code: 'ALP',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-albumin',
        test_name: 'Albumin',
        test_code: 'ALB',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
    ],
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  kft: {
    id: 'panel-kft',
    clinic_id: '',
    panel_name: 'Kidney Function Test (KFT)',
    panel_code: 'KFT',
    category: 'biochemistry',
    description: 'Kidney function panel',
    tests: [
      {
        test_id: 'test-creatinine',
        test_name: 'Creatinine',
        test_code: 'CRE',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-bun',
        test_name: 'Blood Urea Nitrogen',
        test_code: 'BUN',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-egfr',
        test_name: 'eGFR',
        test_code: 'eGFR',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-uric-acid',
        test_name: 'Uric Acid',
        test_code: 'UA',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
    ],
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  hba1c: {
    id: 'panel-hba1c',
    clinic_id: '',
    panel_name: 'HbA1c',
    panel_code: 'HbA1c',
    category: 'biochemistry',
    description: 'Glycated hemoglobin test',
    tests: [
      {
        test_id: 'test-hba1c',
        test_name: 'Hemoglobin A1c',
        test_code: 'HbA1c',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'blood',
      },
    ],
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  lipid_profile: {
    id: 'panel-lipid',
    clinic_id: '',
    panel_name: 'Lipid Profile',
    panel_code: 'LIPID',
    category: 'biochemistry',
    description: 'Cholesterol and triglycerides panel',
    tests: [
      {
        test_id: 'test-total-cholesterol',
        test_name: 'Total Cholesterol',
        test_code: 'TC',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-ldl',
        test_name: 'LDL Cholesterol',
        test_code: 'LDL',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-hdl',
        test_name: 'HDL Cholesterol',
        test_code: 'HDL',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-triglycerides',
        test_name: 'Triglycerides',
        test_code: 'TG',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
    ],
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  thyroid_profile: {
    id: 'panel-thyroid',
    clinic_id: '',
    panel_name: 'Thyroid Profile',
    panel_code: 'THYROID',
    category: 'hormone_tests',
    description: 'Thyroid function panel',
    tests: [
      {
        test_id: 'test-tsh',
        test_name: 'TSH',
        test_code: 'TSH',
        category: 'hormone_tests',
        department: 'Endocrinology',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-t3',
        test_name: 'Free T3',
        test_code: 'FT3',
        category: 'hormone_tests',
        department: 'Endocrinology',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-t4',
        test_name: 'Free T4',
        test_code: 'FT4',
        category: 'hormone_tests',
        department: 'Endocrinology',
        specimen_type: 'serum',
      },
    ],
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  vitamin_profile: {
    id: 'panel-vitamin',
    clinic_id: '',
    panel_name: 'Vitamin Profile',
    panel_code: 'VITAMIN',
    category: 'biochemistry',
    description: 'Essential vitamins panel',
    tests: [
      {
        test_id: 'test-vitamin-d',
        test_name: 'Vitamin D (25-OH)',
        test_code: 'VIT-D',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-vitamin-b12',
        test_name: 'Vitamin B12',
        test_code: 'VIT-B12',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-folate',
        test_name: 'Folate',
        test_code: 'FOL',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
    ],
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  electrolytes: {
    id: 'panel-electrolytes',
    clinic_id: '',
    panel_name: 'Electrolytes',
    panel_code: 'ELEC',
    category: 'biochemistry',
    description: 'Electrolyte balance panel',
    tests: [
      {
        test_id: 'test-sodium',
        test_name: 'Sodium',
        test_code: 'NA',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-potassium',
        test_name: 'Potassium',
        test_code: 'K',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-chloride',
        test_name: 'Chloride',
        test_code: 'CL',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-bicarbonate',
        test_name: 'Bicarbonate',
        test_code: 'HCO3',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
    ],
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  liver_panel: {
    id: 'panel-liver',
    clinic_id: '',
    panel_name: 'Comprehensive Liver Panel',
    panel_code: 'LIVER',
    category: 'biochemistry',
    description: 'Comprehensive liver function panel',
    tests: [
      {
        test_id: 'test-alt',
        test_name: 'Alanine Aminotransferase (ALT)',
        test_code: 'ALT',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-ast',
        test_name: 'Aspartate Aminotransferase (AST)',
        test_code: 'AST',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-bilirubin',
        test_name: 'Total Bilirubin',
        test_code: 'TBIL',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-alp',
        test_name: 'Alkaline Phosphatase',
        test_code: 'ALP',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-albumin',
        test_name: 'Albumin',
        test_code: 'ALB',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-ggt',
        test_name: 'GGT',
        test_code: 'GGT',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
    ],
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  kidney_panel: {
    id: 'panel-kidney',
    clinic_id: '',
    panel_name: 'Comprehensive Kidney Panel',
    panel_code: 'KIDNEY',
    category: 'biochemistry',
    description: 'Comprehensive kidney function panel',
    tests: [
      {
        test_id: 'test-creatinine',
        test_name: 'Creatinine',
        test_code: 'CRE',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-bun',
        test_name: 'Blood Urea Nitrogen',
        test_code: 'BUN',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-egfr',
        test_name: 'eGFR',
        test_code: 'eGFR',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-uric-acid',
        test_name: 'Uric Acid',
        test_code: 'UA',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-microalbumin',
        test_name: 'Microalbumin',
        test_code: 'MALB',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'urine',
      },
    ],
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  diabetes_panel: {
    id: 'panel-diabetes',
    clinic_id: '',
    panel_name: 'Diabetes Panel',
    panel_code: 'DIABETES',
    category: 'biochemistry',
    description: 'Comprehensive diabetes screening panel',
    tests: [
      {
        test_id: 'test-fasting-glucose',
        test_name: 'Fasting Glucose',
        test_code: 'FBS',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
      {
        test_id: 'test-hba1c',
        test_name: 'Hemoglobin A1c',
        test_code: 'HbA1c',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'blood',
      },
      {
        test_id: 'test-insulin',
        test_name: 'Insulin',
        test_code: 'INS',
        category: 'biochemistry',
        department: 'Biochemistry',
        specimen_type: 'serum',
      },
    ],
    is_active: true,
    created_at: '',
    updated_at: '',
  },
};

/**
 * Get all laboratory panels
 */
export async function getLabPanels(): Promise<LabPanel[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_panels')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('panel_name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch laboratory panels', { error });
      throw new DatabaseError('Failed to fetch laboratory panels', { error });
    }

    return (data || []) as LabPanel[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching laboratory panels', { error });
    throw new DatabaseError('Failed to fetch laboratory panels', { error });
  }
}

/**
 * Get laboratory panel by ID
 */
export async function getLabPanelById(panelId: string): Promise<LabPanel> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_panels')
      .select('*')
      .eq('id', panelId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch laboratory panel', { error, panelId });
      throw new DatabaseError('Failed to fetch laboratory panel', { error });
    }

    if (!data) {
      throw new NotFoundError('Laboratory panel not found');
    }

    return data as LabPanel;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching laboratory panel', { error, panelId });
    throw new DatabaseError('Failed to fetch laboratory panel', { error });
  }
}

/**
 * Get laboratory panels by category
 */
export async function getLabPanelsByCategory(category: LabCategory): Promise<LabPanel[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_panels')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('category', category)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('panel_name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch laboratory panels by category', { error, category });
      throw new DatabaseError('Failed to fetch laboratory panels by category', { error });
    }

    return (data || []) as LabPanel[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching laboratory panels by category', { error, category });
    throw new DatabaseError('Failed to fetch laboratory panels by category', { error });
  }
}

/**
 * Create a new laboratory panel
 */
export async function createLabPanel(input: any): Promise<LabPanel> {
  await validateManageTemplatePermission();

  const validatedInput = createLabPanelSchema.parse(input);
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_panels')
      .insert({
        clinic_id: clinicId,
        ...validatedInput,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create laboratory panel', { error, input });
      throw new DatabaseError('Failed to create laboratory panel', { error });
    }

    logger.info('Laboratory panel created successfully', { panelId: data.id });
    return data as LabPanel;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating laboratory panel', { error, input });
    throw new DatabaseError('Failed to create laboratory panel', { error });
  }
}

/**
 * Create a laboratory panel from predefined template
 */
export async function createLabPanelFromPredefined(panelKey: string): Promise<LabPanel> {
  await validateManageTemplatePermission();

  const predefinedPanel = PREDEFINED_PANELS[panelKey];
  if (!predefinedPanel) {
    throw new Error('Predefined panel not found');
  }

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_panels')
      .insert({
        clinic_id: clinicId,
        panel_name: predefinedPanel.panel_name,
        panel_code: predefinedPanel.panel_code,
        category: predefinedPanel.category,
        description: predefinedPanel.description,
        tests: predefinedPanel.tests,
        price: predefinedPanel.price,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create laboratory panel from template', { error, panelKey });
      throw new DatabaseError('Failed to create laboratory panel from template', { error });
    }

    logger.info('Laboratory panel created from template successfully', { panelId: data.id });
    return data as LabPanel;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating laboratory panel from template', { error, panelKey });
    throw new DatabaseError('Failed to create laboratory panel from template', { error });
  }
}

/**
 * Update a laboratory panel
 */
export async function updateLabPanel(panelId: string, input: any): Promise<LabPanel> {
  await validateManageTemplatePermission();

  const validatedInput = createLabPanelSchema.partial().parse(input);
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_panels')
      .update({
        ...validatedInput,
        updated_at: new Date().toISOString(),
      })
      .eq('id', panelId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update laboratory panel', { error, panelId });
      throw new DatabaseError('Failed to update laboratory panel', { error });
    }

    if (!data) {
      throw new NotFoundError('Laboratory panel not found');
    }

    logger.info('Laboratory panel updated successfully', { panelId });
    return data as LabPanel;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating laboratory panel', { error, panelId });
    throw new DatabaseError('Failed to update laboratory panel', { error });
  }
}

/**
 * Delete a laboratory panel (soft delete)
 */
export async function deleteLabPanel(panelId: string): Promise<void> {
  await validateManageTemplatePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('lab_panels')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', panelId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    if (error) {
      logger.error('Failed to delete laboratory panel', { error, panelId });
      throw new DatabaseError('Failed to delete laboratory panel', { error });
    }

    logger.info('Laboratory panel deleted successfully', { panelId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting laboratory panel', { error, panelId });
    throw new DatabaseError('Failed to delete laboratory panel', { error });
  }
}

/**
 * Get predefined panel keys
 */
export function getPredefinedPanelKeys(): string[] {
  return Object.keys(PREDEFINED_PANELS);
}

/**
 * Get predefined panel by key
 */
export function getPredefinedPanel(panelKey: string): LabPanel | undefined {
  return PREDEFINED_PANELS[panelKey];
}
