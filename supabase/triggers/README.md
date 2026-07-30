# Jafferi Clinic - Database Triggers

This directory contains production-ready PostgreSQL triggers for the Jafferi Clinic multi-tenant SaaS application.

## Overview

Triggers automate database operations, enforce business rules, maintain data integrity, and provide audit trails. They execute automatically in response to specific events on tables.

## Trigger Files

| File | Description |
|------|-------------|
| `auth.sql` | Triggers for authentication, profile creation, and user management |
| `clinics.sql` | Triggers for clinic management, slug/code generation, and validation |
| `appointments.sql` | Triggers for appointment scheduling, validation, and status updates |
| `billing.sql` | Triggers for invoice generation, payment processing, and calculations |
| `notifications.sql` | Triggers for automatic notification creation and management |
| `activity_logs.sql` | Triggers for activity logging on key entities |

## Execution Order

Triggers should be applied in the following order:

1. `auth.sql` - Authentication triggers
2. `clinics.sql` - Clinic triggers
3. `appointments.sql` - Appointment triggers
4. `billing.sql` - Billing triggers
5. `notifications.sql` - Notification triggers
6. `activity_logs.sql` - Activity log triggers

## Applying Triggers

### Apply All Triggers
```bash
# From the supabase directory
psql -h localhost -U postgres -d jafferi_clinic -f triggers/auth.sql
psql -h localhost -U postgres -d jafferi_clinic -f triggers/clinics.sql
psql -h localhost -U postgres -d jafferi_clinic -f triggers/appointments.sql
psql -h localhost -U postgres -d jafferi_clinic -f triggers/billing.sql
psql -h localhost -U postgres -d jafferi_clinic -f triggers/notifications.sql
psql -h localhost -U postgres -d jafferi_clinic -f triggers/activity_logs.sql
```

## Trigger Categories

### Authentication Triggers

#### Auth User Triggers
- `on_auth_user_created` - Create profile after user signup

#### Profile Triggers
- `update_profiles_updated_at` - Update timestamp on profile update
- `log_profile_insert` - Log profile creation
- `log_profile_update` - Log profile changes

#### User Roles Triggers
- `update_user_roles_updated_at` - Update timestamp on role update
- `log_user_role_insert` - Log role assignment
- `log_user_role_update` - Log role changes

### Clinic Triggers

#### Clinic Triggers
- `set_clinic_slug_before_insert` - Generate clinic slug
- `set_clinic_code_before_insert` - Generate clinic code
- `prevent_duplicate_clinic_names` - Prevent duplicate names on insert
- `prevent_duplicate_clinic_names_update` - Prevent duplicate names on update
- `update_clinics_updated_at` - Update timestamp on clinic update
- `log_clinic_insert` - Log clinic creation
- `log_clinic_update` - Log clinic changes
- `log_clinic_delete` - Log clinic deletion

#### Clinic Settings Triggers
- `update_clinic_settings_updated_at` - Update timestamp on settings update
- `log_clinic_settings_insert` - Log setting creation
- `log_clinic_settings_update` - Log setting changes

### Appointment Triggers

#### Appointment Triggers
- `set_appointment_number_before_insert` - Generate appointment number
- `prevent_double_booking_before_insert` - Prevent double booking on insert
- `prevent_double_booking_before_update` - Prevent double booking on update
- `validate_doctor_availability_before_insert` - Validate doctor is active
- `calculate_appointment_duration_before_insert` - Calculate duration on insert
- `calculate_appointment_duration_before_update` - Calculate duration on update
- `update_appointment_status_before_insert` - Auto-update status on insert
- `update_appointment_status_before_update` - Auto-update status on update
- `update_appointments_updated_at` - Update timestamp on appointment update
- `log_appointment_insert` - Log appointment creation
- `log_appointment_update` - Log appointment changes
- `log_appointment_delete` - Log appointment deletion

#### Appointment Status Triggers
- `update_appointment_status_updated_at` - Update timestamp on status update

#### Medical Records Triggers
- `update_medical_records_updated_at` - Update timestamp on medical record update
- `log_medical_record_insert` - Log medical record creation
- `log_medical_record_update` - Log medical record changes

#### Prescriptions Triggers
- `update_prescriptions_updated_at` - Update timestamp on prescription update
- `log_prescription_insert` - Log prescription creation
- `log_prescription_update` - Log prescription changes

#### Prescription Medicines Triggers
- `update_prescription_medicines_updated_at` - Update timestamp on medicine update

### Billing Triggers

#### Invoice Triggers
- `set_invoice_number_before_insert` - Generate invoice number
- `calculate_invoice_total_before_insert` - Calculate total on insert
- `calculate_invoice_total_before_update` - Calculate total on update
- `update_invoice_payment_status` - Update status based on payments
- `update_invoices_updated_at` - Update timestamp on invoice更新
- `log_invoice_insert` - Log invoice creation
- `log_invoice_update` - Log invoice changes
- `log_invoice_delete` - Log invoice deletion

#### Invoice Items Triggers
- `update_invoice_items_updated_at` - Update timestamp on item update
- `recalculate_invoice_on_item_change` - Recalculate invoice when items change

#### Payment Triggers
- `mark_invoice_paid_after_payment` - Mark invoice paid on payment
- `update_payments_updated_at` - Update timestamp on payment update
- `log_payment_insert` - Log payment creation
- `log_payment_update` - Log payment changes

#### Expense Triggers
- `update_expenses_updated_at` - Update timestamp on expense update
- `log_expense_insert` - Log expense creation
- `log_expense_update` - Log expense changes

### Notification Triggers

#### Notification Triggers
- `update_notifications_updated_at` - Update timestamp on notification update

#### Automatic Notification Triggers
- `notify_on_appointment_created` - Notify on appointment creation
- `notify_on_appointment_updated` - Notify on appointment changes
- `notify_on_appointment_cancelled` - Notify on appointment cancellation
- `notify_on_invoice_created` - Notify on invoice generation
- `notify_on_payment_received` - Notify on payment received

#### File Attachments Triggers
- `update_file_attachments_updated_at` - Update timestamp on file update
- `log_file_attachment_insert` - Log file upload
- `log_file_attachment_delete` - Log file deletion

### Activity Log Triggers

#### Patient Triggers
- `update_patients_updated_at` - Update timestamp on patient update
- `log_patient_insert` - Log patient creation
- `log_patient_update` - Log patient changes
- `log_patient_delete` - Log patient deletion

#### Doctor Triggers
- `update_doctors_updated_at` - Update timestamp on doctor update
- `log_doctor_insert` - Log doctor creation
- `log_doctor_update` - Log doctor changes
- `log_doctor_delete` - Log doctor deletion

#### Subscription Triggers
- `update_subscription_plans_updated_at` - Update timestamp on plan update
- `update_clinic_subscriptions_updated_at` - Update timestamp on subscription update
- `log_clinic_subscription_insert` - Log subscription creation
- `log_clinic_subscription_update` - Log subscription changes

#### AI Features Triggers
- `update_ai_conversations_updated_at` - Update timestamp on conversation update
- `update_ai_reports_updated_at` - Update timestamp on report update
- `log_ai_conversation_insert` - Log conversation creation
- `log_ai_report_insert` - Log report creation

## Trigger Timing

### BEFORE Triggers
Execute before the operation and can modify the data:
- Data validation
- Default value generation
- Data transformation
- Prevent invalid operations

### AFTER Triggers
Execute after the operation and cannot modify the data:
- Activity logging
- Notification creation
- Cascading operations
- Audit trail

## Trigger Conditions

Triggers use `WHEN` clauses to conditionally execute:
```sql
WHEN (OLD IS DISTINCT FROM NEW)  -- Only when data changes
WHEN (OLD.status IS DISTINCT FROM NEW.status)  -- Only when specific field changes
WHEN (NEW.status = 'completed')  -- Only for specific values
```

## Common Trigger Patterns

### Timestamp Update
```sql
CREATE TRIGGER update_table_updated_at
    BEFORE UPDATE ON table_name
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Activity Logging
```sql
CREATE TRIGGER log_table_insert
    AFTER INSERT ON table_name
    FOR EACH ROW
    EXECUTE FUNCTION log_insert(
        NEW.clinic_id,
        NEW.created_by,
        'table_name',
        NEW.id,
        jsonb_build_object('details', NEW.field)
    );
```

### Conditional Logging
```sql
CREATE TRIGGER log_table_update
    AFTER UPDATE ON table_name
    FOR EACH ROW
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION log_update(...);
```

### Data Generation
```sql
CREATE TRIGGER set_field_before_insert
    BEFORE INSERT ON table_name
    FOR EACH ROW
    EXECUTE FUNCTION generate_field();
```

### Validation
```sql
CREATE TRIGGER validate_data_before_insert
    BEFORE INSERT ON table_name
    FOR EACH ROW
    EXECUTE FUNCTION validate_data();
```

## Security Considerations

### Trigger Execution
Triggers execute with the privileges of the trigger owner, not the user performing the operation. This is important for:
- Activity logging (can log even if user doesn't have direct access)
- Notification creation (can create notifications for all users)
- Data validation (enforce rules regardless of user permissions)

### RLS Interaction
Triggers execute after RLS policies. If a row is not visible due to RLS, the trigger may not fire. Consider this when designing triggers.

### Performance Impact
Triggers add overhead to DML operations. Minimize trigger logic and use efficient queries.

## Performance Considerations

### Trigger Optimization
- Keep trigger logic simple and fast
- Avoid complex queries in triggers
- Use indexes for trigger queries
- Minimize the number of triggers per table
- Use `WHEN` clauses to skip unnecessary executions

### Trigger Order
Multiple triggers on the same table execute in alphabetical order by name. Name triggers to control execution order:
```sql
-- 01_ prefix for first trigger
CREATE TRIGGER 01_validate_data_before_insert
-- 02_ prefix for second trigger
CREATE TRIGGER 02_generate_defaults_before_insert
```

### Bulk Operations
Triggers fire for each row in bulk operations. Consider using statement-level triggers for bulk operations if performance is critical.

## Testing Triggers

### Test Trigger Execution
```sql
-- Insert test data
INSERT INTO appointments (...) VALUES (...);

-- Check if trigger fired
SELECT * FROM activity_logs WHERE entity_type = 'appointments';

-- Check generated values
SELECT appointment_number FROM appointments WHERE id = 'test-id';
```

### Test Trigger Conditions
```sql
-- Update without changing data (should not fire)
UPDATE appointments SET scheduled_date = scheduled_date WHERE id = 'test-id';

-- Update with data change (should fire)
UPDATE appointments SET scheduled_date = CURRENT_DATE WHERE id = 'test-id';
```

### Test Validation Triggers
```sql
-- Test double booking prevention
INSERT INTO appointments (...) VALUES (...); -- Should succeed
INSERT INTO appointments (...) VALUES (...); -- Should fail with same doctor/time
```

## Troubleshooting

### Trigger Not Firing
1. Check if trigger is enabled: `\d table_name`
2. Verify trigger function exists
3. Check trigger timing (BEFORE/AFTER)
4. Validate trigger conditions
5. Check for errors in trigger function

### Trigger Errors
1. Check trigger function for syntax errors
2. Verify function parameters match trigger expectations
3. Check for missing dependencies (functions, tables)
4. Review error messages in PostgreSQL logs

### Performance Issues
1. Profile slow triggers using `EXPLAIN ANALYZE`
2. Add missing indexes
3. Simplify trigger logic
4. Consider using statement-level triggers
5. Move complex logic to application layer

### Recursive Triggers
PostgreSQL prevents recursive triggers by default. If you need recursive triggers, set:
```sql
SET session_replication_role = 'replica';
```

## Best Practices

1. **Keep triggers simple** - Complex logic belongs in functions, not triggers
2. **Use descriptive names** - Name triggers to indicate purpose and timing
3. **Document triggers** - Add comments explaining trigger purpose
4. **Test thoroughly** - Test triggers with various scenarios
5. **Monitor performance** - Track trigger execution time
6. **Use WHEN clauses** - Skip unnecessary trigger executions
7. **Avoid side effects** - Triggers should be predictable
8. **Handle errors gracefully** - Use exceptions with meaningful messages
9. **Consider transaction impact** - Triggers run in the same transaction
10. **Review trigger order** - Ensure triggers execute in correct sequence

## Maintenance

### Adding New Triggers
1. Add to appropriate trigger file
2. Follow existing naming conventions
3. Add documentation to README
4. Test thoroughly
5. Consider impact on existing triggers

### Modifying Existing Triggers
1. Review impact on dependent code
2. Test with various scenarios
3. Update documentation
4. Consider backward compatibility
5. Communicate changes to team

### Disabling Triggers
```sql
-- Disable a specific trigger
ALTER TABLE table_name DISABLE TRIGGER trigger_name;

-- Disable all triggers on a table
ALTER TABLE table_name DISABLE TRIGGER ALL;

-- Re-enable a trigger
ALTER TABLE table_name ENABLE TRIGGER trigger_name;
```

### Removing Triggers
```sql
-- Drop a specific trigger
DROP TRIGGER trigger_name ON table_name;

-- Drop all triggers on a table
DROP TRIGGER ALL ON table_name;
```

## Monitoring

### View All Triggers
```sql
-- View triggers on a specific table
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'table_name';

-- View all triggers in database
SELECT * FROM information_schema.triggers;
```

### Monitor Trigger Performance
```sql
-- Enable statement timing
\timing on

-- Execute operation with trigger
INSERT INTO table_name (...) VALUES (...);

-- Check execution time
```

### Audit Trail
All important operations are logged to `activity_logs`:
```sql
-- View recent activity
SELECT * FROM activity_logs 
ORDER BY created_at DESC 
LIMIT 100;

-- View activity for specific entity
SELECT * FROM activity_logs 
WHERE entity_type = 'appointments' 
AND entity_id = 'appointment-uuid';
```

## References

- [PostgreSQL Triggers Documentation](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [PostgreSQL Trigger Functions](https://www.postabase.com/docs/guides/database/triggers)
- [Supabase Triggers Guide](https://supabase.com/docs/guides/database/triggers)
