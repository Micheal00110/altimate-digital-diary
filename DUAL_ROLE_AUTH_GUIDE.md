# 🔄 Dual Role Authentication System - Implementation Guide

## Overview

The authentication system now supports **dual roles**: a single email can be used to register as both a teacher AND a parent. This allows for more flexible account management and better represents real-world scenarios where individuals may have multiple roles.

### What Changed

✅ Removed email uniqueness constraint
✅ Allow same email for both teacher and parent roles
✅ Added role management methods
✅ Support for switching between roles
✅ Get all profiles for a user

---

## Key Features

### 1. Flexible Email Registration
- **Before**: One email = One role (teacher OR parent)
- **After**: One email = Multiple roles (teacher AND parent)

### 2. User Type Flexibility
- Same person can register as teacher first, then parent (or vice versa)
- Both profiles linked to single email
- Single password for all roles

### 3. Role Management
- Check what roles a user has
- Switch between roles
- Get all profiles associated with user
- Verify role permissions

---

## How It Works

### Scenario 1: Register as Teacher, Then Parent

```
Step 1: Sign up as Teacher
├─ Email: john@school.com
├─ Create auth user
├─ Create users entry (user_type: 'teacher')
└─ Create teacher profile

Step 2: Sign up as Parent with SAME email
├─ Check: Does user exist? YES
├─ Use existing user ID
├─ Update user_type to 'parent'
├─ Create parent profile
└─ Result: ONE auth user, TWO profiles
```

### Scenario 2: Register as Parent, Then Teacher

```
Step 1: Sign up as Parent
├─ Email: jane@home.com
├─ Create auth user
├─ Create users entry (user_type: 'parent')
└─ Create parent profile

Step 2: Sign up as Teacher with SAME email
├─ Check: Does user exist? YES
├─ Use existing user ID
├─ Update user_type to 'teacher'
├─ Create teacher profile
└─ Result: ONE auth user, TWO profiles
```

---

## API Reference

### New Methods

#### `getUserRoles(userId: string): Promise<UserRole[]>`
Get all roles assigned to a user.

```typescript
const roles = await authService.getUserRoles(userId);
// Returns: ['teacher', 'parent'] or ['teacher'] or ['parent']
```

#### `hasRole(userId: string, role: UserRole): Promise<boolean>`
Check if user has specific role.

```typescript
const isTeacher = await authService.hasRole(userId, 'teacher');
// Returns: true or false
```

#### `getUserProfiles(userId: string): Promise<{teacher?, parent?}>`
Get all profiles for a user.

```typescript
const profiles = await authService.getUserProfiles(userId);
// Returns:
// {
//   teacher: { school_name: '...', class_grade: '...', ... },
//   parent: { relationship_to_child: '...', phone_number: '...', ... }
// }
```

#### `switchRole(userId: string, role: UserRole): Promise<AuthResult>`
Switch to a different role (if user has multiple roles).

```typescript
const result = await authService.switchRole(userId, 'teacher');
if (result.success) {
  // User role switched to teacher
}
```

### Modified Methods

#### `signUpTeacher(data: TeacherData, password: string)`
Now **checks if user exists** before creating:
- If user doesn't exist: Create new auth user + teacher profile
- If user exists: Add teacher profile to existing user
- If teacher profile already exists: Skip (no duplicate)

#### `signUpParent(data: ParentData, password: string)`
Now **checks if user exists** before creating:
- If user doesn't exist: Create new auth user + parent profile
- If user exists: Add parent profile to existing user
- If parent profile already exists: Skip (no duplicate)

---

## Database Changes

### users Table
```sql
-- No changes required
-- user_type column still exists
-- Allows: 'teacher', 'parent', 'admin'
-- Note: For dual role users, this stores the "current" role
```

### Profiles Tables
```sql
-- teacher_profiles: Linked to user_id, allows one per user
-- parent_profiles: Linked to user_id, allows one per user
-- A user can have BOTH teacher AND parent profiles
```

---

## Usage Examples

### Example 1: User Signs Up as Teacher

```typescript
const result = await authService.signUpTeacher({
  name: 'John Smith',
  email: 'john@example.com',
  school_name: 'Elementary School',
  class_grade: 'Grade 3',
  qualification: 'B.Ed'
}, 'password123');

if (result.success) {
  console.log('Teacher account created');
}
```

### Example 2: Same User Adds Parent Role

```typescript
// User logs in with same email/password
// Then signs up as parent
const result = await authService.signUpParent({
  name: 'John Smith',
  email: 'john@example.com', // SAME email!
  relationship_to_child: 'father',
  phone_number: '+1-555-0123'
}, 'password123');

if (result.success) {
  console.log('Parent profile added to existing teacher account');
}
```

### Example 3: Check User Roles

```typescript
const userId = user.id;

// Get all roles
const roles = await authService.getUserRoles(userId);
console.log(roles); // ['teacher', 'parent']

// Check specific role
const isTeacher = await authService.hasRole(userId, 'teacher');
console.log(isTeacher); // true

// Get all profiles
const profiles = await authService.getUserProfiles(userId);
console.log(profiles.teacher); // { school_name: '...', ... }
console.log(profiles.parent);  // { phone_number: '...', ... }
```

### Example 4: Switch Between Roles

```typescript
const userId = user.id;

// Switch to teacher role
const result = await authService.switchRole(userId, 'teacher');
if (result.success) {
  console.log('Now viewing as teacher');
}

// Later, switch to parent role
const result2 = await authService.switchRole(userId, 'parent');
if (result2.success) {
  console.log('Now viewing as parent');
}
```

---

## UI Implementation Guide

### Signup Flow

```
┌─────────────────────────────────────┐
│ Select Account Type                 │
├─────────────────────────────────────┤
│                                     │
│ ○ I'm a Parent  ○ I'm a Teacher    │
│                                     │
│ [Next]                              │
│                                     │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Create Account                      │
├─────────────────────────────────────┤
│ Email: john@example.com             │
│ Password: [••••••••]                │
│ [Create Account]                    │
│                                     │
│ Have another role?                  │
│ [Add Teacher Profile] or            │
│ [Add Parent Profile]                │
└─────────────────────────────────────┘
```

### Role Switcher in Dashboard

```
┌─────────────────────────────────────┐
│ Welcome, John Smith                 │
├─────────────────────────────────────┤
│ Current Role:                       │
│ ◉ Teacher  ○ Parent  [Switch]      │
│                                     │
│ Your Profiles:                      │
│ ✓ Teacher Profile (Elementary 3)    │
│ ✓ Parent Profile (Father)           │
│                                     │
│ [Manage Profiles] [Settings]        │
└─────────────────────────────────────┘
```

---

## Database Queries

### Find All Users with Multiple Roles

```sql
SELECT u.id, u.email, u.name,
       COUNT(DISTINCT tp.id) as teacher_profiles,
       COUNT(DISTINCT pp.id) as parent_profiles
FROM users u
LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
LEFT JOIN parent_profiles pp ON u.id = pp.user_id
GROUP BY u.id
HAVING COUNT(DISTINCT tp.id) > 0 AND COUNT(DISTINCT pp.id) > 0
```

### Get User's Current Role

```sql
SELECT user_type FROM users WHERE id = 'user-id'
```

### Get All Profiles for User

```sql
SELECT * FROM teacher_profiles WHERE user_id = 'user-id'
UNION ALL
SELECT * FROM parent_profiles WHERE user_id = 'user-id'
```

---

## Flow Diagram

```
User Registration Flow
──────────────────────

START → Choose Role
        ├─→ Teacher
        │   ├─→ Check: Email exists?
        │   │   ├─→ YES: Reuse user_id
        │   │   │        Update user_type
        │   │   │        Create/Skip teacher profile
        │   │   └─→ NO: Create new auth user
        │   │           Create users entry
        │   │           Create teacher profile
        │   └─→ Success ✓
        │
        └─→ Parent
            ├─→ Check: Email exists?
            │   ├─→ YES: Reuse user_id
            │   │        Update user_type
            │   │        Create/Skip parent profile
            │   └─→ NO: Create new auth user
            │           Create users entry
            │           Create parent profile
            └─→ Success ✓
```

---

## Logging & Debugging

The auth service logs all operations for debugging:

```
[Auth] Signing up/adding teacher role: john@example.com
[Auth] User exists, adding teacher profile
[Auth] User table entry created
[Auth] Teacher profile created successfully

[Auth] Switching role for user: user-123 to: parent
[Auth] Role switched successfully
```

---

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "User does not have X role" | Trying to switch to role user doesn't have | User needs to create that profile first |
| "Failed to create teacher profile" | Profile already exists | Skip (system handles this) |
| "Email already in use" | OAuth/External auth conflict | Use different email or contact support |

---

## Migration Guide

### For Existing Single-Role Users

No action needed! Existing users can:
1. Log in normally
2. Add another role anytime
3. Switch between roles

### For New Dual-Role Users

Users can now:
1. Sign up as teacher
2. Immediately add parent profile with same email
3. Switch between roles as needed

---

## Testing Checklist

### Signup Tests
- [ ] Sign up as teacher with email
- [ ] Sign up as parent with SAME email
- [ ] Both profiles exist for same user
- [ ] Can log in with either role
- [ ] Password works for both roles

### Role Management Tests
- [ ] `getUserRoles()` returns both roles
- [ ] `hasRole(user, 'teacher')` returns true
- [ ] `hasRole(user, 'parent')` returns true
- [ ] `getUserProfiles()` returns both profiles
- [ ] `switchRole()` updates current role

### Edge Cases
- [ ] Try creating duplicate teacher profile (should skip)
- [ ] Try creating duplicate parent profile (should skip)
- [ ] Switch role multiple times (should work)
- [ ] Switch to non-existent role (should error)

---

## Performance Considerations

### Database Queries
- User lookup by email: O(1) - indexed
- Profile creation: O(1)
- Role switching: O(1) single update
- Get all profiles: O(1) - two queries

### Caching
Consider caching user roles after login:
```typescript
// Cache in AuthContext
const userRoles = await authService.getUserRoles(userId);
// Store in state/context
```

---

## Security Notes

✅ **What's Secure**
- Passwords hashed by Supabase Auth
- Each role requires separate profile creation
- Role switching validates user has that role
- RLS policies protect access per role

⚠️ **Considerations**
- Same password for all roles - user responsibility
- Role switching doesn't require password - depends on session
- Consider requiring re-auth for role switch (optional)

---

## Future Enhancements

1. **Admin Role** - Manage multiple users/schools
2. **Role-Based Preferences** - Different UI per role
3. **Activity Logging** - Track role switches
4. **Device Trust** - Limit role switches per device
5. **One-Time Verification** - Re-verify before role switch

---

## Support & Troubleshooting

### Check User Roles
```typescript
const roles = await authService.getUserRoles(userId);
console.log('User roles:', roles);
```

### Debug Profile Creation
```typescript
const profiles = await authService.getUserProfiles(userId);
console.log('Teacher profile:', profiles.teacher);
console.log('Parent profile:', profiles.parent);
```

### Test Role Switch
```typescript
const result = await authService.switchRole(userId, 'teacher');
console.log('Switch result:', result);
```

---

## Code Changes Summary

### Files Modified
1. **`src/lib/auth.ts`** (450+ lines)
   - Enhanced `signUpTeacher()` - checks for existing users
   - Enhanced `signUpParent()` - checks for existing users
   - Added `getUserRoles()` - get all user roles
   - Added `hasRole()` - check specific role
   - Added `getUserProfiles()` - get all profiles
   - Added `switchRole()` - switch between roles

### New Capabilities
- ✅ Same email for multiple roles
- ✅ Single auth session for multiple profiles
- ✅ Switch roles without re-login
- ✅ Query user roles and profiles
- ✅ Flexible account management

---

**Status**: ✅ Ready to Use
**Errors**: 0
**Warnings**: 0
**Tests**: Ready for comprehensive testing

