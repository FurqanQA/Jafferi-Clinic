# Jafferi Clinic - Seed Data

This directory contains production-ready development seed data for the Jafferi Clinic multi-tenant healthcare SaaS application.

## Overview

The seed data provides realistic demo data for comprehensive testing of the application's features, including multi-tenancy and role permissions. All seed files use `ON CONFLICT DO NOTHING` to prevent duplicate records, allowing safe re-running.

## Execution Order

Seed files must be executed in the following order to maintain referential integrity:

1. **clinics.sql** - Base data (clinics, subscription plans, clinic subscriptions)
2. **users.sql** - User profiles and role assignments (depends on clinics)
3. **doctors.sql** - Doctor profiles (depends on users and clinics)
4. **patients.sql** - Patient records (depends on clinics)
5. **appointments.sql** - Appointments (depends on patients, doctors, clinics)
6. **medical_records.sql** - Medical records (depends on appointments, patients, doctors)
7. **prescriptions.sql** - Prescriptions and prescription items (depends on medical records)
8. **invoices.sql** - Invoices and invoice items (depends on appointments, patients)
9. **payments.sql** - Payment records (depends on invoices)
10. **notifications.sql** - User notifications (depends on users)
11. **settings.sql** - Clinic settings (depends on clinics)

## Quick Start

### Run All Seeds

Execute the master seed file to populate all data:

```bash
psql -h localhost -U postgres -d jafferi_clinic -f supabase/seeds/seed.sql
```

Or using Supabase CLI:

```bash
supabase db reset
supabase db reset --seed
```

### Run Individual Seed Files

Execute specific seed files individually:

```bash
psql -h localhost -U postgres -d jafferi_clinic -f supabase/seeds/clinics.sql
psql -h localhost -U postgres -d jafferi_clinic -f supabase/seeds/users.sql
# ... etc
```

## Data Counts

| Entity | Total Records | Per Clinic |
|--------|---------------|-------------|
| Clinics | 5 | 1 |
| Subscription Plans | 5 | - |
| Clinic Subscriptions | 5 | 1 |
| Roles | 6 | - |
| Users | 50 | 10 |
| Doctors | 15 | 3 |
| Patients | 200 | 40 |
| Appointments | 500 | 100 |
| Medical Records | 300 | 60 |
| Prescriptions | 250 | 50 |
| Prescription Items | ~300 | ~60 |
| Invoices | 300 | 60 |
| Invoice Items | 300 | 60 |
| Payments | 250 | 50 |
| Notifications | 200 | 40 |
| Clinic Settings | 175 | 35 |

**Total Records: ~2,500**

## Clinic Distribution

### Clinic 1: Jafferi Dental Clinic
- Location: New York, NY
- Type: Dental Clinic
- Users: 10 (1 owner, 1 admin, 2 receptionists, 3 doctors, 1 accountant, 2 staff)
- Doctors: 3 (General Dentistry, Orthodontics, Pediatric Dentistry)

### Clinic 2: Smile Care Center
- Location: Los Angeles, CA
- Type: Dental Clinic
- Users: 10 (1 owner, 1 admin, 2 receptionists, 3 doctors, 1 accountant, 2 staff)
- Doctors: 3 (General Dentistry, Pediatric Dentistry, Cosmetic Dentistry)

### Clinic 3: City Medical Clinic
- Location: Denver, CO
- Type: General Medical Clinic
- Users: 10 (1 owner, 1 admin, 2 receptionists, 3 doctors, 1 accountant, 2 staff)
- Doctors: 3 (Cardiology, Dermatology, General Practice)

### Clinic 4: Family Health Clinic
- Location: Austin, TX
- Type: Family Medicine
- Users: 10 (1 owner, 1 admin, 2 receptionists, 3 doctors, 1 accountant, 2 staff)
- Doctors: 3 (Family Medicine, Pediatrics, Neurology)

### Clinic 5: Prime Care Hospital
- Location: Seattle, WA
- Type: Hospital
- Users: 10 (1 owner, 1 admin, 2 receptionists, 3 doctors, 1 accountant, 2 staff)
- Doctors: 3 (Orthopedics, ENT, General Surgery)

## Appointment Status Distribution

Each clinic has appointments with the following statuses:
- **completed**: Past appointments that were finished
- **scheduled**: Future appointments
- **confirmed**: Upcoming appointments with confirmed status
- **checked_in**: Patients who have arrived
- **cancelled**: Cancelled appointments
- **no_show**: Patients who missed their appointment

## Invoice Status Distribution

Each clinic has invoices with the following statuses:
- **paid**: Fully paid invoices
- **pending**: Awaiting payment
- **partially_paid**: Partial payment received
- **overdue**: Past due date
- **cancelled**: Cancelled invoices

## Notification Types

Notifications include:
- **appointment**: Appointment confirmations, reminders, cancellations
- **invoice**: Invoice generation, reminders, overdue notices
- **payment**: Payment receipts, failures, refunds
- **system**: Welcome messages, profile updates, password changes

## Reset Instructions

### Full Database Reset

To completely reset the database and re-seed:

```bash
# Using Supabase CLI
supabase db reset

# Or manually
psql -h localhost -U postgres -d jafferi_clinic
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then run migrations and seeds
```

### Re-run Seeds Only

To re-run seeds without dropping the database (safe for development):

```bash
psql -h localhost -U postgres -d jafferi_clinic -f supabase/seeds/seed.sql
```

The `ON CONFLICT DO NOTHING` clauses ensure that existing records are not duplicated.

## Development Usage

### Testing Multi-Tenancy

The seed data is designed to test multi-tenant isolation:

```sql
-- Verify clinic isolation
SELECT clinic_id, COUNT(*) FROM patients GROUP BY clinic_id;
SELECT clinic_id, COUNT(*) FROM appointments GROUP BY clinic_id;
SELECT clinic_id, COUNT(*) FROM invoices GROUP BY clinic_id;
```

### Testing Role Permissions

Each clinic has users with different roles to test RBAC:

- **Owner**: Full access to all clinic data
- **Administrator**: Full access except owner-specific functions
- **Receptionist**: Access to appointments, patients, basic billing
- **Doctor**: Access to appointments, medical records, prescriptions
- **Accountant**: Access to invoices, payments, financial reports
- **Staff**: Limited access based on assigned permissions

### Testing Appointment Workflow

The seed data includes a complete appointment workflow:

1. Schedule appointment (scheduled status)
2. Patient arrives (checked_in status)
3. Appointment completed (completed status)
4. Medical record created
5. Prescription issued (if needed)
6. Invoice generated
7. Payment processed

### Testing Billing Workflow

The seed data includes a complete billing workflow:

1. Invoice generated after appointment
2. Invoice items added (services, taxes, discounts)
3. Payment received (various methods: card, cash, bank transfer, online)
4. Invoice status updated (paid, partially_paid, pending, overdue)

## Customization

### Adding More Data

To add more seed data, follow these patterns:

1. **Generate new UUIDs** for each record
2. **Maintain referential integrity** by linking to existing records
3. **Use realistic data** for names, emails, phone numbers, addresses
4. **Include ON CONFLICT DO NOTHING** to prevent duplicates

### Modifying Existing Data

To modify seed data:

1. Edit the specific seed file
2. Update the records as needed
3. Re-run the seed file
4. The `ON CONFLICT DO NOTHING` will prevent duplicates, so you may need to manually delete existing records first

## Troubleshooting

### Duplicate Key Errors

If you encounter duplicate key errors, the `ON CONFLICT DO NOTHING` clause should handle this. If errors persist:

```sql
-- Check for existing records
SELECT COUNT(*) FROM clinics;
SELECT COUNT(*) FROM users;
-- etc.
```

### Foreign Key Violations

If you encounter foreign key violations:

1. Ensure you're executing files in the correct order
2. Verify that referenced records exist
3. Check UUIDs match between related tables

### Missing Data

If data appears missing:

1. Verify the seed file executed successfully
2. Check for any error messages during execution
3. Confirm the table exists and has the correct structure

## File Structure

```
supabase/seeds/
├── seed.sql              # Master seed file (executes all seeds)
├── clinics.sql            # Clinic, subscription plans, subscriptions
├── users.sql              # User profiles and role assignments
├── doctors.sql            # Doctor profiles
├── patients.sql            # Patient records
├── appointments.sql        # Appointments
├── medical_records.sql    # Medical records
├── prescriptions.sql      # Prescriptions and items
├── invoices.sql           # Invoices and items
├── payments.sql           # Payment records
├── notifications.sql      # User notifications
├── settings.sql           # Clinic settings
└── README.md              # This file
```

## Notes

- All UUIDs are generated using a consistent pattern for easy identification
- Dates are relative to `NOW()` to keep data current
- All monetary values are in USD
- Phone numbers follow US format
- Addresses are realistic but fictional
- Email addresses use a consistent pattern for easy identification
- The seed data is designed for development and testing only, not production use

## Support

For issues or questions about the seed data, refer to the main project documentation or contact the development team.
