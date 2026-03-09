import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SchoolRow {
  name: string;
  district: string;
  municipality: string | null;
  locality: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { schools: rawSchools } = await req.json();
    
    console.log(`Received ${rawSchools.length} schools to import`);

    // Delete existing schools first
    const { error: deleteError } = await supabase
      .from('schools')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('Delete error:', deleteError);
    }

    // Insert in batches of 500
    const batchSize = 500;
    let inserted = 0;
    
    for (let i = 0; i < rawSchools.length; i += batchSize) {
      const batch = rawSchools.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('schools')
        .insert(batch);
      
      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        throw error;
      }
      
      inserted += batch.length;
      console.log(`Inserted batch: ${inserted}/${rawSchools.length}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalInserted: inserted,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
