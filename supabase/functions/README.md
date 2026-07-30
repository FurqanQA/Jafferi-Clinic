# Jafferi Clinic - Database Functions

This directory contains production-ready PostgreSQL functions for the Jafferi Clinic multi-tenant SaaS application.

## Overview

Functions provide reusable business logic, data validation, and automation for the database layer. These functions are designed to be secure, performant, and maintainable.

## Function Files

| File | Description |
|------|-------------|
| `utilities.sql` | Common utility functions for UUID generation, slug creation, number generation, and timestamp management |
| `auth.sql` | Authentication functions for profile creation, role assignment, and session management |
| `clinics.sql` | Clinic management functions for slug/code generation and validation |
| `appointments.sql` | Appointment management functions for scheduling, validation, and status updates |
| `billing.sql` | Billing functions for invoice generation, payment processing, and calculations |
| `notifications.sql` | Notification functions for creating and managing system notifications |
| `activity_logs.sql` | Activity logging functions for audit trail and compliance |

## Execution Order

Functions should be applied in the following order:

1. `utilities.sql` - Foundation utilities used by other functions
2. `auth.sql` - Authentication functions
3. `clinics.sql` - Clinic management functions
4. `appointments.sql` - Appointment functions
5. `billing.sql` - Billing functions
6. `notifications.sql` - Notification functions
7. `activity_logs.sql` - Activity logging functions

## Applying Functions

### Apply All Functions
```bash
# From the supabase directory
psql -h localhost -U postgres -d jafferi_clinic -f functions/utilities.sql
psql -h localhost -U postgres -d jafferi_clinic -f functions/auth.sql
psql -h localhost -U postgres -d jafferi_clinic -f functions/clinics.sql
psql -h localhost -U postgres -d jafferi_clinic -f functions/appointments.sql
psql -h localhost -U postgres -d jafferi_clinic -f functions/billing.sql
psql -h localhost -U postgres -d jafferi_clinic -f functions/notifications.sql
psql -h localhost -U postgres -d jafferi_clinic -f functions/activity_logs.sql
```

## Function Categories

### Utility Functions

#### Timestamp Management
- `update_updated_at_column()` - Automatically update `updated_at` timestamp

#### UUID Generation
- `generate_uuid()` - Generate a new UUID

#### Slug Generation
- `generate_slug(input_text)` - Generate URL-friendly slug from text
- `generate_unique_slug(base_text, table_name, column_name)` - Generate unique slug with collision handling

#### Number Generation
- `generate_invoice_number(clinic_id)` - Generate invoice number (INV-YYYYMMDD-XXXXX)
- `generate_patient_number(clinic_id)` - Generate patient number (PTN-XXXX-XXXXX)
- `generate_doctor_number(clinic_id)` - Generate doctor number (DOC-XXXX-XXXXX)
- `generate_appointment_number(clinic_id)` - Generate appointment number (APT-YYYYMMDD-XXXXX)
- `generate_clinic_code(clinic_name)` - Generate clinic code (CLN-XXX000)

#### Validation Functions
- `is_valid_email(email)` - Validate email format
- `is_valid_phone(phone)` - Validate phone number format

#### Date/Time Utilities
- `calculate_business_days(start_date, end_date)` - Calculate business days excluding weekends

#### String Utilities
- `truncate_text(input_text, max_length)` - Truncate text with ellipsis

#### Clinic Context
- `get_current_user_clinic_id()` - Get current user's clinic ID
- `get_current_user_role()` - Get current user's role name

### Authentication Functions

#### Profile Creation
- `handle_new_user()` - Trigger function to create profile after signup

#### Role Assignment
- `assign_user_role(user_id, clinic_id, role_name, assigned_by)` - Assign role to user
- `remove_user_role(user_id, clinic_id, role_name, removed_by)` - Remove role from user

#### User Management
- `link_user_to_clinic(user_id, clinic_id, linked_by)` - Link user to clinic

#### Password Management
- `log_password_change(user_id, ip_address, user_agent)` - Log password change
- `log_password_reset(user_id, ip_address, user_agent)` - Log password reset request

#### Email Verification
- `log_email_verification(user_id, ip_address, user_agent)` - Log email verification

#### Session Management
- `log_user_login(user_id, ip_address, user_agent)` - Log user login
- `log_user_logout(user_id, ip_address, user_agent)` - Log user logout

### Clinic Functions

#### Clinic Creation
- `set_clinic_slug()` - Trigger function to generate clinic slug
- `set_clinic_code()` - Trigger function to generate clinic code

#### Clinic Validation
- `prevent_duplicate_clinic_name()` - Prevent duplicate clinic names in same region

#### Clinic Management
- `deactivate_clinic(clinic_id, deactivated_by)` - Soft delete clinic
- `reactivate_clinic(clinic_id, reactivated_by)` - Reactivate clinic

#### Clinic Statistics
- `get_clinic_statistics(clinic_id)` - Get clinic statistics as JSONB

### Appointment Functions

#### Appointment Creation
- `set_appointment_number()` - Trigger function to generate appointment number

#### Appointment Validation
- `prevent_double_booking()` - Prevent double booking for same doctor/time
- `validate_doctor_availability()` - Validate doctor is active

#### Appointment Duration
- `calculate_appointment_duration()` - Calculate duration from start/end times

#### Appointment Status
- `update_appointment_status()` - Automatically update status based on date/time
- `set_appointment_status(appointment_id, status_name, updated_by)` - Manually set status

#### Appointment Management
- `check_in_appointment(appointment_id, checked_in_by)` - Check in patient
- `cancel_appointment(appointment_id, cancelled_by, reason)` - Cancel appointment
- `complete_appointment(appointment_id, completed_by)` - Complete appointment

### Billing Functions

#### Invoice Creation
- `set_invoice_number()` - Trigger function to generate invoice number

#### Invoice Calculations
- `calculate_invoice_total()` - Calculate total from items, tax, and discount
- `calculate_invoice_tax(invoice_id)` - Calculate tax based on clinic settings
- `calculate_invoice_discount(invoice_id)` - Calculate discount based on patient/clinic settings

#### Payment Processing
- `update_invoice_payment_status()` - Update status based on payments received
- `mark_invoice_paid()` - Mark invoice as paid when full payment received

#### Invoice Management
- `create_invoice_from_appointment(appointment_id, created_by)` - Create invoice from appointment
- `send_invoice_reminder(invoice_id)` - Send invoice reminder notification

#### Payment Management
- `process_payment(invoice_id, amount, payment_method, reference, processed_by)` - Process payment
- `refund_payment(payment_id, refund_amount, reason, refunded_by)` - Refund payment

### Notification Functions

#### Appointment Notifications
- `notify_appointment_created(appointment_id)` - Notify patient and doctor of new appointment
- `notify_appointment_updated(appointment_id)` - Notify of appointment changes
- `notify_appointment_cancelled(appointment_id)` - Notify of appointment cancellation

#### Invoice Notifications
- `notify_invoice_generated(invoice_id)` - Notify patient of new invoice

#### Payment Notifications
- `notify_payment_received(payment_id)` - Notify admins of payment received

#### User Management Notifications
- `notify_user_invitation(user_id, invited_by)` - Notify user of invitation
- `notify_password_changed(user_id)` - Notify user of password change

#### Notification Management
- `mark_notification_read(notification_id)` - Mark notification as read
- `mark_all_notifications_read(user_id)` - Mark all user notifications as read
- `delete_notification(notification_id)` - Delete notification

### Activity Log Functions

#### Generic Activity Logging
- `log_insert(clinic_id, user_id, entity_type, entity_id, details)` - Log INSERT activity
- `log_update(clinic_id, user_id, entity_type, entity_id, details)` - Log UPDATE activity
- `log_delete(clinic_id, user_id, entity_type, entity_id, details)` - Log DELETE activity

#### Entity-Specific Logging
- `log_patient_activity(patient_id, action, user_id, details)` - Log patient activity
- `log_appointment_activity(appointment_id, action, user_id, details)` - Log appointment activity
- `log_medical_record_activity(medical_record_id, action, user_id, details)` - Log medical record activity
- `log_prescription_activity(prescription_id, action, user_id, details)` - Log prescription activity
- `log_invoice_activity(invoice_id, action, user_id, details)` - Log invoice activity

#### Audit Trail Queries
- `get_entity_activity_log(entity_type, entity_id, limit)` - Get activity log for entity
- `get_user_activity_log(user_id, limit)` - Get activity log for user
- `get_clinic_activity_log(clinic_id, limit)` - Get activity log for clinic

#### Activity Log Cleanup
- `archive_old_activity_logs(days_old)` - Archive old logs
- `delete_old_activity_logs(days_old)` - Delete old logs (use with caution)

## Security Considerations

### SECURITY DEFINER
Functions that need elevated privileges use `SECURITY DEFINER` to execute with the privileges of the function owner rather than the caller. This is used for:
- Authentication functions (profile creation, role assignment)
- Clinic context functions (getting user's clinic/role)
- Activity logging functions
- Notification functions

### Input Validation
All functions validate inputs and raise exceptions for invalid data:
- Role existence checks
- Amount validation (refunds cannot exceed original payment)
- Clinic ID validation
- Entity existence checks

### Audit Trail
All sensitive operations are logged to `activity_logs`:
- User creation and role changes
- Password changes and resets
- Financial transactions
- Medical record access

## Performance Considerations

### Indexes
Ensure proper indexes exist for function performance:
```sql
-- On profiles
CREATE INDEX idx_profiles_clinic_id ON profiles(clinic_id);
CREATE INDEX idx_profiles_id ON profiles(id);

-- On user_roles
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_clinic_id ON user_roles(clinic_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- On roles
CREATE INDEX idx_roles_name ON roles(name);
```

### Function Optimization
- Use `EXISTS` instead of `IN` for subqueries
- Use `IS NOT DISTINCT FROM` for null-safe comparisons
- Avoid unnecessary queries in loops
- Use `COALESCE` for default values

## Testing Functions

### Test Utility Functions
```sql
-- Test slug generation
SELECT generate_slug('My Clinic Name');
-- Expected: my-clinic-name

-- Test number generation
SELECT generate_invoice_number('uuid-here');
-- Expected: INV-YYYYMMDD-00001
```

### Test Auth Functions
```sql
-- Test role assignment
SELECT assign_user_role('user-uuid', 'clinic-uuid', 'doctor', 'admin-uuid');
-- Expected: true

-- Test clinic context
SELECT get_current_user_clinic_id();
SELECT get_current_user_role();
```

### Test Appointment Functions
```sql
-- Test appointment status
SELECT set_appointment_status('appointment-uuid', 'completed', 'user-uuid');
-- Expected: true
```

### Test Billing Functions
```sql
-- Test invoice creation
SELECT create_invoice_from_appointment('appointment-uuid', 'user-uuid');
-- Returns: invoice-uuid
```

## Troubleshooting

### Function Not Found
1. Check if functions file was applied: `\df function_name`
2. Verify execution order (utilities first)
3. Check for syntax errors in function definition

### Permission Denied
1. Verify function has `SECURITY DEFINER` if needed
2. Check user has execute permissions
3. Verify RLS policies allow function execution

### Performance Issues
1. Add missing indexes on referenced columns
2. Review function complexity
3. Check for unnecessary subqueries
4. Consider using materialized views for complex queries

### Trigger Errors
1. Verify trigger function exists
2. Check trigger timing (BEFORE/AFTER)
3. Validate trigger conditions
4. Review trigger execution order

## Best Practices

1. **Always use parameters** - Never hardcode values in functions
2. **Validate inputs** - Always validate function parameters
3. **Use transactions** - Wrap multi-step operations in transactions
4. **Log important operations** - Use activity logs for audit trail
5. **Handle errors gracefully** - Use exceptions with meaningful messages
6. **Document functions** - Add comments explaining complex logic
7. **Test thoroughly** - Test functions with various inputs
8. **Use SECURITY DEFINER sparingly** - Only when necessary for security
9. **Avoid side effects** - Functions should be predictable
10. **Keep functions focused** - Single responsibility principle

## Maintenance

### Adding New Functions
1. Add to appropriate function file
2. Follow existing naming conventions
3. Add documentation to README
4. Test thoroughly
5. Update triggers if needed

### Modifying Existing Functions
1. Review impact on dependent code
2. Test with various inputs
3. Update documentation
4. Consider backward compatibility
5. Communicate changes to team

### Deprecating Functions
1. Mark as deprecated in comments
2. Create replacement function
3. Update dependent code
4. Remove after deprecation period
5. Update documentation

## References

- [PostgreSQL Functions Documentation](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [PostgreSQL PL/pgSQL Documentation](https://www.postgresql.org/docs/current/plpgsql.html)
- [Supabase Functions Guide](https://supabase.com/docs/guides/database/functions)
