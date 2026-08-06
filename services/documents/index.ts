// ============================================================================
// Enterprise Document & File Management Service
// Main entry point for all document management modules
// ============================================================================

// Type Definitions
export * from './document-types';

// Validation
export * from './document-validation';

// Permissions
export * from './document-permissions';

// Core Engine
export * from './document-engine';

// Storage
export * from './storage';

// Folders
export * from './folders';

// File Operations
export * from './file-upload';
export * from './file-download';
export { 
  generatePreview, 
  getPreviewStatus, 
  getThumbnailUrl as getFilePreviewThumbnailUrl
} from './file-preview';
export * from './file-versioning';
export * from './file-sharing';
export * from './file-tags';
export {
  searchDocuments as searchDocumentsBasic,
  fullTextSearch as fullTextSearchBasic,
  getSearchSuggestions as getSearchSuggestionsBasic,
  getRecentSearches as getRecentSearchesBasic,
  saveSearch as saveSearchBasic,
  getSavedSearches as getSavedSearchesBasic
} from './file-search';

// Metadata & Processing
export * from './metadata';
export * from './thumbnails';
export * from './compression';
export * from './encryption';
export * from './virus-scan';

// Lifecycle Management
export * from './retention';
export * from './archive';
export * from './restore';
export * from './delete';

// Entity-Specific Documents
export * from './patient-documents';
export * from './doctor-documents';
export * from './laboratory-documents';
export * from './prescription-documents';
export * from './billing-documents';
export * from './payment-documents';
export * from './appointment-documents';
export * from './medical-record-documents';

// Medical Imaging
export * from './imaging';
export * from './dicom';

// Format Processing
export * from './pdf';
export * from './images';
export * from './print';

// Audit & Analytics
export * from './audit';
export * from './analytics';

// High-Level Operations
export * from './create-document';
export * from './update-document';
export { 
  getDocument, 
  getDocumentWithContext as getDocumentWithFullContext,
  documentExists 
} from './get-document';
export * from './get-documents';
export * from './search-documents';
export * from './export-documents';
