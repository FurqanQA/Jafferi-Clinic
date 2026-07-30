-- ============================================================================
-- Jafferi Clinic - File Attachments Schema
-- ============================================================================
-- Stores file attachments for various entities.
-- File storage references for documents, images, reports, and other files linked to entities like patients, appointments, and medical records.
-- ============================================================================

-- File Attachments Table
CREATE TABLE file_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    entity_type entity_type_enum NOT NULL,
    entity_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    mime_type VARCHAR(100),
    category file_category_enum,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    storage_provider VARCHAR(50),
    storage_path TEXT,
    checksum VARCHAR(64),
    uploaded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_file_attachments_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_file_attachments_uploaded_by 
        FOREIGN KEY (uploaded_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    -- Check Constraints
    CONSTRAINT chk_file_attachments_file_size_positive 
        CHECK (file_size > 0)
);

-- Comments
COMMENT ON TABLE file_attachments IS 'Stores file attachments for various entities. Each file belongs to exactly one clinic.';
COMMENT ON COLUMN file_attachments.id IS 'Unique identifier for the file attachment';
COMMENT ON COLUMN file_attachments.clinic_id IS 'Foreign key to clinics table - file belongs to this clinic';
COMMENT ON COLUMN file_attachments.entity_type IS 'Entity type the file is attached to (patient, appointment, medical_record, etc.)';
COMMENT ON COLUMN file_attachments.entity_id IS 'ID of the entity the file is attached to';
COMMENT ON COLUMN file_attachments.file_name IS 'Original file name';
COMMENT ON COLUMN file_attachments.file_path IS 'File path in storage';
COMMENT ON COLUMN file_attachments.file_size IS 'File size in bytes';
COMMENT ON COLUMN file_attachments.file_type IS 'File type/extension';
COMMENT ON COLUMN file_attachments.mime_type IS 'MIME type';
COMMENT ON COLUMN file_attachments.category IS 'File category (document, image, video, report, lab_result, etc.)';
COMMENT ON COLUMN file_attachments.description IS 'File description';
COMMENT ON COLUMN file_attachments.is_public IS 'Whether file is publicly accessible';
COMMENT ON COLUMN file_attachments.storage_provider IS 'Storage provider (s3, supabase, etc.)';
COMMENT ON COLUMN file_attachments.storage_path IS 'Storage provider path';
COMMENT ON COLUMN file_attachments.checksum IS 'File checksum for integrity verification';
COMMENT ON COLUMN file_attachments.uploaded_by IS 'Foreign key to profiles table - user who uploaded';
COMMENT ON COLUMN file_attachments.created_at IS 'Timestamp when the file was uploaded';
COMMENT ON COLUMN file_attachments.updated_at IS 'Timestamp when the file was last updated';
COMMENT ON COLUMN file_attachments.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_file_attachments_clinic_id ON file_attachments(clinic_id);
CREATE INDEX idx_file_attachments_entity_type ON file_attachments(entity_type);
CREATE INDEX idx_file_attachments_entity_id ON file_attachments(entity_id);
CREATE INDEX idx_file_attachments_category ON file_attachments(category);
CREATE INDEX idx_file_attachments_uploaded_by ON file_attachments(uploaded_by);
CREATE INDEX idx_file_attachments_deleted_at ON file_attachments(deleted_at);
CREATE INDEX idx_file_attachments_clinic_entity ON file_attachments(clinic_id, entity_type, entity_id);
CREATE INDEX idx_file_attachments_clinic_category ON file_attachments(clinic_id, category);

-- Triggers for updated_at
CREATE TRIGGER update_file_attachments_updated_at
    BEFORE UPDATE ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
