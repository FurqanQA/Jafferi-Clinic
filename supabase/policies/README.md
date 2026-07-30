# Jafferi Clinic - Row Level Security (RLS) Policies

This directory contains production-ready Row Level Security (RLS) policies for the Jafferi Clinic multi-tenant SaaS application.

## Overview

RLS policies ensure strict tenant isolation and role-based access control (RBAC) across all database tables. Every authenticated user can only access data belonging to their clinic, with additional restrictions based on their assigned role.

## Security Principles

### Tenant Isolation
- Every policy enforces `clinic_id` matching the user's clinic
- No user can access data from another clinic
- Prevents cross-tenant data leakage

### Role-Based Access Control (RBAC)
- **Owner**: Full access to all clinic data, including user management and billing
- **Administrator**: Almost full access, cannot modify subscription or ownership
- **Doctor**: Can view patients, manage appointments, create medical records and prescriptions
- **Receptionist**: Can manage appointments and patients, cannot access financial reports
- **Accountant**: Can manage invoices, payments, expenses, and reports
- **Staff**: Limited access according to assigned permissions

### HIPAA Compliance
- Medical records and prescriptions have strict access control
- Only doctors can create/update medical records
- Activity logs provide immutable audit trail
- Only owners/administrators can access audit logs

## Policy Files

| File | Tables | Description |
|------|--------|-------------|
| `roles.sql` | `roles` | Global role definitions (public read) |
| `clinics.sql` | `clinics` | Tenant definitions |
| `profiles.sql` | `profiles` | User profiles |
| `user_roles.sql` | `user_roles` | Role assignments |
| `doctors.sql` | `doctors` | Doctor profiles |
| `patients.sql` | `patients` | Patient records |
| `appointments.sql` | `appointments` | Appointment scheduling |
| `medical_records.sql` | `medical_records` | Medical visit records (HIPAA) |
| `prescriptions.sql` | `prescriptions` | Prescription records (HIPAA) |
| `invoices.sql` | `invoices` | Patient invoices |
| `payments.sql` | `payments` | Payment tracking |
| `expenses.sql` | `expenses` | Clinic expenses |
| `notifications.sql` | `notifications` | User notifications |
| `clinic_settings.sql` | `clinic_settings` | Clinic configuration |
| `activity_logs.sql` | `activity_logs` | Audit trail |
| `file_attachments.sql` | `file_attachments` | File storage |
| `subscriptions.sql` | `subscription_plans`, `clinic_subscriptions` | Subscription management |
| `ai.sql` | `ai_conversations`, `ai_reports` | AI features |

## Execution Order

Policies should be applied in the following order:

1. `roles.sql` - Foundation for RBAC
2. `clinics.sql` - Tenant definitions
3. `profiles.sql` - User profiles
4. `user_roles.sql` - Role assignments
5. `doctors.sql` - Doctor profiles
6. `patients.sql` - Patient records
7. `appointments.sql` - Appointments
8. `medical_records.sql` - Medical records
9. `prescriptions.sql` - Prescriptions
10. `invoices.sql` - Invoices
11. `payments.sql` - Payments
12. `expenses.sql` - Expenses
13. `notifications.sql` - Notifications
14. `clinic_settings.sql` - Settings
15. `activity_logs.sql` - Audit logs
16. `file_attachments.sql` - File attachments
17. `subscriptions.sql` - Subscriptions
18. `ai.sql` - AI features

## Applying Policies

### Apply All Policies
```bash
# From the supabase directory
psql -h localhost -U postgres -d jafferi_clinic -f policies/roles.sql
psql -h localhost -U postgres -d jafferi_clinic -f policies/clinics.sql
# ... continue for all files
```

### Or use the master policy file (if created):
```bash
psql -h localhost -U postgres -d jafferi_clinic -f policies/00_master.sql
```

## Policy Structure

Each policy file follows this structure:

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- SELECT Policies
CREATE POLICY "policy_name"
    ON table_name
    FOR SELECT
    TO authenticated
    USING (condition);

-- INSERT Policies
CREATE POLICY "policy_name"
    ON table_name
    FOR INSERT
    TO authenticated
    WITH CHECK (condition);

-- UPDATE Policies
CREATE POLICY "policy_name"
    ON table_name
    FOR UPDATE
    TO authenticated
    USING (condition)
    WITH CHECK (condition);

-- DELETE Policies
CREATE POLICY "policy_name"
    ON table_name
    FOR DELETE
    TO authenticated
    USING (condition);
```

## Common Policy Patterns

### Clinic Isolation
```sql
clinic_id IN (
    SELECT clinic_id 
    FROM profiles 
    WHERE profiles.id = auth.uid()
)
```

### Role Check
```sql
EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.clinic_id = table_name.clinic_id
    AND user_roles.is_active = true
    AND user_roles.role_id IN (
        SELECT id FROM roles WHERE name IN ('owner', 'administrator')
    )
)
```

### Self-Access
```sql
user_id = auth.uid()
```

### Field Protection
```sql
clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM table_name WHERE table_name.id = id)
```

## Special Cases

### Public Tables
- `subscription_plans` - Public read access for pricing display
- `roles` - Public read access for UI dropdowns
- `appointment_status` - Public read access for status reference

### Service Role
- `activity_logs` - Only service role can insert (via triggers)
- `subscription_plans` - Only service role can manage
- `clinic_subscriptions` - Only service role can manage billing

### Immutable Audit Trail
- `activity_logs` - No UPDATE policy allowed
- Logs are inserted automatically via triggers/functions

### HIPAA-Protected Tables
- `medical_records` - Only doctors can create/update
- `prescriptions` - Only doctors can create/update
- Strict access control with owner/admin emergency override

## Performance Considerations

### Indexes
Ensure the following indexes exist for optimal policy performance:

```sql
-- On profiles
CREATE INDEX idx_profiles_clinic_id ON profiles(clinic_id);
CREATE INDEX idx_profiles_id ON profiles(id);

-- On user_roles
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_clinic_id ON user_roles(clinic_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_is_active ON user_roles(is_active);

-- On roles
CREATE INDEX idx_roles_name ON roles(name);
```

### Policy Optimization
- Policies use `EXISTS` subqueries for role checks
- Avoid correlated subqueries where possible
- Use `IS NOT DISTINCT FROM` for null-safe comparisons
- Clinic isolation check is cached for the session

## Testing Policies

### Test Tenant Isolation
```sql
-- As user from clinic A
SELECT * FROM clinics; -- Should only return clinic A
SELECT * FROM patients; -- Should only return patients from clinic A
```

### Test Role-Based Access
```sql
-- As doctor
INSERT INTO medical_records (...) VALUES (...); -- Should succeed
UPDATE patients SET medical_history = '...' WHERE id = '...'; -- Should succeed

-- As receptionist
UPDATE patients SET medical_history = '...' WHERE id = '...'; -- Should fail
UPDATE patients SET phone = '...' WHERE id = '...'; -- Should succeed
```

## Troubleshooting

### Policy Not Working
1. Check if RLS is enabled: `SELECT * FROM pg_policies WHERE tablename = 'table_name';`
2. Verify user has a profile with `clinic_id`
3. Verify user has active role assignment
4. Check policy conditions match expected data

### Performance Issues
1. Add missing indexes on foreign key columns
2. Review policy complexity
3. Consider using security definer functions for complex logic

### Access Denied Errors
1. Verify user is authenticated: `SELECT auth.uid();`
2. Check user's clinic assignment
3. Check user's role assignments
4. Review specific policy conditions

## Security Best Practices

1. **Never rely on client input** - Always use `auth.uid()` for user identification
2. **Use service role for system operations** - Billing, subscription management
3. **Audit all sensitive operations** - Activity logs track all changes
4. **Implement rate limiting** - At application layer
5. **Regular security audits** - Review policies quarterly
6. **HIPAA compliance** - Medical data requires strict access control

## Maintenance

### Adding New Policies
1. Create new policy file in `policies/` directory
2. Follow existing naming conventions
3. Add to execution order in README
4. Test thoroughly before deployment

### Modifying Existing Policies
1. Review impact on all roles
2. Test with each role type
3. Ensure tenant isolation is maintained
4. Update documentation

### Removing Policies
1. Check for dependencies
2. Remove from execution order
3. Update documentation
4. Communicate changes to team

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html)
