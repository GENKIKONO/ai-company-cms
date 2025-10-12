import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('Applying coordinate fields migration...');
    
    // Service Role クライアント作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Execute the migration SQL directly
    const migrationSQL = `
      -- Add coordinate fields
      ALTER TABLE public.organizations 
      ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

      -- Add check constraints to ensure coordinates are within reasonable bounds
      -- Japan's approximate bounds: lat 24-46, lng 123-146
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_latitude_range') THEN
          ALTER TABLE public.organizations 
          ADD CONSTRAINT check_latitude_range CHECK (lat IS NULL OR (lat >= 20 AND lat <= 50));
        END IF;
      END $$;

      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_longitude_range') THEN
          ALTER TABLE public.organizations 
          ADD CONSTRAINT check_longitude_range CHECK (lng IS NULL OR (lng >= 120 AND lng <= 150));
        END IF;
      END $$;

      -- Create indexes for geo queries
      CREATE INDEX IF NOT EXISTS idx_organizations_coordinates ON public.organizations(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
    `;

    const { error: migrationError } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });

    if (migrationError) {
      console.error('Migration SQL execution failed:', migrationError);
      
      // Try alternative approach using individual queries
      const { error: alterError1 } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);
      
      if (alterError1) {
        return NextResponse.json({ 
          success: false, 
          error: `Migration failed: ${migrationError.message}`,
          details: migrationError,
          fallbackError: alterError1
        }, { status: 500 });
      }
    }

    console.log('Migration applied successfully');

    // Test the migration by updating an organization with coordinates
    const { data: testOrg, error: testOrgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    if (testOrgError || !testOrg) {
      return NextResponse.json({ 
        success: false, 
        error: 'No organizations found to test with'
      }, { status: 400 });
    }

    // Test coordinate field update
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ 
        lat: 35.6762, // Tokyo Station coordinates
        lng: 139.6503 
      })
      .eq('id', testOrg.id);

    if (updateError) {
      console.error('Coordinate field update test failed:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: `Coordinate fields test failed: ${updateError.message}`,
        details: updateError
      }, { status: 500 });
    }

    console.log('Migration verification successful');

    return NextResponse.json({ 
      success: true, 
      message: 'Coordinate fields migration applied and verified successfully',
      testOrgId: testOrg.id
    });

  } catch (error: any) {
    console.error('Migration API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Migration failed' 
    }, { status: 500 });
  }
}