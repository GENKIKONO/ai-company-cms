// Test fixture - component with .single() usage (should be detected)
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SupabaseSingle() {
  const supabase = createClientComponentClient();
  
  const fetchData = async () => {
    const data = await supabase.from('table').select().single();
    return data;
  };
  
  return <div>Supabase Single</div>;
}