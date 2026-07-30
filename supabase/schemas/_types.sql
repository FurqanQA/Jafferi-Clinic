-- ============================================================================
-- Jafferi Clinic - Common ENUM Types
-- ============================================================================
-- This file contains all ENUM type definitions used across the database.
-- These must be created before any tables that reference them.
-- ============================================================================

-- Gender Enum
CREATE TYPE gender_enum AS ENUM (
    'male',
    'female',
    'other',
    'prefer_not_to_say'
);

COMMENT ON TYPE gender_enum IS 'Gender options for patients and users';

-- Appointment Status Enum
CREATE TYPE appointment_status_enum AS ENUM (
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'no_show'
);

COMMENT ON TYPE appointment_status_enum IS 'Status values for appointments';

-- Appointment Type Enum
CREATE TYPE appointment_type_enum AS ENUM (
    'consultation',
    'follow_up',
    'emergency',
    'procedure'
);

COMMENT ON TYPE appointment_type_enum IS 'Types of appointments';

-- Invoice Status Enum
CREATE TYPE invoice_status_enum AS ENUM (
    'draft',
    'sent',
    'partial',
    'paid',
    'overdue',
    'cancelled'
);

COMMENT ON TYPE invoice_status_enum IS 'Status values for invoices';

-- Payment Method Enum
CREATE TYPE payment_method_enum AS ENUM (
    'cash',
    'card',
    'insurance',
    'transfer',
    'check'
);

COMMENT ON TYPE payment_method_enum IS 'Payment method options';

-- Payment Status Enum
CREATE TYPE payment_status_enum AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);

COMMENT ON TYPE payment_status_enum IS 'Status values for payments';

-- Expense Status Enum
CREATE TYPE expense_status_enum AS ENUM (
    'pending',
    'approved',
    'paid',
    'cancelled'
);

COMMENT ON TYPE expense_status_enum IS 'Status values for expenses';

-- Expense Category Enum
CREATE TYPE expense_category_enum AS ENUM (
    'salary',
    'utilities',
    'supplies',
    'rent',
    'insurance',
    'maintenance',
    'marketing',
    'other'
);

COMMENT ON TYPE expense_category_enum IS 'Categories for clinic expenses';

-- Notification Type Enum
CREATE TYPE notification_type_enum AS ENUM (
    'appointment',
    'payment',
    'system',
    'reminder',
    'alert'
);

COMMENT ON TYPE notification_type_enum IS 'Types of notifications';

-- Notification Channel Enum
CREATE TYPE notification_channel_enum AS ENUM (
    'in_app',
    'email',
    'sms',
    'whatsapp',
    'push'
);

COMMENT ON TYPE notification_channel_enum IS 'Delivery channels for notifications';

-- Notification Status Enum
CREATE TYPE notification_status_enum AS ENUM (
    'pending',
    'sent',
    'delivered',
    'failed'
);

COMMENT ON TYPE notification_status_enum IS 'Delivery status for notifications';

-- Notification Priority Enum
CREATE TYPE notification_priority_enum AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);

COMMENT ON TYPE notification_priority_enum IS 'Priority levels for notifications';

-- Subscription Status Enum
CREATE TYPE subscription_status_enum AS ENUM (
    'trial',
    'active',
    'past_due',
    'cancelled',
    'expired'
);

COMMENT ON TYPE subscription_status_enum IS 'Status values for clinic subscriptions';

-- Billing Cycle Enum
CREATE TYPE billing_cycle_enum AS ENUM (
    'monthly',
    'quarterly',
    'yearly'
);

COMMENT ON TYPE billing_cycle_enum IS 'Billing cycle options for subscriptions';

-- Setting Type Enum
CREATE TYPE setting_type_enum AS ENUM (
    'string',
    'number',
    'boolean',
    'json'
);

COMMENT ON TYPE setting_type_enum IS 'Data types for clinic settings';

-- Setting Category Enum
CREATE TYPE setting_category_enum AS ENUM (
    'general',
    'branding',
    'features',
    'integration',
    'security'
);

COMMENT ON TYPE setting_category_enum IS 'Categories for clinic settings';

-- File Category Enum
CREATE TYPE file_category_enum AS ENUM (
    'document',
    'image',
    'video',
    'report',
    'lab_result',
    'prescription',
    'invoice',
    'receipt'
);

COMMENT ON TYPE file_category_enum IS 'Categories for file attachments';

-- Item Type Enum
CREATE TYPE item_type_enum AS ENUM (
    'service',
    'product',
    'consultation',
    'procedure',
    'medication'
);

COMMENT ON TYPE item_type_enum IS 'Types of invoice items';

-- Visit Type Enum
CREATE TYPE visit_type_enum AS ENUM (
    'initial',
    'follow_up',
    'emergency',
    'routine'
);

COMMENT ON TYPE visit_type_enum IS 'Types of patient visits';

-- Action Enum (for Activity Logs)
CREATE TYPE action_enum AS ENUM (
    'login',
    'logout',
    'create',
    'update',
    'delete',
    'view',
    'export',
    'import',
    'approve',
    'reject',
    'assign',
    'revoke'
);

COMMENT ON TYPE action_enum IS 'Action types for activity logging';

-- Entity Type Enum (for Activity Logs)
CREATE TYPE entity_type_enum AS ENUM (
    'clinic',
    'user',
    'doctor',
    'patient',
    'appointment',
    'medical_record',
    'prescription',
    'invoice',
    'payment',
    'expense',
    'notification',
    'file',
    'setting',
    'subscription'
);

COMMENT ON TYPE entity_type_enum IS 'Entity types for activity logging';

-- AI Conversation Type Enum
CREATE TYPE ai_conversation_type_enum AS ENUM (
    'medical_assistant',
    'appointment_assistant',
    'billing_assistant',
    'general'
);

COMMENT ON TYPE ai_conversation_type_enum IS 'Types of AI conversations';

-- AI Report Type Enum
CREATE TYPE ai_report_type_enum AS ENUM (
    'medical_summary',
    'appointment_insights',
    'billing_analytics',
    'patient_trends',
    'operational_metrics'
);

COMMENT ON TYPE ai_report_type_enum IS 'Types of AI-generated reports';

-- AI Report Status Enum
CREATE TYPE ai_report_status_enum AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);

COMMENT ON TYPE ai_report_status_enum IS 'Generation status for AI reports';
