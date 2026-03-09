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

    const { action, csvText, offset } = await req.json();

    // Parse CSV and insert one batch at a time (called repeatedly from frontend)
    if (action === 'import_batch' && csvText) {
      const batchSize = 300;
      const startOffset = offset || 0;
      const lines = csvText.split('\n');
      const schools: { name: string; district: string }[] = [];
      
      let lineIndex = 0;
      let dataIndex = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        const fields = parseCSVLine(line);
        const ciclo = fields[13] || '';
        
        if (ciclo.includes('1') && ciclo.toLowerCase().includes('ciclo')) {
          if (dataIndex >= startOffset && dataIndex < startOffset + batchSize) {
            const name = fields[1]?.trim();
            const district = fields[8]?.trim();
            if (name && district) {
              schools.push({ name, district });
            }
          }
          dataIndex++;
          if (dataIndex >= startOffset + batchSize) break;
        }
      }

      if (schools.length === 0) {
        return new Response(
          JSON.stringify({ success: true, inserted: 0, hasMore: false, nextOffset: startOffset, total: dataIndex }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase.from('schools').insert(schools);
      const inserted = error ? 0 : schools.length;
      const hasMore = dataIndex > startOffset + batchSize;

      return new Response(
        JSON.stringify({ success: !error, inserted, hasMore, nextOffset: startOffset + batchSize, total: dataIndex, error: error?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
