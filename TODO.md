# Profile Setup Fix TODO

## Approved Plan Steps (Proceeding to Fix Profile Making Error)

### 1. [IN PROGRESS] DB Verification (Completed)
- ✅ Ran verify_rls_policies.mjs → RLS mostly OK, but signup simulation fails
- ✅ Ran comprehensive_supabase_check.mjs → All tables exist, connected
- Tables present: users, teacher_profiles, parent_profiles, child_profile, etc.
- Issue: TEST 5 signup simulation fails: 'Database error saving new user'

### 2. [PENDING] Apply RLS Migration Fix
- Read FIX_RLS_POLICIES.sql
- Execute manual SQL in Supabase dashboard OR create apply_fix.sh
- Re-run verify_rls_policies.mjs → Confirm TEST 5 passes

### 3. [PENDING] Fix ProfileSetup.tsx for Role-Aware Setup
- Use useAuth() to get user/role
- Parents: Create child_profile + child_enrollments
- Teachers: Create demo child or list enrollments
- Update schema to UUID

### 4. [PENDING] Test Full Flow
- Signup teacher → Login → ProfileSetup (no error)
- Signup parent → Login → ProfileSetup → Create child
- Verify DB entries linked

### 5. [PENDING] Completion
- attempt_completion

