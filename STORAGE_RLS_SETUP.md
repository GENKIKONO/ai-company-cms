# Storage RLS Setup Instructions

## Issue
The assets bucket has RLS enabled but no policies, preventing user uploads. Only service role access works.

## Manual Fix Required

### 1. Access Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]
2. Navigate to Storage → Policies

### 2. Create Storage Policies

Execute the following SQL in the SQL Editor (Database → SQL Editor):

```sql
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "assets_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "assets_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "assets_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "assets_delete_policy" ON storage.objects;

-- Policy 1: SELECT (閲覧許可) - Allow public read access
CREATE POLICY "assets_select_policy" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'assets');

-- Policy 2: INSERT (アップロード許可) - Allow authenticated users to upload
CREATE POLICY "assets_insert_policy" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'assets');

-- Policy 3: UPDATE (更新許可) - Allow users to update their own files
CREATE POLICY "assets_update_policy" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'assets' AND auth.uid() = owner)
    WITH CHECK (bucket_id = 'assets' AND auth.uid() = owner);

-- Policy 4: DELETE (削除許可) - Allow users to delete their own files  
CREATE POLICY "assets_delete_policy" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'assets' AND auth.uid() = owner);
```

### 3. Verify Bucket Settings
Ensure the assets bucket is configured correctly:
- Public: ✅ true
- Allowed MIME types: image/png, image/jpeg, image/jpg, image/webp, image/svg+xml
- File size limit: 5242880 (5MB)

## Alternative: Temporary Workaround

If manual setup is not possible immediately, we can modify the upload component to use the service role key temporarily:

### Option A: Backend Upload API
Create a server-side upload endpoint that uses service role key and handles the upload server-side.

### Option B: Disable RLS Temporarily
```sql
-- TEMPORARY: Disable RLS on storage.objects (NOT RECOMMENDED FOR PRODUCTION)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

## Testing After Setup

Run this script to verify the fix:
```bash
node scripts/test-image-upload.js
```

Expected output:
- ✅ Service Role upload successful
- ✅ Anon upload successful (after authentication)
- ✅ Authenticated upload successful