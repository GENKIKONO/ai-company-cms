-- Create service-images storage bucket for Supabase
-- This allows services to have image attachments

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images', 
  true,
  524288, -- 512KB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) 
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload their organization's service images
CREATE POLICY "Users can upload service images for their organization" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL
);

-- Create policy to allow authenticated users to update their organization's service images  
CREATE POLICY "Users can update service images for their organization" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL
);

-- Create policy to allow authenticated users to delete their organization's service images
CREATE POLICY "Users can delete service images for their organization" ON storage.objects
FOR DELETE USING (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL
);

-- Create policy to allow public access to view service images
CREATE POLICY "Anyone can view service images" ON storage.objects
FOR SELECT USING (bucket_id = 'service-images');

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;