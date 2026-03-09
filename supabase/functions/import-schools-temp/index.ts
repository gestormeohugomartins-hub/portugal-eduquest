import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface SchoolRow {
  name: string;
  district: string;
  municipality: string;
  locality: string;
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the parsed Excel data from the request body
    const { data: rawData } = await req.json();
    
    console.log(`Processing ${rawData.length} rows from Excel`);

    // Process and filter schools
    const schools: SchoolRow[] = [];
    
    for (const row of rawData) {
      const ciclo = row.CICLO || '';
      
      // Only process if contains "1º Ciclo"
      if (ciclo.includes('1º Ciclo')) {
        const name = row.NOME?.trim();
        const district = row.DISTRITO?.trim();
        const municipality = row.CONCELHO?.trim();
        const locality = row.LOCALIDADE?.trim();
        
        // Skip if essential fields are missing
        if (!name || !district) continue;
        
        schools.push({
          name,
          district,
          municipality: municipality || null,
          locality: locality || null,
        });
      }
    }

    console.log(`Filtered ${schools.length} schools with 1º Ciclo`);

    // Insert in batches of 500
    const batchSize = 500;
    let inserted = 0;
    
    for (let i = 0; i < schools.length; i += batchSize) {
      const batch = schools.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('schools')
        .insert(batch);
      
      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        throw error;
      }
      
      inserted += batch.length;
      console.log(`Inserted batch: ${inserted}/${schools.length}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalProcessed: rawData.length,
        totalFiltered: schools.length,
        totalInserted: inserted,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
