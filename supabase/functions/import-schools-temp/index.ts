import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action } = body;

    // Insert pre-parsed batch
    if (action === 'insert_batch' && Array.isArray(body.schools)) {
      const { error } = await supabase.from('schools').insert(body.schools);
      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, inserted: body.schools.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Import from URL
    if (action === 'import_from_url' && body.url) {
      const csvResponse = await fetch(body.url);
      if (!csvResponse.ok) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch CSV from URL: ' + csvResponse.status }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      body.csvText = await csvResponse.text();
      console.log('Fetched CSV, length:', body.csvText.length);
    }

    // Full CSV import server-side
    if ((action === 'import_csv' || action === 'import_from_url') && body.csvText) {
      const lines = body.csvText.split('\n');
      const schools: { name: string; district: string }[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const fields = parseCSVLine(line);
        const name = fields[0];
        const district = fields[1];
        if (name && district) {
          schools.push({ name, district });
        }
      }

      console.log(`Parsed ${schools.length} schools`);

      if (schools.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'No schools found', parsed: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let inserted = 0;
      let errors = 0;
      const batchSize = 500;

      for (let i = 0; i < schools.length; i += batchSize) {
        const batch = schools.slice(i, i + batchSize);
        const { error } = await supabase.from('schools').insert(batch);
        if (error) {
          console.error(`Batch error at ${i}:`, error.message);
          errors += batch.length;
        } else {
          inserted += batch.length;
        }
      }

      return new Response(
        JSON.stringify({ success: true, parsed: schools.length, inserted, errors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
