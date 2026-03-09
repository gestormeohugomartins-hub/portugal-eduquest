import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

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

export default function ImportSchoolsPage() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<{ total: number; inserted: number; errors: number } | null>(null);

  const handleImport = async () => {
    if (!file) { toast.error("Selecione o ficheiro CSV"); return; }

    setImporting(true);
    setProgress(0);
    setStats(null);

    try {
      // Step 1: Read and parse CSV client-side
      setStatus("A ler e processar CSV...");
      const csvText = await file.text();
      const lines = csvText.split('\n');
      
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

      if (schools.length === 0) {
        toast.error("Nenhuma escola encontrada no CSV");
        setImporting(false);
        return;
      }

      setStatus(`${schools.length} escolas encontradas. A enviar em lotes...`);
      setProgress(10);

      // Step 2: Send in small batches of 200
      const batchSize = 200;
      let totalInserted = 0;
      let totalErrors = 0;

      for (let i = 0; i < schools.length; i += batchSize) {
        const batch = schools.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(schools.length / batchSize);
        
        setStatus(`Lote ${batchNum}/${totalBatches} (${totalInserted} inseridas)...`);

        const { data, error } = await supabase.functions.invoke('import-schools-temp', {
          body: { action: 'insert_batch', schools: batch },
        });

        if (error) {
          console.error(`Batch ${batchNum} error:`, error);
          totalErrors += batch.length;
        } else if (data && !data.success) {
          console.error(`Batch ${batchNum} failed:`, data.error);
          totalErrors += batch.length;
        } else {
          totalInserted += batch.length;
        }

        const pct = Math.round(10 + (((i + batchSize) / schools.length) * 90));
        setProgress(Math.min(pct, 100));
      }

      setProgress(100);
      setStats({ total: schools.length, inserted: totalInserted, errors: totalErrors });

      if (totalErrors === 0) {
        toast.success(`✅ ${totalInserted} escolas importadas com sucesso!`);
        setStatus("Importação concluída!");
      } else {
        toast.warning(`${totalInserted} importadas, ${totalErrors} erros`);
        setStatus(`Concluída: ${totalInserted} ok, ${totalErrors} erros`);
      }
    } catch (error: any) {
      toast.error("Erro: " + error.message);
      setStatus("Erro: " + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Importar Escolas (Distrito + Nome)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              CSV com colunas: NOME, DISTRITO. Parsing no browser, envio em lotes de 200.
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm border rounded p-2"
              disabled={importing}
            />

            <Button onClick={handleImport} disabled={importing || !file} className="w-full">
              {importing ? 'A importar...' : 'Importar Escolas'}
            </Button>

            {importing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-muted-foreground text-center">{status}</p>
              </div>
            )}

            {stats && !importing && (
              <div className="p-4 bg-muted rounded-lg space-y-1">
                <p className="font-medium">{status}</p>
                <p className="text-sm">Total no CSV: {stats.total}</p>
                <p className="text-sm text-primary">Inseridas: {stats.inserted}</p>
                {stats.errors > 0 && <p className="text-sm text-destructive">Erros: {stats.errors}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
