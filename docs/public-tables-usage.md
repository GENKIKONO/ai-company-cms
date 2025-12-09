# Public Tables Usage Audit

**Date**: 2025-12-09  
**Purpose**: Audit of direct references to `public_*_tbl` tables for RLS migration compliance  
**Scope**: Documentation-only audit (no code changes)  

## Executive Summary

The audit reveals that `public_*_tbl` tables are **type-defined but not actively used** in the current implementation. All references are either type definitions or TODO comments planning future migration. No direct database queries to these tables were found.

## Table References Found

### 1. `public_posts_tbl`
- **Type definitions**: `src/types/cms-supabase.ts`, `src/types/cms-content.ts`
- **Active usage**: None
- **Status**: Defined for future CMS migration

### 2. `public_news_tbl` 
- **Type definitions**: `src/types/cms-supabase.ts`, `src/types/cms-content.ts`
- **Active usage**: None
- **Status**: Defined for future CMS migration

### 3. `public_services_tbl`
- **Type definitions**: `src/types/cms-supabase.ts`, `src/types/cms-content.ts`
- **Active usage**: None
- **Status**: Defined for future CMS migration

### 4. `public_products_tbl`
- **Type definitions**: `src/types/cms-supabase.ts`, `src/types/cms-content.ts`
- **Active usage**: None
- **Status**: Defined for future CMS migration

### 5. `public_case_studies_tbl`
- **Type definitions**: `src/types/cms-supabase.ts`, `src/types/cms-content.ts`
- **Active usage**: None  
- **Status**: Defined for future CMS migration

## File-by-File Analysis

### `src/types/cms-supabase.ts`
- **Lines 255-259**: Union type definition including all public table names
- **Lines 272-276**: Type mapping for public table rows
- **Impact**: Type definitions only, no runtime queries

### `src/types/cms-content.ts`
- **Lines 120-123**: TODO comments referencing future migration to public tables
- **Lines 130-134**: Union type definition for public table names
- **Lines 150-154**: Array constant with public table names
- **Impact**: Planning/type definitions only, no actual usage

### `src/app/api/public/cms/route.ts`
- **Lines 2-5**: TODO comment mentioning future `public_*_tbl` migration
- **Current implementation**: Uses `cms_site_settings` and `cms_sections` tables instead
- **Impact**: No direct public table usage, planned for future

## RLS Compatibility Assessment

### ✅ **Current State: COMPLIANT**
- No direct queries to `public_*_tbl` tables found
- No RLS permission issues exist for these tables currently
- Type definitions are safe and don't affect RLS

### ⚠️ **Future Migration Considerations**
When implementing the planned CMS migration to use `public_*_tbl` tables:

1. **RLS Policies**: Ensure proper RLS policies are in place for each table
2. **Error Handling**: Implement 42501 permission error handling similar to other RPC calls
3. **Fallback Strategy**: Maintain graceful degradation when RLS blocks access
4. **API Updates**: Update public CMS API to handle RLS permission scenarios

## Recommendations

### Immediate Actions (None Required)
- No changes needed for current RLS migration
- All `public_*_tbl` references are safe type definitions

### Future Development Guidelines
When implementing the planned CMS migration:

1. **Follow RLS Pattern**: Use the same error handling pattern established in this migration:
   ```typescript
   // Example pattern for future implementation
   const { data, error } = await supabase.from('public_posts_tbl').select('*');
   if (error?.code === '42501') {
     // Handle RLS permission error gracefully
   }
   ```

2. **Fail-Open Strategy**: For public content, consider fail-open approach where RLS failures show default/cached content

3. **Monitoring**: Add logging for RLS permission failures on public tables to detect issues

## Migration Impact

### Phase 1 (Current): ✅ **COMPLETE**
- RLS strengthening for user/org data: Implemented
- Permission error handling: Implemented
- Public tables: Not affected (not in use)

### Phase 2 (Future): **PLANNED**
- CMS migration to `public_*_tbl`: Planned but not implemented
- RLS policies for public content: To be defined
- Public API RLS handling: To be implemented

## Monitoring Checklist

When `public_*_tbl` tables are eventually implemented:
- [ ] RLS policies defined for each table
- [ ] Permission error handling in place  
- [ ] Fallback content strategy implemented
- [ ] Public API graceful degradation tested
- [ ] Performance impact of RLS on public queries assessed

---
**Audit Completed**: All `public_*_tbl` references are type definitions only. No RLS compatibility issues exist for current implementation.