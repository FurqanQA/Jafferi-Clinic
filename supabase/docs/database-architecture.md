# Jafferi Clinic - Database Architecture Design

**Project Type:** Multi-Tenant Healthcare Clinic Management SaaS  
**Database:** PostgreSQL via Supabase  
**Design Date:** July 30, 2026  
**Version:** 1.0

---

## Table of Contents

1. [Entity Designs](#entity-designs)
2. [Relationships](#relationships)
3. [Multi-Tenant Design](#multi-tenant-design)
4. [Role-Based Access Control](#role-based-access-control)
5. [Entity Relationship Diagram](#entity-relationship-diagram)
6. [Database Architecture Summary](#database-architecture-summary)
7. [Table Creation Order](#table-creation-order)
8. [Recommendations Before Writing SQL](#recommendations-before-writing-sql)

---

## Entity Designs

### 1. Clinics

**Purpose:** Represents individual clinic tenants in the multi-tenant SaaS system.

**Description:** Each clinic is a completely isolated tenant with its own data, settings, subscription, and users. This is the core multi-tenancy table that all clinic-specific data references.

**Columns:**
- `id` (UUID) - Primary key
- `name` (VARCHAR(255)) - Clinic name
- `slug` (VARCHAR(100)) - URL-friendly unique identifier
- `email` (VARCHAR(255)) - Clinic contact email
- `phone` (VARCHAR(50)) - Clinic contact phone
- `address` (TEXT) - Clinic physical address
- `city` (VARCHAR(100)) - City
- `state` (VARCHAR(100)) - State/Province
- `country` (VARCHAR(100)) - Country
- `postal_code` (VARCHAR(20)) - Postal/ZIP code
- `logo_url` (TEXT) - Clinic logo image URL
- `website` (VARCHAR(255)) - Clinic website URL
- `description` (TEXT) - Clinic description
- `is_active` (BOOLEAN) - Active status
- `subscription_plan_id` (UUID) - FK to subscription_plans
- `trial_ends_at` (TIMESTAMPTZ) - Trial period end date
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `subscription_plan_id` → `subscription_plans.id`

**Relationships:**
- One-to-Many with `profiles` (clinic has many users)
- One-to-Many with `doctors` (clinic has many doctors)
- One-to-Many with `patients` (clinic has many patients)
- One-to-Many with `appointments` (clinic has many appointments)
- One-to-Many with `invoices` (clinic has many invoices)
- One-to-Many with `payments` (clinic has many payments)
- One-to-Many with `activity_logs` (clinic has many activity logs)
- One-to-Many with `notifications` (clinic has many notifications)
- One-to-Many with `clinic_settings` (clinic has many settings)
- One-to-Many with `file_attachments` (clinic has many files)
- One-to-Many with `ai_conversations` (clinic has many AI conversations)
- One-to-Many with `ai_reports` (clinic has many AI reports)
- One-to-One with `clinic_subscriptions` (clinic has one subscription)

**Index Suggestions:**
- Unique index on `slug`
- Index on `email`
- Index on `is_active`
- Index on `subscription_plan_id`
- Index on `deleted_at` (for soft delete queries)
- Composite index on `(is_active, deleted_at)`

**Constraints:**
- `name` NOT NULL
- `slug` NOT NULL, UNIQUE
- `email` NOT NULL
- `is_active` DEFAULT true
- `subscription_plan_id` NOT NULL

**Soft Delete Support:** Yes (`deleted_at` column)

**Audit Fields:** `created_at`, `updated_at`, `deleted_at`

**Multi-Tenant Notes:** This is the GLOBAL table that defines tenants. Does NOT contain `clinic_id` as it IS the clinic.

**Future Expansion Notes:**
- Add `timezone` for clinic-specific time handling
- Add `currency` for multi-currency support
- Add `locale` for localization
- Add `business_hours` JSON column for operating hours
- Add `social_media` JSON for social links
- Add `features_enabled` JSON for feature flags

---

### 2. Profiles

**Purpose:** Extended user profile information linked to Supabase auth users.

**Description:** Stores additional user information beyond Supabase auth metadata. This table extends the Supabase `auth.users` table with clinic-specific profile data.

**Columns:**
- `id` (UUID) - Primary key (matches auth.users.id)
- `clinic_id` (UUID) - FK to clinics
- `full_name` (VARCHAR(255)) - User's full name
- `phone` (VARCHAR(50)) - Contact phone number
- `avatar_url` (TEXT) - Profile picture URL
- `date_of_birth` (DATE) - Date of birth
- `gender` (VARCHAR(20)) - Gender (male, female, other, prefer_not_to_say)
- `address` (TEXT) - Physical address
- `city` (VARCHAR(100)) - City
- `state` (VARCHAR(100)) - State/Province
- `country` (VARCHAR(100)) - Country
- `postal_code` (VARCHAR(20)) - Postal/ZIP code
- `emergency_contact_name` (VARCHAR(255)) - Emergency contact name
- `emergency_contact_phone` (VARCHAR(50)) - Emergency contact phone
- `emergency_contact_relationship` (VARCHAR(100)) - Relationship to emergency contact
- `is_active` (BOOLEAN) - User active status in clinic
- `last_login_at` (TIMESTAMPTZ) - Last login timestamp
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `clinic_id` → `clinics.id`
- `id` → `auth.users.id` (Supabase auth users table)

**Relationships:**
- Many-to-One with `clinics` (user belongs to one clinic)
- One-to-Many with `user_roles` (user has many roles)
- One-to-Many with `doctors` (user can be a doctor)
- One-to-Many with `activity_logs` (user creates many logs)
- One-to-Many with `notifications` (user receives many notifications)
- One-to-Many with `file_attachments` (user uploads many files)
- One-to-Many with `ai_conversations` (user has many AI conversations)

**Index Suggestions:**
- Unique index on `id` (matches auth.users)
- Index on `clinic_id`
- Index on `phone`
- Index on `is_active`
- Index on `deleted_at`
- Composite index on `(clinic_id, is_active)`
- Composite index on `(clinic_id, deleted_at)`

**Constraints:**
- `id` NOT NULL, UNIQUE
- `clinic_id` NOT NULL
- `full_name` NOT NULL
- `is_active` DEFAULT true

**Soft Delete Support:** Yes (`deleted_at` column)

**Audit Fields:** `created_at`, `updated_at`, `deleted_at`, `last_login_at`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. Each user belongs to exactly one clinic.

**Future Expansion Notes:**
- Add `preferred_language` for localization
- Add `notification_preferences` JSON for notification settings
- Add `two_factor_enabled` for 2FA
- Add `security_settings` JSON for security preferences
- Add `profile_completion_score` for onboarding tracking

---

### 3. Roles

**Purpose:** Defines available roles in the system for RBAC.

**Description:** Global role definitions that can be assigned to users within clinics. This is a reference table for role definitions.

**Columns:**
- `id` (UUID) - Primary key
- `name` (VARCHAR(50)) - Role name (owner, administrator, doctor, receptionist, accountant, staff)
- `display_name` (VARCHAR(100)) - Human-readable role name
- `description` (TEXT) - Role description
- `permissions` (JSONB) - Role permissions object
- `is_system_role` (BOOLEAN) - Whether this is a system role (cannot be deleted)
- `level` (INTEGER) - Role hierarchy level (higher = more permissions)
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Primary Key:** `id`

**Foreign Keys:** None

**Relationships:**
- One-to-Many with `user_roles` (role assigned to many users)

**Index Suggestions:**
- Unique index on `name`
- Index on `level`
- Index on `is_system_role`

**Constraints:**
- `name` NOT NULL, UNIQUE
- `display_name` NOT NULL
- `level` NOT NULL
- `is_system_role` DEFAULT false

**Soft Delete Support:** No (system roles should not be deleted)

**Audit Fields:** `created_at`, `updated_at`

**Multi-Tenant Notes:** GLOBAL table - roles are shared across all clinics for consistency.

**Future Expansion Notes:**
- Add `category` for grouping roles
- Add `custom_permissions` for clinic-specific role extensions
- Add `role_templates` for quick role setup

---

### 4. User Roles

**Purpose:** Junction table for many-to-many relationship between users and roles.

**Description:** Assigns roles to users within their clinic context. A user can have multiple roles within a clinic.

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - FK to profiles
- `clinic_id` (UUID) - FK to clinics
- `role_id` (UUID) - FK to roles
- `assigned_by` (UUID) - FK to profiles (who assigned this role)
- `assigned_at` (TIMESTAMPTZ) - Assignment timestamp
- `expires_at` (TIMESTAMPTZ) - Optional role expiration
- `is_active` (BOOLEAN) - Role active status
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `user_id` → `profiles.id`
- `clinic_id` → `clinics.id`
- `role_id` → `roles.id`
- `assigned_by` → `profiles.id`

**Relationships:**
- Many-to-One with `profiles` (user)
- Many-to-One with `clinics` (clinic)
- Many-to-One with `roles` (role)
- Many-to-One with `profiles` (assigned by)

**Index Suggestions:**
- Unique composite index on `(user_id, clinic_id, role_id)`
- Index on `user_id`
- Index on `clinic_id`
- Index on `role_id`
- Index on `is_active`
- Index on `expires_at`
- Composite index on `(clinic_id, is_active)`

**Constraints:**
- `user_id` NOT NULL
- `clinic_id` NOT NULL
- `role_id` NOT NULL
- `is_active` DEFAULT true
- Unique constraint on `(user_id, clinic_id, role_id)`

**Soft Delete Support:** No (use `is_active` instead)

**Audit Fields:** `created_at`, `updated_at`, `assigned_at`, `assigned_by`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. Role assignments are clinic-specific.

**Future Expansion Notes:**
- Add `custom_permissions` JSON for role-specific overrides
- Add `context` JSON for additional role context
- Add `approval_status` for role change approvals

---

### 5. Doctors

**Purpose:** Stores doctor-specific information and credentials.

**Description:** Extended profile for users with doctor role. Contains medical credentials, specialization, and availability information.

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - FK to profiles
- `clinic_id` (UUID) - FK to clinics
- `medical_license_number` (VARCHAR(100)) - Medical license number
- `license_expiry_date` (DATE) - License expiration date
- `specialization` (VARCHAR(100)) - Medical specialization
- `qualification` (VARCHAR(255)) - Medical qualification/degree
- `experience_years` (INTEGER) - Years of experience
- `consultation_fee` (DECIMAL(10,2)) - Standard consultation fee
- `consultation_duration` (INTEGER) - Standard consultation duration in minutes
- `bio` (TEXT) - Doctor biography
- `is_available` (BOOLEAN) - Current availability status
- `availability_schedule` (JSONB) - Weekly availability schedule
- `languages` (TEXT[]) - Languages spoken (array)
- `education` (JSONB) - Education history
- `certifications` (JSONB) - Professional certifications
- `rating` (DECIMAL(3,2)) - Average patient rating
- `total_reviews` (INTEGER) - Total number of reviews
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `user_id` → `profiles.id`
- `clinic_id` → `clinics.id`

**Relationships:**
- One-to-One with `profiles` (doctor is a user)
- Many-to-One with `clinics` (doctor belongs to clinic)
- One-to-Many with `appointments` (doctor has many appointments)
- One-to-Many with `medical_records` (doctor creates many records)
- One-to-Many with `prescriptions` (doctor prescribes many prescriptions)

**Index Suggestions:**
- Unique index on `user_id`
- Index on `clinic_id`
- Index on `specialization`
- Index on `is_available`
- Index on `deleted_at`
- Composite index on `(clinic_id, specialization)`
- Composite index on `(clinic_id, is_available)`

**Constraints:**
- `id` NOT NULL, UNIQUE
- `user_id` NOT NULL, UNIQUE
- `clinic_id` NOT NULL
- `medical_license_number` NOT NULL
- `is_available` DEFAULT true

**Soft Delete Support:** Yes (`deleted_at` column)

**Audit Fields:** `created_at`, `updated_at`, `deleted_at`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. Doctors are clinic-specific.

**Future Expansion Notes:**
- Add `telemedicine_enabled` for virtual consultations
- Add `insurance_providers` JSON for accepted insurance
- Add `room_number` for physical location
- Add `appointment_buffer_minutes` for scheduling gaps
- Add `max_daily_patients` for capacity management

---

### 6. Patients

**Purpose:** Stores patient information and medical history.

**Description:** Patient records with personal information, medical history, and clinic-specific data. Each patient belongs to one clinic.

**Columns:**
- `id` (UUID) - Primary key
- `clinic_id` (UUID) - FK to clinics
- `patient_number` (VARCHAR(50)) - Unique clinic patient ID
- `first_name` (VARCHAR(100)) - First name
- `last_name` (VARCHAR(100)) - Last name
- `date_of_birth` (DATE) - Date of birth
- `gender` (VARCHAR(20)) - Gender
- `blood_type` (VARCHAR(10)) - Blood type
- `email` (VARCHAR(255)) - Email address
- `phone` (VARCHAR(50)) - Primary phone number
- `secondary_phone` (VARCHAR(50)) - Secondary phone number
- `address` (TEXT) - Physical address
- `city` (VARCHAR(100)) - City
- `state` (VARCHAR(100)) - State/Province
- `country` (VARCHAR(100)) - Country
- `postal_code` (VARCHAR(20)) - Postal/ZIP code
- `emergency_contact_name` (VARCHAR(255)) - Emergency contact name
- `emergency_contact_phone` (VARCHAR(50)) - Emergency contact phone
- `emergency_contact_relationship` (VARCHAR(100)) - Relationship
- `insurance_provider` (VARCHAR(255)) - Insurance company
- `insurance_policy_number` (VARCHAR(100)) - Insurance policy number
- `medical_history` (JSONB) - Medical history summary
- `allergies` (TEXT[]) - Known allergies (array)
- `chronic_conditions` (TEXT[]) - Chronic conditions (array)
- `current_medications` (TEXT[]) - Current medications (array)
- `notes` (TEXT) - General notes
- `is_active` (BOOLEAN) - Patient active status
- `first_visit_date` (DATE) - First visit date
- `last_visit_date` (DATE) - Last visit date
- `total_visits` (INTEGER) - Total visit count
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `created_by` (UUID) - FK to profiles (who created record)
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `clinic_id` → `clinics.id`
- `created_by` → `profiles.id`

**Relationships:**
- Many-to-One with `clinics` (patient belongs to clinic)
- Many-to-One with `profiles` (created by user)
- One-to-Many with `appointments` (patient has many appointments)
- One-to-Many with `medical_records` (patient has many medical records)
- One-to-Many with `prescriptions` (patient has many prescriptions)
- One-to-Many with `invoices` (patient has many invoices)
- One-to-Many with `file_attachments` (patient has many attached files)

**Index Suggestions:**
- Unique composite index on `(clinic_id, patient_number)`
- Index on `clinic_id`
- Index on `email`
- Index on `phone`
- Index on `first_name`, `last_name`
- Index on `date_of_birth`
- Index on `is_active`
- Index on `deleted_at`
- Index on `created_by`
- Composite index on `(clinic_id, is_active)`
- Composite index on `(clinic_id, last_name, first_name)`

**Constraints:**
- `clinic_id` NOT NULL
- `patient_number` NOT NULL
- `first_name` NOT NULL
- `last_name` NOT NULL
- `date_of_birth` NOT NULL
- `is_active` DEFAULT true
- Unique constraint on `(clinic_id, patient_number)`

**Soft Delete Support:** Yes (`deleted_at` column)

**Audit Fields:** `created_at`, `updated_at`, `deleted_at`, `created_by`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. Patients are clinic-specific and cannot be shared across clinics.

**Future Expansion Notes:**
- Add `preferred_doctor_id` for doctor preference
- Add `payment_method` JSON for billing preferences
- Add `consent_forms` JSON for signed consents
- Add `family_doctor_id` for primary care physician
- Add `referral_source` for tracking patient acquisition
- Add `loyalty_points` for patient loyalty program

---

### 7. Appointments

**Purpose:** Manages patient appointments with doctors.

**Description:** Scheduling system for patient appointments including status, duration, notes, and payment information.

**Columns:**
- `id` (UUID) - Primary key
- `clinic_id` (UUID) - FK to clinics
- `patient_id` (UUID) - FK to patients
- `doctor_id` (UUID) - FK to doctors
- `appointment_number` (VARCHAR(50)) - Unique appointment ID
- `status_id` (UUID) - FK to appointment_status
- `scheduled_date` (DATE) - Scheduled date
- `scheduled_time` (TIME) - Scheduled time
- `end_time` (TIME) - Expected end time
- `duration_minutes` (INTEGER) - Appointment duration
- `appointment_type` (VARCHAR(50)) - Type (consultation, follow-up, emergency, procedure)
- `reason` (TEXT) - Appointment reason
- `symptoms` (TEXT) - Patient symptoms
- `notes` (TEXT) - Doctor notes
- `is_virtual` (BOOLEAN) - Virtual/telemedicine appointment
- `virtual_meeting_link` (TEXT) - Meeting link for virtual appointments
- `fee` (DECIMAL(10,2)) - Appointment fee
- `is_paid` (BOOLEAN) - Payment status
- `payment_method` (VARCHAR(50)) - Payment method
- `reminder_sent` (BOOLEAN) - Reminder notification sent
- `reminder_sent_at` (TIMESTAMPTZ) - Reminder sent timestamp
- `check_in_time` (TIMESTAMPTZ) - Patient check-in time
- `start_time` (TIMESTAMPTZ) - Actual start time
- `end_time_actual` (TIMESTAMPTZ) - Actual end time
- `no_show` (BOOLEAN) - Patient no-show flag
- `cancellation_reason` (TEXT) - Reason for cancellation
- `cancelled_by` (UUID) - FK to profiles (who cancelled)
- `cancelled_at` (TIMESTAMPTZ) - Cancellation timestamp
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `created_by` (UUID) - FK to profiles (who created)
- `updated_by` (UUID) - FK to profiles (who last updated)
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `clinic_id` → `clinics.id`
- `patient_id` → `patients.id`
- `doctor_id` → `doctors.id`
- `status_id` → `appointment_status.id`
- `cancelled_by` → `profiles.id`
- `created_by` → `profiles.id`
- `updated_by` → `profiles.id`

**Relationships:**
- Many-to-One with `clinics` (appointment belongs to clinic)
- Many-to-One with `patients` (appointment for patient)
- Many-to-One with `doctors` (appointment with doctor)
- Many-to-One with `appointment_status` (appointment has status)
- Many-to-One with `profiles` (created by)
- Many-to-One with `profiles` (updated by)
- Many-to-One with `profiles` (cancelled by)
- One-to-Many with `medical_records` (appointment can have records)
- One-to-Many with `prescriptions` (appointment can have prescriptions)
- One-to-Many with `invoices` (appointment can generate invoices)

**Index Suggestions:**
- Unique composite index on `(clinic_id, appointment_number)`
- Index on `clinic_id`
- Index on `patient_id`
- Index on `doctor_id`
- Index on `status_id`
- Index on `scheduled_date`
- Index on `scheduled_time`
- Index on `is_virtual`
- Index on `is_paid`
- Index on `deleted_at`
- Composite index on `(clinic_id, doctor_id, scheduled_date)`
- Composite index on `(clinic_id, patient_id, scheduled_date)`
- Composite index on `(scheduled_date, status_id)`

**Constraints:**
- `clinic_id` NOT NULL
- `patient_id` NOT NULL
- `doctor_id` NOT NULL
- `status_id` NOT NULL
- `scheduled_date` NOT NULL
- `scheduled_time` NOT NULL
- `duration_minutes` NOT NULL
- Unique constraint on `(clinic_id, appointment_number)`

**Soft Delete Support:** Yes (`deleted_at` column)

**Audit Fields:** `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. Appointments are clinic-specific.

**Future Expansion Notes:**
- Add `recurrence_pattern` for recurring appointments
- Add `waitlist_status` for waitlist management
- Add `insurance_claim_id` for insurance integration
- Add `room_id` for physical location tracking
- Add `preparation_instructions` for patient preparation

---

### 8. Appointment Status

**Purpose:** Defines possible appointment statuses.

**Description:** Reference table for appointment status values (scheduled, confirmed, in-progress, completed, cancelled, no-show).

**Columns:**
- `id` (UUID) - Primary key
- `name` (VARCHAR(50)) - Status name
- `display_name` (VARCHAR(100)) - Human-readable name
- `description` (TEXT) - Status description
- `color` (VARCHAR(20)) - UI color code
- `is_final` (BOOLEAN) - Whether status is final (no further changes)
- `sort_order` (INTEGER) - Display order
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Primary Key:** `id`

**Foreign Keys:** None

**Relationships:**
- One-to-Many with `appointments` (status used by many appointments)

**Index Suggestions:**
- Unique index on `name`
- Index on `sort_order`

**Constraints:**
- `name` NOT NULL, UNIQUE
- `display_name` NOT NULL
- `sort_order` NOT NULL

**Soft Delete Support:** No (reference table)

**Audit Fields:** `created_at`, `updated_at`

**Multi-Tenant Notes:** GLOBAL table - statuses are shared across all clinics.

**Future Expansion Notes:**
- Add `notification_template` for status-specific notifications
- Add `allowed_transitions` JSON for status workflow rules

---

### 9. Medical Records

**Purpose:** Stores patient medical records and visit history.

**Description:** Detailed medical records from patient visits including diagnosis, symptoms, examination findings, and treatment plans.

**Columns:**
- `id` (UUID) - Primary key
- `clinic_id` (UUID) - FK to clinics
- `patient_id` (UUID) - FK to patients
- `doctor_id` (UUID) - FK to doctors
- `appointment_id` (UUID) - FK to appointments (optional)
- `visit_number` (INTEGER) - Visit sequence number for patient
- `visit_date` (DATE) - Visit date
- `visit_type` (VARCHAR(50)) - Visit type (initial, follow-up, emergency)
- `chief_complaint` (TEXT) - Patient's main complaint
- `present_illness` (TEXT) - History of present illness
- `past_medical_history` (TEXT) - Past medical history
- `family_history` (TEXT) - Family medical history
- `social_history` (TEXT) - Social history
- `allergies` (TEXT) - Allergies noted
- `medications` (TEXT) - Current medications
- `vital_signs` (JSONB) - Vital signs (temperature, BP, pulse, etc.)
- `examination_findings` (TEXT) - Physical examination findings
- `diagnosis` (TEXT) - Primary diagnosis
- `secondary_diagnosis` (TEXT) - Secondary diagnoses
- `icd_code` (VARCHAR(20)) - ICD diagnosis code
- `treatment_plan` (TEXT) - Treatment plan
- `procedures_performed` (TEXT) - Medical procedures performed
- `follow_up_instructions` (TEXT) - Follow-up instructions
- `notes` (TEXT) - Additional notes
- `is_confidential` (BOOLEAN) - Confidential record flag
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `created_by` (UUID) - FK to profiles (who created)
- `updated_by` (UUID) - FK to profiles (who last updated)
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `clinic_id` → `clinics.id`
- `patient_id` → `patients.id`
- `doctor_id` → `doctors.id`
- `appointment_id` → `appointments.id`
- `created_by` → `profiles.id`
- `updated_by` → `profiles.id`

**Relationships:**
- Many-to-One with `clinics` (record belongs to clinic)
- Many-to-One with `patients` (record for patient)
- Many-to-One with `doctors` (record created by doctor)
- Many-to-One with `appointments` (record from appointment)
- Many-to-One with `profiles` (created by)
- Many-to-One with `profiles` (updated by)
- One-to-Many with `prescriptions` (record can have prescriptions)
- One-to-Many with `file_attachments` (record can have attachments)

**Index Suggestions:**
- Index on `clinic_id`
- Index on `patient_id`
- Index on `doctor_id`
- Index on `appointment_id`
- Index on `visit_date`
- Index on `diagnosis`
- Index on `icd_code`
- Index on `deleted_at`
- Composite index on `(clinic_id, patient_id, visit_date)`
- Composite index on `(patient_id, visit_date)`

**Constraints:**
- `clinic_id` NOT NULL
- `patient_id` NOT NULL
- `doctor_id` NOT NULL
- `visit_date` NOT NULL

**Soft Delete Support:** Yes (`deleted_at` column)

**Audit Fields:** `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. Medical records are clinic-specific and highly confidential.

**Future Expansion Notes:**
- Add `lab_results` JSON for lab test results
- Add `imaging_studies` JSON for radiology reports
- Add `referrals` JSON for specialist referrals
- Add `consent_forms` JSON for signed consents
- Add `quality_metrics` JSON for quality tracking

---

### 10. Prescriptions

**Purpose:** Manages patient prescriptions.

**Description:** Prescription records linking medical records to prescribed medications with dosage and instructions.

**Columns:**
- `id` (UUID) - Primary key
- `clinic_id` (UUID) - FK to clinics
- `patient_id` (UUID) - FK to patients
- `doctor_id` (UUID) - FK to doctors
- `medical_record_id` (UUID) - FK to medical_records
- `appointment_id` (UUID) - FK to appointments
- `prescription_number` (VARCHAR(50)) - Unique prescription ID
- `prescription_date` (DATE) - Prescription date
- `diagnosis` (TEXT) - Diagnosis for prescription
- `notes` (TEXT) - Additional notes
- `is_active` (BOOLEAN) - Prescription active status
- `dispensed` (BOOLEAN) - Whether dispensed
- `dispensed_date` (DATE) - Dispensing date
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `created_by` (UUID) - FK to profiles (who created)
- `updated_by` (UUID) - FK to profiles (who last updated)
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `clinic_id` → `clinics.id`
- `patient_id` → `patients.id`
- `doctor_id` → `doctors.id`
- `medical_record_id` → `medical_records.id`
- `appointment_id` → `appointments.id`
- `created_by` → `profiles.id`
- `updated_by` → `profiles.id`

**Relationships:**
- Many-to-One with `clinics` (prescription belongs to clinic)
- Many-to-One with `patients` (prescription for patient)
- Many-to-One with `doctors` (prescribed by doctor)
- Many-to-One with `medical_records` (prescription from record)
- Many-to-One with `appointments` (prescription from appointment)
- Many-to-One with `profiles` (created by)
- Many-to-One with `profiles` (updated by)
- One-to-Many with `prescription_medicines` (prescription has many medicines)

**Index Suggestions:**
- Unique composite index on `(clinic_id, prescription_number)`
- Index on `clinic_id`
- Index on `patient_id`
- Index on `doctor_id`
- Index on `medical_record_id`
- Index on `appointment_id`
- Index on `prescription_date`
- Index on `is_active`
- Index on `deleted_at`
- Composite index on `(clinic_id, patient_id, prescription_date)`

**Constraints:**
- `clinic_id` NOT NULL
- `patient_id` NOT NULL
- `doctor_id` NOT NULL
- `prescription_date` NOT NULL
- Unique constraint on `(clinic_id, prescription_number)`

**Soft Delete Support:** Yes (`deleted_at` column)

**Audit Fields:** `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. Prescriptions are clinic-specific.

**Future Expansion Notes:**
- Add `pharmacy_id` for pharmacy integration
- Add `insurance_claim_id` for insurance billing
- Add `digital_signature` for electronic prescriptions
- Add `drug_interactions` JSON for interaction warnings

---

### 11. Prescription Medicines

**Purpose:** Stores individual medicines within a prescription.

**Description:** Detailed medication information for each prescribed item including dosage, frequency, and duration.

**Columns:**
- `id` (UUID) - Primary key
- `prescription_id` (UUID) - FK to prescriptions
- `clinic_id` (UUID) - FK to clinics
- `medicine_name` (VARCHAR(255)) - Medicine name
- `generic_name` (VARCHAR(255)) - Generic drug name
- `dosage` (VARCHAR(100)) - Dosage (e.g., 500mg)
- `frequency` (VARCHAR(100)) - Frequency (e.g., twice daily)
- `route` (VARCHAR(50)) - Administration route (oral, injection, etc.)
- `duration` (VARCHAR(50)) - Duration (e.g., 7 days)
- `quantity` (INTEGER) - Total quantity
- `instructions` (TEXT) - Special instructions
- `refills_allowed` (INTEGER) - Number of refills allowed
- `refills_used` (INTEGER) - Number of refills used
- `is_active` (BOOLEAN) - Medicine active status
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `prescription_id` → `prescriptions.id`
- `clinic_id` → `clinics.id`

**Relationships:**
- Many-to-One with `prescriptions` (medicine belongs to prescription)
- Many-to-One with `clinics` (medicine belongs to clinic)

**Index Suggestions:**
- Index on `prescription_id`
- Index on `clinic_id`
- Index on `medicine_name`
- Index on `generic_name`
- Index on `is_active`
- Index on `deleted_at`

**Constraints:**
- `prescription_id` NOT NULL
- `clinic_id` NOT NULL
- `medicine_name` NOT NULL
- `dosage` NOT NULL

**Soft Delete Support:** Yes (`deleted_at` column)

**Audit Fields:** `created_at`, `updated_at`, `deleted_at`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. Prescription medicines are clinic-specific.

**Future Expansion Notes:**
- Add `ndc_code` for National Drug Code
- Add `drug_interactions` JSON for interaction data
- Add `cost` for pricing information
- Add `manufacturer` for manufacturer information

---

### 12. Invoices

**Purpose:** Manages patient billing invoices.

**Description:** Invoice records for services rendered to patients, including status, amounts, and payment tracking.

**Columns:**
- `id` (UUID) - Primary key
- `clinic_id` (UUID) - FK to clinics
- `patient_id` (UUID) - FK to patients
- `invoice_number` (VARCHAR(50)) - Unique invoice number
- `appointment_id` (UUID) - FK to appointments (optional)
- `invoice_date` (DATE) - Invoice date
- `due_date` (DATE) - Payment due date
- `subtotal` (DECIMAL(10,2)) - Subtotal amount
- `tax_amount` (DECIMAL(10,2)) - Tax amount
- `discount_amount` (DECIMAL(10,2)) - Discount amount
- `total_amount` (DECIMAL(10,2)) - Total amount
- `amount_paid` (DECIMAL(10,2)) - Amount paid
- `balance_due` (DECIMAL(10,2)) - Balance remaining
- `status` (VARCHAR(50)) - Invoice status (draft, sent, partial, paid, overdue, cancelled)
- `payment_terms` (VARCHAR(100)) - Payment terms
- `notes` (TEXT) - Invoice notes
- `sent_date` (DATE) - Date invoice was sent to patient
- `reminder_sent` (BOOLEAN) - Payment reminder sent
- `reminder_sent_at` (TIMESTAMPTZ) - Reminder sent timestamp
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `created_by` (UUID) - FK to profiles (who created)
- `updated_by` (UUID) - FK to profiles (who last updated)
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `clinic_id` → `clinics.id`
- `patient_id` → `patients.id`
- `appointment_id` → `appointments.id`
- `created_by` → `profiles.id`
- `updated_by` → `profiles.id`

**Relationships:**
- Many-to-One with `clinics` (invoice belongs to clinic)
- Many-to-One with `patients` (invoice for patient)
- Many-to-One with `appointments` (invoice for appointment)
- Many-to-One with `profiles` (created by)
- Many-to-One with `profiles` (updated by)
- One-to-Many with `invoice_items` (invoice has many items)
- One-to-Many with `payments` (invoice has many payments)

**Index Suggestions:**
- Unique composite index on `(clinic_id, invoice_number)`
- Index on `clinic_id`
- Index on `patient_id`
- Index on `appointment_id`
- Index on `invoice_date`
- Index on `due_date`
- Index on `status`
- Index on `deleted_at`
- Composite index on `(clinic_id, patient_id, status)`
- Composite index on `(clinic_id, status, due_date)`

**Constraints:**
- `clinic_id` NOT NULL
- `patient_id` NOT NULL
- `invoice_number` NOT NULL
- `invoice_date` NOT NULL
- `total_amount` NOT NULL
- Unique constraint on `(clinic_id, invoice_number)`

**Soft Delete Support:** Yes (`deleted_at` column)

**Audit Fields:** `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. Invoices are clinic-specific.

**Future Expansion Notes:**
- Add `insurance_claim_id` for insurance integration
- Add `recurring_invoice_id` for recurring billing
- Add `late_fee_amount` for late payment fees
- Add `currency` for multi-currency support
- Add `payment_gateway_id` for payment processing

---

### 13. Invoice Items

**Purpose:** Stores individual line items within an invoice.

**Description:** Detailed breakdown of invoice items including services, products, descriptions, and pricing.

**Columns:**
- `id` (UUID) - Primary key
- `invoice_id` (UUID) - FK to invoices
- `clinic_id` (UUID) - FK to clinics
- `item_type` (VARCHAR(50)) - Item type (service, product, consultation, procedure)
- `description` (TEXT) - Item description
- `quantity` (INTEGER) - Quantity
- `unit_price` (DECIMAL(10,2)) - Price per unit
- `discount_amount` (DECIMAL(10,2)) - Discount amount
- `tax_amount` (DECIMAL(10,2)) - Tax amount
- `total_amount` (DECIMAL(10,2)) - Total amount
- `service_date` (DATE) - Date service was provided
- `notes` (TEXT) - Additional notes
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `invoice_id` → `invoices.id`
- `clinic_id` → `clinics.id`

**Relationships:**
- Many-to-One with `invoices` (item belongs to invoice)
- Many-to-One with `clinics` (item belongs to clinic)

**Index Suggestions:**
- Index on `invoice_id`
- Index on `clinic_id`
- Index on `item_type`
- Index on `service_date`
- Index on `deleted_at`

**Constraints:**
- `invoice_id` NOT NULL
- `clinic_id` NOT NULL
- `description` NOT NULL
- `quantity` NOT NULL
- `unit_price` NOT NULL

**Soft Delete Support:** Yes (`deleted_at` column)

**Audit Fields:** `created_at`, `updated_at`, `deleted_at`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. Invoice items are clinic-specific.

**Future Expansion Notes:**
- Add `service_code` for standardized coding
- Add `tax_rate` for tax calculation
- Add `reference_id` for linking to appointments/prescriptions
- Add `is_taxable` for tax exemption

---

### 14. Payments

**Purpose:** Tracks payments received for invoices.

**Description:** Payment records linking invoices to payment transactions with method, amount, and status information.

**Columns:**
- `id` (UUID) - Primary key
- `clinic_id` (UUID) - FK to clinics
- `invoice_id` (UUID) - FK to invoices
- `payment_number` (VARCHAR(50)) - Unique payment ID
- `payment_date` (DATE) - Payment date
- `payment_method` (VARCHAR(50)) - Payment method (cash, card, insurance, transfer)
- `payment_gateway` (VARCHAR(50)) - Payment gateway used
- `transaction_id` (VARCHAR(255)) - External transaction ID
- `amount` (DECIMAL(10,2)) - Payment amount
- `currency` (VARCHAR(10)) - Currency code
- `status` (VARCHAR(50)) - Payment status (pending, completed, failed, refunded)
- `notes` (TEXT) - Payment notes
- `refunded_amount` (DECIMAL(10,2)) - Refunded amount
- `refund_reason` (TEXT) - Reason for refund
- `refunded_at` (TIMESTAMPTZ) - Refund timestamp
- `receipt_url` (TEXT) - Receipt document URL
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `created_by` (UUID) - FK to profiles (who recorded)
- `updated_by` (UUID) - FK to profiles (who last updated)
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `clinic_id` → `clinics.id`
- `invoice_id` → `invoices.id`
- `created_by` → `profiles.id`
- `updated_by` → `profiles.id`

**Relationships:**
- Many-to-One with `clinics` (payment belongs to clinic)
- Many-to-One with `invoices` (payment for invoice)
- Many-to-One with `profiles` (created by)
- Many-to-One with `profiles` (updated by)

**Index Suggestions:**
- Unique composite index on `(clinic_id, payment_number)`
- Index on `clinic_id`
- Index on `invoice_id`
- Index on `payment_date`
- Index on `payment_method`
- Index on `status`
- Index on `transaction_id`
- Index on `deleted_at`
- Composite index on `(clinic_id, invoice_id, status)`
- Composite index on `(clinic_id, payment_date, status)`

**Constraints:**
- `clinic_id` NOT NULL
- `invoice_id` NOT NULL
- `payment_number` NOT NULL
- `payment_date` NOT NULL
- `amount` NOT NULL
- Unique constraint on `(clinic_id, payment_number)`

**Soft Delete Support:** Yes (`deleted_at` column)

**Audit Fields:** `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. Payments are clinic-specific.

**Future Expansion Notes:**
- Add `installment_number` for installment payments
- Add `payment_plan_id` for payment plans
- Add `auto_payment_enabled` for recurring payments
- Add `failure_reason` for failed payments
- Add `metadata` JSON for additional payment data

---

### 15. Expenses

**Purpose:** Tracks clinic operational expenses.

**Description:** Expense records for clinic operations including salaries, utilities, supplies, and other business expenses.

**Columns:**
- `id` (UUID) - Primary key
- `clinic_id` (UUID) - FK to clinics
- `expense_number` (VARCHAR(50)) - Unique expense ID
- `expense_date` (DATE) - Expense date
- `category` (VARCHAR(100)) - Expense category (salary, utilities, supplies, rent, etc.)
- `sub_category` (VARCHAR(100)) - Expense sub-category
- `description` (TEXT) - Expense description
- `amount` (DECIMAL(10,2)) - Expense amount
- `currency` (VARCHAR(10)) - Currency code
- `payment_method` (VARCHAR(50)) - Payment method
- `vendor` (VARCHAR(255)) - Vendor/supplier name
- `invoice_reference` (VARCHAR(100)) - Vendor invoice reference
- `receipt_url` (TEXT) - Receipt document URL
- `is_recurring` (BOOLEAN) - Recurring expense flag
- `recurring_frequency` (VARCHAR(50)) - Recurring frequency (monthly, quarterly, yearly)
- `next_due_date` (DATE) - Next due date for recurring expenses
- `status` (VARCHAR(50)) - Expense status (pending, approved, paid, cancelled)
- `approved_by` (UUID) - FK to profiles (who approved)
- `approved_at` (TIMESTAMPTZ) - Approval timestamp
- `notes` (TEXT) - Additional notes
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `created_by` (UUID) - FK to profiles (who created)
- `updated_by` (UUID) - FK to profiles (who last updated)
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `clinic_id` → `clinics.id`
- `approved_by` → `profiles.id`
- `created_by` → `profiles.id`
- `updated_by` → `profiles.id`

**Relationships:**
- Many-to-One with `clinics` (expense belongs to clinic)
- Many-to-One with `profiles` (approved by)
- Many-to-One with `profiles` (created by)
- Many-to-One with `profiles` (updated by)

**Index Suggestions:**
- Unique composite index on `(clinic_id, expense_number)`
- Index on `clinic_id`
- Index on `expense_date`
- Index on `category`
- Index on `status`
- Index on `is_recurring`
- Index on `next_due_date`
- Index on `deleted_at`
- Composite index on `(clinic_id, category, expense_date)`
- Composite index on `(clinic_id, status, expense_date)`

**Constraints:**
- `clinic_id` NOT NULL
- `expense_number` NOT NULL
- `expense_date` NOT NULL
- `category` NOT NULL
- `amount` NOT NULL
- Unique constraint on `(clinic_id, expense_number)`

**Soft Delete Support:** Yes (`deleted_at` column)

**Audit Fields:** `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`, `approved_by`, `approved_at`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. Expenses are clinic-specific.

**Future Expansion Notes:**
- Add `budget_id` for budget tracking
- Add `project_id` for project-based expenses
- Add `tax_deductible` for tax reporting
- Add `payment_terms` for vendor terms
- Add `tags` JSON for expense categorization

---

### 16. Notifications

**Purpose:** Manages system notifications for users.

**Description:** Notification records for in-app, email, SMS, and push notifications with delivery tracking and status.

**Columns:**
- `id` (UUID) - Primary key
- `clinic_id` (UUID) - FK to clinics
- `user_id` (UUID) - FK to profiles (optional - for user-specific)
- `type` (VARCHAR(50)) - Notification type (appointment, payment, system, reminder)
- `channel` (VARCHAR(50)) - Delivery channel (in_app, email, sms, whatsapp, push)
- `title` (VARCHAR(255)) - Notification title
- `message` (TEXT) - Notification message
- `data` (JSONB) - Additional notification data
- `priority` (VARCHAR(20)) - Priority level (low, normal, high, urgent)
- `status` (VARCHAR(50)) - Delivery status (pending, sent, delivered, failed)
- `scheduled_for` (TIMESTAMPTZ) - Scheduled delivery time
- `sent_at` (TIMESTAMPTZ) - Actual send time
- `delivered_at` (TIMESTAMPTZ) - Delivery confirmation time
- `read_at` (TIMESTAMPTZ) - Read timestamp
- `error_message` (TEXT) - Error message if failed
- `retry_count` (INTEGER) - Number of retry attempts
- `expires_at` (TIMESTAMPTZ) - Notification expiration time
- `related_entity_type` (VARCHAR(50)) - Related entity type (appointment, invoice, etc.)
- `related_entity_id` (UUID) - Related entity ID
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `clinic_id` → `clinics.id`
- `user_id` → `profiles.id`

**Relationships:**
- Many-to-One with `clinics` (notification belongs to clinic)
- Many-to-One with `profiles` (notification for user)

**Index Suggestions:**
- Index on `clinic_id`
- Index on `user_id`
- Index on `type`
- Index on `channel`
- Index on `status`
- Index on `scheduled_for`
- Index on `read_at`
- Index on `deleted_at`
- Composite index on `(clinic_id, user_id, status)`
- Composite index on `(clinic_id, status, scheduled_for)`

**Constraints:**
- `clinic_id` NOT NULL
- `type` NOT NULL
- `channel` NOT NULL
- `status` NOT NULL

**Soft Delete Support:** Yes (`deleted_at` column)

**Audit Fields:** `created_at`, `updated_at`, `deleted_at`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. Notifications are clinic-specific.

**Future Expansion Notes:**
- Add `template_id` for notification templates
- Add `batch_id` for batch notifications
- Add `delivery_metadata` JSON for delivery tracking
- Add `user_preferences_respected` for preference compliance

---

### 17. Clinic Settings

**Purpose:** Stores clinic-specific configuration settings.

**Description:** Key-value settings for clinic customization including business hours, branding, and feature configurations.

**Columns:**
- `id` (UUID) - Primary key
- `clinic_id` (UUID) - FK to clinics
- `setting_key` (VARCHAR(100)) - Setting key
- `setting_value` (TEXT) - Setting value (can be JSON)
- `setting_type` (VARCHAR(50)) - Value type (string, number, boolean, json)
- `category` (VARCHAR(50)) - Setting category (general, branding, features, integration)
- `description` (TEXT) - Setting description
- `is_encrypted` (BOOLEAN) - Whether value is encrypted
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `clinic_id` → `clinics.id`

**Relationships:**
- Many-to-One with `clinics` (setting belongs to clinic)

**Index Suggestions:**
- Unique composite index on `(clinic_id, setting_key)`
- Index on `clinic_id`
- Index on `setting_key`
- Index on `category`

**Constraints:**
- `clinic_id` NOT NULL
- `setting_key` NOT NULL
- Unique constraint on `(clinic_id, setting_key)`

**Soft Delete Support:** No (settings should not be soft deleted)

**Audit Fields:** `created_at`, `updated_at`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. Settings are clinic-specific.

**Future Expansion Notes:**
- Add `environment` for environment-specific settings
- Add `validation_schema` JSON for value validation
- Add `access_level` for permission-based settings

---

### 18. Activity Logs

**Purpose:** Comprehensive audit logging for all system activities.

**Description:** Records all user actions, system events, and data changes for security, compliance, and debugging purposes.

**Columns:**
- `id` (UUID) - Primary key
- `clinic_id` (UUID) - FK to clinics (optional for global events)
- `user_id` (UUID) - FK to profiles (optional for system events)
- `action` (VARCHAR(50)) - Action performed (login, logout, create, update, delete)
- `entity_type` (VARCHAR(50)) - Entity type affected (patient, appointment, invoice, etc.)
- `entity_id` (UUID) - ID of affected entity
- `old_values` (JSONB) - Previous values (for updates)
- `new_values` (JSONB) - New values (for creates/updates)
- `changes` (JSONB) - Specific changes made
- `ip_address` (INET) - User IP address
- `user_agent` (TEXT) - Browser/user agent string
- `device_type` (VARCHAR(50)) - Device type (desktop, mobile, tablet)
- `location` (JSONB) - Geographic location data
- `success` (BOOLEAN) - Whether action was successful
- `error_message` (TEXT) - Error message if failed
- `session_id` (UUID) - User session ID
- `request_id` (VARCHAR(100)) - Request tracking ID
- `metadata` (JSONB) - Additional metadata
- `created_at` (TIMESTAMPTZ) - Creation timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `clinic_id` → `clinics.id`
- `user_id` → `profiles.id`

**Relationships:**
- Many-to-One with `clinics` (log belongs to clinic)
- Many-to-One with `profiles` (log belongs to user)

**Index Suggestions:**
- Index on `clinic_id`
- Index on `user_id`
- Index on `action`
- Index on `entity_type`
- Index on `entity_id`
- Index on `created_at`
- Index on `success`
- Index on `ip_address`
- Composite index on `(clinic_id, user_id, created_at)`
- Composite index on `(entity_type, entity_id)`
- Composite index on `(created_at, action)`

**Constraints:**
- `action` NOT NULL
- `created_at` NOT NULL

**Soft Delete Support:** No (audit logs should never be deleted)

**Audit Fields:** `created_at` only (audit logs are self-auditing)

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. Activity logs are clinic-specific. Global system events may have NULL `clinic_id`.

**Future Expansion Notes:**
- Add `retention_period` for log retention policies
- Add `compliance_category` for regulatory compliance
- Add `risk_level` for security risk assessment
- Add `export_status` for audit export tracking

---

### 19. File Attachments

**Purpose:** Manages file uploads and document storage.

**Description:** File attachment records for various entities including medical records, prescriptions, invoices, and profiles with storage metadata.

**Columns:**
- `id` (UUID) - Primary key
- `clinic_id` (UUID) - FK to clinics
- `uploaded_by` (UUID) - FK to profiles
- `entity_type` (VARCHAR(50)) - Entity type (patient, medical_record, prescription, invoice)
- `entity_id` (UUID) - ID of related entity
- `file_name` (VARCHAR(255)) - Original file name
- `file_path` (TEXT) - Storage path/URL
- `file_size` (BIGINT) - File size in bytes
- `file_type` (VARCHAR(100)) - MIME type
- `file_category` (VARCHAR(50)) - File category (document, image, video, report)
- `description` (TEXT) - File description
- `is_public` (BOOLEAN) - Public access flag
- `expires_at` (TIMESTAMPTZ) - Expiration date for temporary files
- `download_count` (INTEGER) - Download count
- `last_downloaded_at` (TIMESTAMPTZ) - Last download timestamp
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `clinic_id` → `clinics.id`
- `uploaded_by` → `profiles.id`

**Relationships:**
- Many-to-One with `clinics` (file belongs to clinic)
- Many-to-One with `profiles` (uploaded by user)

**Index Suggestions:**
- Index on `clinic_id`
- Index on `uploaded_by`
- Index on `entity_type`
- Index on `entity_id`
- Index on `file_category`
- Index on `is_public`
- Index on `expires_at`
- Index on `deleted_at`
- Composite index on `(entity_type, entity_id)`
- Composite index on `(clinic_id, entity_type, entity_id)`

**Constraints:**
- `clinic_id` NOT NULL
- `uploaded_by` NOT NULL
- `file_name` NOT NULL
- `file_path` NOT NULL
- `file_size` NOT NULL

**Soft Delete Support:** Yes (`deleted_at` column)

**Audit Fields:** `created_at`, `updated_at`, `deleted_at`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. File attachments are clinic-specific.

**Future Expansion Notes:**
- Add `storage_provider` for multi-cloud support
- Add `thumbnail_path` for image thumbnails
- Add `virus_scan_status` for security
- Add `access_permissions` JSON for granular access
- Add `version` for file versioning

---

### 20. Subscription Plans

**Purpose:** Defines available subscription plans for clinics.

**Description:** Subscription plan definitions with pricing, features, and limits for the SaaS offering.

**Columns:**
- `id` (UUID) - Primary key
- `name` (VARCHAR(100)) - Plan name (Free, Starter, Professional, Enterprise)
- `slug` (VARCHAR(100)) - URL-friendly plan identifier
- `description` (TEXT) - Plan description
- `price_monthly` (DECIMAL(10,2)) - Monthly price
- `price_yearly` (DECIMAL(10,2)) - Yearly price
- `currency` (VARCHAR(10)) - Currency code
- `trial_days` (INTEGER) - Trial period in days
- `max_doctors` (INTEGER) - Maximum doctors allowed
- `max_patients` (INTEGER) - Maximum patients allowed
- `max_appointments_per_month` (INTEGER) - Monthly appointment limit
- `max_storage_gb` (INTEGER) - Storage limit in GB
- `max_users` (INTEGER) - Maximum users allowed
- `features` (JSONB) - Enabled features object
- `limitations` (JSONB) - Plan limitations
- `is_active` (BOOLEAN) - Plan active status
- `is_public` (BOOLEAN) - Publicly visible
- `sort_order` (INTEGER) - Display order
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Primary Key:** `id`

**Foreign Keys:** None

**Relationships:**
- One-to-Many with `clinics` (plan used by many clinics)
- One-to-Many with `clinic_subscriptions` (plan has many subscriptions)

**Index Suggestions:**
- Unique index on `slug`
- Index on `name`
- Index on `is_active`
- Index on `is_public`
- Index on `sort_order`

**Constraints:**
- `name` NOT NULL
- `slug` NOT NULL, UNIQUE
- `price_monthly` NOT NULL
- `is_active` DEFAULT true
- Unique constraint on `slug`

**Soft Delete Support:** No (use `is_active` instead)

**Audit Fields:** `created_at`, `updated_at`

**Multi-Tenant Notes:** GLOBAL table - subscription plans are shared across all clinics.

**Future Expansion Notes:**
- Add `price_quarterly` for quarterly billing
- Add `setup_fee` for one-time setup fees
- Add `addon_plans` for add-on options
- Add `promotion_codes` for discount codes
- Add `grace_period_days` for payment grace period

---

### 21. Clinic Subscriptions

**Purpose:** Manages active clinic subscriptions.

**Description:** Subscription records linking clinics to subscription plans with billing cycle, payment status, and renewal information.

**Columns:**
- `id` (UUID) - Primary key
- `clinic_id` (UUID) - FK to clinics
- `subscription_plan_id` (UUID) - FK to subscription_plans
- `subscription_number` (VARCHAR(50)) - Unique subscription ID
- `status` (VARCHAR(50)) - Subscription status (trial, active, past_due, cancelled, expired)
- `billing_cycle` (VARCHAR(50)) - Billing cycle (monthly, yearly)
- `start_date` (DATE) - Subscription start date
- `end_date` (DATE) - Subscription end date
- `trial_end_date` (DATE) - Trial end date
- `next_billing_date` (DATE) - Next billing date
- `cancel_at_period_end` (BOOLEAN) - Cancel at period end
- `cancelled_at` (TIMESTAMPTZ) - Cancellation timestamp
- `cancellation_reason` (TEXT) - Reason for cancellation
- `price` (DECIMAL(10,2)) - Subscription price
- `currency` (VARCHAR(10)) - Currency code
- `payment_method` (VARCHAR(50)) - Payment method
- `payment_gateway_id` (VARCHAR(255)) - Payment gateway subscription ID
- `metadata` (JSONB) - Additional subscription data
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `clinic_id` → `clinics.id`
- `subscription_plan_id` → `subscription_plans.id`

**Relationships:**
- One-to-One with `clinics` (subscription belongs to clinic)
- Many-to-One with `subscription_plans` (subscription uses plan)

**Index Suggestions:**
- Unique composite index on `(clinic_id)`
- Unique composite index on `(subscription_number)`
- Index on `subscription_plan_id`
- Index on `status`
- Index on `next_billing_date`
- Index on `end_date`
- Composite index on `(status, next_billing_date)`

**Constraints:**
- `clinic_id` NOT NULL, UNIQUE
- `subscription_plan_id` NOT NULL
- `subscription_number` NOT NULL, UNIQUE
- `status` NOT NULL
- `start_date` NOT NULL
- Unique constraint on `clinic_id` (one subscription per clinic)

**Soft Delete Support:** No (use status instead)

**Audit Fields:** `created_at`, `updated_at`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. Each clinic has exactly one subscription.

**Future Expansion Notes:**
- Add `usage_metrics` JSON for usage tracking
- Add `overage_charges` for exceeding limits
- Add `promotion_code` for applied discounts
- Add `invoice_thresholds` for billing alerts
- Add `auto_renew` for automatic renewal settings

---

### 22. AI Conversations

**Purpose:** Stores AI chat conversations for future AI features.

**Description:** Placeholder for AI-powered chat conversations between users and AI assistants for medical queries, appointment assistance, and general support.

**Columns:**
- `id` (UUID) - Primary key
- `clinic_id` (UUID) - FK to clinics
- `user_id` (UUID) - FK to profiles
- `conversation_type` (VARCHAR(50)) - Type (medical_assistant, appointment_assistant, billing_assistant, general)
- `title` (VARCHAR(255)) - Conversation title
- `context` (JSONB) - Conversation context and metadata
- `model` (VARCHAR(100)) - AI model used
- `model_version` (VARCHAR(50)) - Model version
- `total_tokens` (INTEGER) - Total tokens used
- `total_cost` (DECIMAL(10,4)) - Total cost
- `is_active` (BOOLEAN) - Conversation active status
- `started_at` (TIMESTAMPTZ) - Conversation start time
- `ended_at` (TIMESTAMPTZ) - Conversation end time
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `clinic_id` → `clinics.id`
- `user_id` → `profiles.id`

**Relationships:**
- Many-to-One with `clinics` (conversation belongs to clinic)
- Many-to-One with `profiles` (conversation by user)
- One-to-Many with `ai_messages` (conversation has many messages) - *Future table*

**Index Suggestions:**
- Index on `clinic_id`
- Index on `user_id`
- Index on `conversation_type`
- Index on `is_active`
- Index on `started_at`
- Index on `deleted_at`
- Composite index on `(clinic_id, user_id, is_active)`

**Constraints:**
- `clinic_id` NOT NULL
- `user_id` NOT NULL
- `conversation_type` NOT NULL

**Soft Delete Support:** Yes (`deleted_at` column)

**Audit Fields:** `created_at`, `updated_at`, `deleted_at`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. AI conversations are clinic-specific.

**Future Expansion Notes:**
- Add `ai_messages` table for individual messages
- Add `sentiment_analysis` for conversation insights
- Add `feedback_rating` for user feedback
- Add `tags` for conversation categorization
- Add `sharing_enabled` for conversation sharing

---

### 23. AI Reports

**Purpose:** Stores AI-generated reports and analyses.

**Description:** Placeholder for AI-generated reports including medical summaries, appointment insights, billing analytics, and predictive analytics.

**Columns:**
- `id` (UUID) - Primary key
- `clinic_id` (UUID) - FK to clinics
- `user_id` (UUID) - FK to profiles (who requested)
- `report_type` (VARCHAR(50)) - Report type (medical_summary, appointment_insights, billing_analytics, patient_trends)
- `title` (VARCHAR(255)) - Report title
- `description` (TEXT) - Report description
- `parameters` (JSONB) - Report generation parameters
- `data_source` (JSONB) - Data sources used
- `model` (VARCHAR(100)) - AI model used
- `model_version` (VARCHAR(50)) - Model version
- `report_data` (JSONB) - Generated report data
- `insights` (JSONB) - Key insights extracted
- `confidence_score` (DECIMAL(3,2)) - AI confidence score
- `total_tokens` (INTEGER) - Total tokens used
- `total_cost` (DECIMAL(10,4)) - Total cost
- `status` (VARCHAR(50)) - Generation status (pending, processing, completed, failed)
- `error_message` (TEXT) - Error message if failed
- `generated_at` (TIMESTAMPTZ) - Report generation timestamp
- `expires_at` (TIMESTAMPTZ) - Report expiration date
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

**Primary Key:** `id`

**Foreign Keys:**
- `clinic_id` → `clinics.id`
- `user_id` → `profiles.id`

**Relationships:**
- Many-to-One with `clinics` (report belongs to clinic)
- Many-to-One with `profiles` (report requested by user)

**Index Suggestions:**
- Index on `clinic_id`
- Index on `user_id`
- Index on `report_type`
- Index on `status`
- Index on `generated_at`
- Index on `expires_at`
- Index on `deleted_at`
- Composite index on `(clinic_id, report_type, status)`
- Composite index on `(clinic_id, user_id, generated_at)`

**Constraints:**
- `clinic_id` NOT NULL
- `user_id` NOT NULL
- `report_type` NOT NULL
- `status` NOT NULL

**Soft Delete Support:** Yes (`deleted_at` column)

**Audit Fields:** `created_at`, `updated_at`, `deleted_at`

**Multi-Tenant Notes:** Contains `clinic_id` for data isolation. AI reports are clinic-specific.

**Future Expansion Notes:**
- Add `report_schedule` for automated reports
- Add `sharing_settings` for report distribution
- Add `export_formats` for export options
- Add `visualization_config` for chart settings
- Add `drill_down_data` for detailed analysis

---

## Relationships

### Core Relationships

**Clinic → Profiles (One-to-Many)**
- One clinic has many users (profiles)
- Each user belongs to exactly one clinic
- Enforced via `profiles.clinic_id`

**Clinic → Doctors (One-to-Many)**
- One clinic has many doctors
- Each doctor belongs to exactly one clinic
- Enforced via `doctors.clinic_id`

**Clinic → Patients (One-to-Many)**
- One clinic has many patients
- Each patient belongs to exactly one clinic
- Enforced via `patients.clinic_id`

**Clinic → Appointments (One-to-Many)**
- One clinic has many appointments
- Each appointment belongs to exactly one clinic
- Enforced via `appointments.clinic_id`

**Clinic → Invoices (One-to-Many)**
- One clinic has many invoices
- Each invoice belongs to exactly one clinic
- Enforced via `invoices.clinic_id`

**Clinic → Clinic Subscription (One-to-One)**
- One clinic has exactly one subscription
- Each subscription belongs to exactly one clinic
- Enforced via unique constraint on `clinic_subscriptions.clinic_id`

### User & Role Relationships

**Profiles → User Roles (One-to-Many)**
- One user can have many role assignments
- Each role assignment belongs to exactly one user
- Junction table for many-to-many relationship

**Roles → User Roles (One-to-Many)**
- One role can be assigned to many users
- Each role assignment belongs to exactly one role
- Junction table for many-to-many relationship

**Profiles → Doctors (One-to-One)**
- One user can be at most one doctor
- Each doctor is exactly one user
- Enforced via unique constraint on `doctors.user_id`

### Healthcare Relationships

**Doctors → Appointments (One-to-Many)**
- One doctor has many appointments
- Each appointment is with exactly one doctor
- Enforced via `appointments.doctor_id`

**Patients → Appointments (One-to-Many)**
- One patient has many appointments
- Each appointment is for exactly one patient
- Enforced via `appointments.patient_id`

**Appointments → Medical Records (One-to-Many)**
- One appointment can generate multiple medical records
- Each medical record is associated with at most one appointment
- Optional relationship via `medical_records.appointment_id`

**Patients → Medical Records (One-to-Many)**
- One patient has many medical records
- Each medical record belongs to exactly one patient
- Enforced via `medical_records.patient_id`

**Doctors → Medical Records (One-to-Many)**
- One doctor creates many medical records
- Each medical record is created by exactly one doctor
- Enforced via `medical_records.doctor_id`

**Medical Records → Prescriptions (One-to-Many)**
- One medical record can have multiple prescriptions
- Each prescription is associated with exactly one medical record
- Enforced via `prescriptions.medical_record_id`

**Prescriptions → Prescription Medicines (One-to-Many)**
- One prescription has multiple medicines
- Each medicine belongs to exactly one prescription
- Enforced via `prescription_medicines.prescription_id`

### Billing Relationships

**Patients → Invoices (One-to-Many)**
- One patient has many invoices
- Each invoice is for exactly one patient
- Enforced via `invoices.patient_id`

**Appointments → Invoices (One-to-Many)**
- One appointment can generate multiple invoices
- Each invoice is associated with at most one appointment
- Optional relationship via `invoices.appointment_id`

**Invoices → Invoice Items (One-to-Many)**
- One invoice has many line items
- Each invoice item belongs to exactly one invoice
- Enforced via `invoice_items.invoice_id`

**Invoices → Payments (One-to-Many)**
- One invoice can receive multiple payments
- Each payment is for exactly one invoice
- Enforced via `payments.invoice_id`

### System Relationships

**Clinics → Activity Logs (One-to-Many)**
- One clinic generates many activity logs
- Each activity log belongs to at most one clinic (NULL for global events)
- Enforced via `activity_logs.clinic_id`

**Profiles → Activity Logs (One-to-Many)**
- One user generates many activity logs
- Each activity log is generated by at most one user
- Enforced via `activity_logs.user_id`

**Clinics → Notifications (One-to-Many)**
- One clinic has many notifications
- Each notification belongs to exactly one clinic
- Enforced via `notifications.clinic_id`

**Profiles → Notifications (One-to-Many)**
- One user receives many notifications
- Each notification is for at most one user
- Optional relationship via `notifications.user_id`

**Clinics → File Attachments (One-to-Many)**
- One clinic has many file attachments
- Each file attachment belongs to exactly one clinic
- Enforced via `file_attachments.clinic_id`

**Entity → File Attachments (Polymorphic One-to-Many)**
- Any entity (patient, medical_record, prescription, invoice) can have many file attachments
- Each file attachment belongs to exactly one entity
- Enforced via `file_attachments.entity_type` and `file_attachments.entity_id`

### Subscription Relationships

**Subscription Plans → Clinics (One-to-Many)**
- One subscription plan is used by many clinics
- Each clinic uses exactly one subscription plan
- Enforced via `clinics.subscription_plan_id`

**Subscription Plans → Clinic Subscriptions (One-to-Many)**
- One subscription plan has many subscription records
- Each clinic subscription uses exactly one plan
- Enforced via `clinic_subscriptions.subscription_plan_id`

**Clinics → Clinic Subscriptions (One-to-One)**
- One clinic has exactly one subscription
- Each clinic subscription belongs to exactly one clinic
- Enforced via unique constraint on `clinic_subscriptions.clinic_id`

### AI Relationships (Future)

**Clinics → AI Conversations (One-to-Many)**
- One clinic has many AI conversations
- Each AI conversation belongs to exactly one clinic
- Enforced via `ai_conversations.clinic_id`

**Profiles → AI Conversations (One-to-Many)**
- One user has many AI conversations
- Each AI conversation belongs to exactly one user
- Enforced via `ai_conversations.user_id`

**Clinics → AI Reports (One-to-Many)**
- One clinic has many AI reports
- Each AI report belongs to exactly one clinic
- Enforced via `ai_reports.clinic_id`

**Profiles → AI Reports (One-to-Many)**
- One user can request many AI reports
- Each AI report is requested by exactly one user
- Enforced via `ai_reports.user_id`

---

## Multi-Tenant Design

### Tables with `clinic_id` (Tenant-Specific)

These tables require `clinic_id` for complete data isolation:

**Core Tenant Tables:**
- `profiles` - Users belong to clinics
- `doctors` - Doctors belong to clinics
- `patients` - Patients belong to clinics
- `appointments` - Appointments belong to clinics
- `medical_records` - Medical records belong to clinics
- `prescriptions` - Prescriptions belong to clinics
- `prescription_medicines` - Prescription medicines belong to clinics
- `invoices` - Invoices belong to clinics
- `invoice_items` - Invoice items belong to clinics
- `payments` - Payments belong to clinics
- `expenses` - Expenses belong to clinics
- `notifications` - Notifications belong to clinics
- `clinic_settings` - Settings belong to clinics
- `file_attachments` - Files belong to clinics
- `user_roles` - Role assignments are clinic-specific
- `activity_logs` - Activity logs are clinic-specific
- `ai_conversations` - AI conversations belong to clinics
- `ai_reports` - AI reports belong to clinics

### Global Tables (Shared Across Tenants)

These tables do NOT require `clinic_id` and are shared across all clinics:

**Reference Tables:**
- `roles` - Role definitions are global
- `appointment_status` - Appointment statuses are global
- `subscription_plans` - Subscription plans are global

**Tenant Definition Table:**
- `clinics` - This table DEFINES tenants, does not reference them

### Multi-Tenant Isolation Strategy

**Row-Level Security (RLS) Implementation:**
- All tenant-specific tables will have RLS policies
- Policies will use `auth.jwt() -> clinic_id` to filter rows
- Users can only access rows where `clinic_id` matches their clinic
- Global tables will have different RLS policies or no RLS

**Data Access Patterns:**
- All queries to tenant-specific tables must include `clinic_id` filter
- Application middleware should automatically inject `clinic_id` from session
- API endpoints must validate `clinic_id` matches user's clinic

**Cross-Tenant Prevention:**
- Foreign key constraints prevent cross-tenant data relationships
- Application-level validation ensures `clinic_id` consistency
- RLS policies prevent cross-tenant data access at database level

---

## Role-Based Access Control

### Supported Roles

**Owner**
- Full access to all clinic data
- Can manage subscriptions and billing
- Can assign and revoke all roles
- Can delete clinic data
- Highest permission level

**Administrator**
- Full access to clinic operations
- Can manage users and roles (except owner)
- Can manage billing and invoices
- Can configure clinic settings
- Cannot delete clinic or manage subscription

**Doctor**
- Access to patient records they treat
- Can create and edit medical records
- Can prescribe medications
- Can view their appointments
- Cannot access billing or financial data
- Cannot manage other users

**Receptionist**
- Can manage appointments
- Can view patient basic information
- Can generate invoices
- Cannot access medical records
- Cannot access sensitive patient data
- Cannot manage users or settings

**Accountant**
- Full access to billing and financial data
- Can manage invoices and payments
- Can view expense reports
- Cannot access patient medical data
- Cannot manage appointments or medical records

**Staff**
- Limited access based on assignment
- Can view assigned data only
- Cannot modify sensitive data
- Cannot access financial or medical records

### Permission Implementation Strategy

**Role-Based Permissions:**
- Each role has predefined permissions stored in `roles.permissions` JSONB
- Permissions are structured as: `{ "resource": "action" }`
- Example: `{ "patients": ["read", "write"], "invoices": ["read"] }`

**Fine-Grained Access Control:**
- RLS policies will check user's role permissions
- Application middleware will enforce permission checks
- Permission checks can be cached for performance

**Permission Hierarchy:**
- Higher level roles inherit lower level permissions
- Custom permissions can be added per user via `user_roles`
- Permission system designed for future extensibility

**Implementation Example:**
```sql
-- RLS Policy Example
CREATE POLICY doctors_read_own_patients ON medical_records
FOR SELECT
USING (
  clinic_id = auth.jwt()->>'clinic_id'
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND clinic_id = auth.jwt()->>'clinic_id'
    AND role_id IN (SELECT id FROM roles WHERE name = 'doctor')
  )
);
```

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GLOBAL TABLES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────────────┐     │
│  │   Roles      │◄─────│ User Roles   │─────►│   Profiles            │     │
│  └──────────────┘      └──────────────┘      └──────────┬─────────────┘     │
│                                                             │               │
│  ┌──────────────┐                                      │               │
│  │Subscription  │◄─────────────────────────────────────┼───────────────┐ │
│  │    Plans     │                                      │               │ │
│  └──────────────┘                                      │               │ │
│                                                       │               │ │
│  ┌──────────────┐                                    │               │ │
│  │ Appointment  │                                    │               │ │
│  │   Status     │                                    │               │ │
│  └──────────────┘                                    │               │ │
│                                                       │               │ │
└───────────────────────────────────────────────────────┼───────────────┼─┘
                                                        │               │
┌───────────────────────────────────────────────────────┼───────────────┼─┐
│                      TENANT TABLES                    │               │ │
├───────────────────────────────────────────────────────┼───────────────┼─┤
│                                                       │               │ │
│  ┌──────────────┐                                    │               │ │
│  │   Clinics     │◄───────────────────────────────────┘               │ │
│  │              │                                                    │ │
│  └──────┬───────┘                                                    │ │
│         │                                                             │ │
│         ├─────────────────────────────────────────────────────────────┘ │
│         │                                                               │
│         ├─────────────────────────────────────────────────────────────► │
│         │                                                               │
│         │  ┌──────────────┐      ┌──────────────┐                     │
│         │  │   Doctors    │      │  Patients    │                     │
│         │  └──────┬───────┘      └──────┬───────┘                     │
│         │         │                     │                               │
│         │         └──────────┬──────────┘                               │
│         │                    │                                         │
│         │                    ▼                                         │
│         │         ┌──────────────────┐                                 │
│         │         │  Appointments    │                                 │
│         │         └────────┬─────────┘                                 │
│         │                  │                                           │
│         │    ┌─────────────┴─────────────┐                             │
│         │    │                           │                             │
│         │    ▼                           ▼                             │
│         │ ┌─────────────┐         ┌─────────────┐                      │
│         │ │Medical      │         │Prescriptions│                      │
│         │ │Records      │         └──────┬──────┘                      │
│         │ └─────────────┘                │                             │
│         │                                ▼                             │
│         │                    ┌──────────────────┐                      │
│         │                    │Prescription      │                      │
│         │                    │Medicines         │                      │
│         │                    └──────────────────┘                      │
│         │                                                           │
│         │  ┌──────────────┐      ┌──────────────┐                     │
│         └─►│  Invoices    │◄─────│  Payments    │                     │
│            └──────┬───────┘      └──────────────┘                     │
│                   │                                                     │
│                   ▼                                                     │
│            ┌──────────────┐                                            │
│            │Invoice Items │                                            │
│            └──────────────┘                                            │
│                                                                      │
│  ┌──────────────┐                                                   │
│  │  Expenses    │                                                   │
│  └──────────────┘                                                   │
│                                                                      │
│  ┌──────────────┐                                                   │
│  │Notifications │                                                   │
│  └──────────────┘                                                   │
│                                                                      │
│  ┌──────────────┐                                                   │
│  │Clinic Settings│                                                  │
│  └──────────────┘                                                   │
│                                                                      │
│  ┌──────────────┐                                                   │
│  │Activity Logs │                                                   │
│  └──────────────┘                                                   │
│                                                                      │
│  ┌──────────────┐                                                   │
│  │File Attachments│                                                  │
│  └──────────────┘                                                   │
│                                                                      │
│  ┌──────────────┐                                                   │
│  │Clinic        │                                                   │
│  │Subscription  │                                                   │
│  └──────────────┘                                                   │
│                                                                      │
│  ┌──────────────┐      ┌──────────────┐                             │
│  │AI Conversations│    │  AI Reports  │                             │
│  └──────────────┘      └──────────────┘                             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Database Architecture Summary

### Architecture Principles

**1. Multi-Tenancy by Design**
- Complete data isolation per clinic via `clinic_id` foreign keys
- Row-Level Security (RLS) policies for database-level enforcement
- Global tables for shared reference data
- Tenant-specific tables for all operational data

**2. Scalability**
- UUID primary keys for distributed system compatibility
- Indexed foreign keys for performant joins
- Composite indexes for common query patterns
- Soft delete support for data retention and recovery

**3. Audit & Compliance**
- Comprehensive activity logging for all operations
- Audit fields (created_at, updated_at, created_by, updated_by) on critical tables
- Immutable audit logs for regulatory compliance
- Healthcare-specific considerations (HIPAA readiness)

**4. Flexibility & Extensibility**
- JSONB columns for flexible data storage
- Placeholder tables for future AI features
- Subscription system for business model support
- Notification system for multi-channel communication

**5. Data Integrity**
- Foreign key constraints for referential integrity
- Unique constraints for business rules
- NOT NULL constraints for required fields
- Check constraints for data validation (to be implemented)

### Key Design Decisions

**UUID vs Integer Primary Keys:**
- UUIDs chosen for distributed system compatibility
- No暴露 business information in URLs
- Better for multi-region deployment
- Slight performance trade-off acceptable for benefits

**Soft Delete Strategy:**
- `deleted_at` timestamp instead of hard deletes
- Preserves data for audit trail
- Enables data recovery
- RLS policies can filter deleted records

**JSONB Usage:**
- Flexible storage for structured data
- Reduces need for schema migrations
- Enables complex data structures
- Queryable with PostgreSQL JSON operators

**Subscription System:**
- Separate subscription plans from clinic data
- Enables easy plan management and upgrades
- Supports trial periods and billing cycles
- Future-ready for feature-based pricing

### Healthcare Considerations

**Patient Privacy:**
- Complete data isolation per clinic
- Confidential flags on sensitive records
- Audit logging for all patient data access
- Future encryption support for sensitive fields

**Medical Records:**
- Comprehensive visit history tracking
- Linkage to appointments for context
- Support for multiple diagnoses and treatments
- Future lab results and imaging integration

**Prescription Management:**
- Detailed medication tracking
- Dosage, frequency, and duration information
- Refill tracking capability
- Future pharmacy integration support

**Billing Integration:**
- Flexible invoice item structure
- Multiple payment support
- Insurance claim readiness
- Expense tracking for clinic operations

---

## Table Creation Order

Tables must be created in dependency order to satisfy foreign key constraints:

### Phase 1: Global Reference Tables
1. `roles` - No dependencies
2. `appointment_status` - No dependencies
3. `subscription_plans` - No dependencies

### Phase 2: Core Tenant Tables
4. `clinics` - No dependencies (defines tenants)
5. `profiles` - Depends on `clinics`
6. `user_roles` - Depends on `profiles`, `roles`, `clinics`

### Phase 3: Healthcare Provider Tables
7. `doctors` - Depends on `profiles`, `clinics`

### Phase 4: Patient Tables
8. `patients` - Depends on `clinics`

### Phase 5: Appointment Tables
9. `appointments` - Depends on `clinics`, `patients`, `doctors`, `appointment_status`

### Phase 6: Medical Records Tables
10. `medical_records` - Depends on `clinics`, `patients`, `doctors`, `appointments`
11. `prescriptions` - Depends on `clinics`, `patients`, `doctors`, `medical_records`, `appointments`
12. `prescription_medicines` - Depends on `prescriptions`, `clinics`

### Phase 7: Billing Tables
13. `invoices` - Depends on `clinics`, `patients`, `appointments`
14. `invoice_items` - Depends on `invoices`, `clinics`
15. `payments` - Depends on `clinics`, `invoices`

### Phase 8: Financial Tables
16. `expenses` - Depends on `clinics`

### Phase 9: Subscription Tables
17. `clinic_subscriptions` - Depends on `clinics`, `subscription_plans`

### Phase 10: System Tables
18. `clinic_settings` - Depends on `clinics`
19. `notifications` - Depends on `clinics`, `profiles`
20. `activity_logs` - Depends on `clinics`, `profiles`
21. `file_attachments` - Depends on `clinics`, `profiles`

### Phase 11: AI Tables (Future)
22. `ai_conversations` - Depends on `clinics`, `profiles`
23. `ai_reports` - Depends on `clinics`, `profiles`

---

## Recommendations Before Writing SQL

### 1. Database Configuration

**Enable Required Extensions:**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- For encryption
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search
```

**Configure UUID Generation:**
- Use `gen_random_uuid()` for UUID generation (PostgreSQL 13+)
- Or use `uuid-ossp` extension for older versions

### 2. Row-Level Security (RLS) Strategy

**Enable RLS on All Tenant Tables:**
```sql
ALTER TABLE tenant_table ENABLE ROW LEVEL SECURITY;
```

**Create RLS Policy Template:**
```sql
CREATE POLICY "tenant_isolation" ON tenant_table
FOR ALL
USING (clinic_id = auth.jwt()->>'clinic_id')
WITH CHECK (clinic_id = auth.jwt()->>'clinic_id');
```

**Global Tables RLS:**
- Reference tables: No RLS or read-only for authenticated users
- Activity logs: Special policies for audit trail access

### 3. Index Strategy

**Create Indexes After Table Creation:**
- Create indexes after data loading for performance
- Use CONCURRENTLY for production environments
- Monitor index usage and adjust as needed

**Composite Index Guidelines:**
- Create for frequently queried column combinations
- Follow leftmost prefix rule for effectiveness
- Consider index size vs query performance

### 4. Data Validation

**Implement Check Constraints:**
```sql
ALTER TABLE appointments
ADD CONSTRAINT check_end_time_after_start
CHECK (end_time > scheduled_time);
```

**Implement Trigger-Based Validation:**
- Complex business rules
- Cross-table validation
- Data consistency enforcement

### 5. Performance Optimization

**Table Partitioning (Future):**
- Consider partitioning large tables by date
- `activity_logs` by month
- `appointments` by year
- `notifications` by month

**Materialized Views (Future):**
- Dashboard statistics
- Reporting aggregates
- Common query results

**Connection Pooling:**
- Configure PgBouncer for high concurrency
- Use prepared statements for repeated queries
- Implement query result caching

### 6. Backup & Recovery

**Backup Strategy:**
- Daily full backups
- Point-in-time recovery enabled
- Separate backup for each environment
- Test restore procedures regularly

**Data Retention:**
- Implement activity log retention policy
- Archive old data to cold storage
- Consider data anonymization for old records

### 7. Security Considerations

**Encryption at Rest:**
- Enable PostgreSQL encryption
- Encrypt sensitive columns using `pgcrypto`
- Use TLS for database connections

**Network Security:**
- Restrict database access by IP
- Use Supabase's built-in security features
- Implement API rate limiting

**HIPAA Compliance (Future):**
- Implement audit logging for all PHI access
- Enable database activity monitoring
- Implement data access controls
- Regular security audits

### 8. Migration Strategy

**Version Control:**
- Use Supabase migrations or custom migration tool
- Version all schema changes
- Document breaking changes
- Test migrations on staging environment

**Rollback Strategy:**
- Design migrations to be reversible
- Keep rollback scripts ready
- Test rollback procedures
- Have emergency rollback plan

### 9. Monitoring & Alerting

**Database Monitoring:**
- Monitor query performance
- Track connection pool usage
- Monitor disk space and growth
- Set up alerts for critical metrics

**Application Monitoring:**
- Track RLS policy performance
- Monitor query patterns
- Alert on slow queries
- Track database error rates

### 10. Testing Strategy

**Unit Testing:**
- Test RLS policies
- Test constraint enforcement
- Test trigger logic
- Test data validation

**Integration Testing:**
- Test multi-tenant isolation
- Test role-based access
- Test complex queries
- Test transaction behavior

**Load Testing:**
- Test concurrent user access
- Test query performance under load
- Test connection pool limits
- Test database scalability

---

## Conclusion

This database architecture provides a solid foundation for the Jafferi Clinic multi-tenant healthcare SaaS application. The design emphasizes:

- **Data Isolation:** Complete tenant separation via `clinic_id` and RLS
- **Scalability:** UUID keys, proper indexing, and flexible JSONB columns
- **Healthcare Focus:** Comprehensive patient records, medical history, and prescription management
- **Business Model:** Subscription system with flexible plans and billing
- **Future-Proof:** AI feature placeholders and extensibility points
- **Compliance:** Audit logging, soft deletes, and healthcare considerations

The architecture is designed to grow with the application while maintaining data integrity, security, and performance. The modular design allows for incremental implementation and easy feature additions.

**Next Steps:**
1. Review and validate the design with stakeholders
2. Create SQL migrations following the table creation order
3. Implement RLS policies for all tenant tables
4. Set up comprehensive testing
5. Configure monitoring and alerting
6. Document deployment procedures
