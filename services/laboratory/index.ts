// Types and Validation
export * from './laboratory-types';

// Permissions
export * from './laboratory-permissions';

// Core Services
export * from './laboratory-catalog';
export * from './laboratory-panels';
export * from './diagnostic-imaging';

// Specimen (exclude conflicting exports)
export {
  createSpecimen,
  getSpecimenById,
  getSpecimenByLabOrder,
  getSpecimensByType,
  getSpecimensByStatus,
  getSpecimensByPatient,
  updateSpecimen,
  updateSpecimenStatus,
  recordSpecimenCollection,
  recordSpecimenReceipt,
  generateSpecimenBarcode,
  validateSpecimenIntegrity as validateSpecimenIntegritySpecimen,
} from './specimen';

// Reference Ranges (exclude conflicting exports)
export {
  getReferenceRangeByTestId,
  getReferenceRangeById,
  getReferenceRangeForPatient,
  createReferenceRange,
  updateReferenceRange,
  deleteReferenceRange,
  getReferenceRangesByType,
  validateResultAgainstReferenceRange as validateResultAgainstReferenceRangeRanges,
  getAllReferenceRanges,
} from './reference-ranges';

export * from './results';
export * from './result-review';
export * from './critical-values';
export * from './attachments';
export * from './print';

// Lifecycle Operations
export * from './create-lab-order';
export * from './update-lab-order';
export * from './collect-sample';
export * from './start-processing';
export * from './complete-test';
export * from './review-results';
export * from './cancel-lab-order';
export * from './archive-lab-order';
export * from './restore-lab-order';
export * from './delete-lab-order';

// Query Operations
export * from './get-lab-order';
export * from './get-lab-orders';
export * from './search-lab-orders';
export * from './export-lab-orders';
