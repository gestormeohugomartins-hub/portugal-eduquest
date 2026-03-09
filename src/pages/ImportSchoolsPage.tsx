import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface SchoolData {
  name: string;
  district: string;
  municipality: string | null;
  locality: string | null;
}

export default function ImportSchoolsPage() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<{ total: number; inserted: number; errors: number } | null>(null);

  const parseCSV = (text: string): SchoolData[] => {
    const lines = text.split('\n');
    const schools: SchoolData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            current += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current.trim());
      
      // Indexes: CODIGO(0),NOME(1),...,LOCALIDADE(6),CONCELHO(7),DISTRITO(8),...,CICLO(13)
      const ciclo = fields[13] || '';
      
      if (ciclo.includes('1º Ciclo')) {
        const name = fields[1]?.trim();
        const locality = fields[6]?.trim() || null;
        const municipality = fields[7]?.trim() || null;
        const district = fields[8]?.trim() || null;
        
        if (name && district) {
          schools.push({ name, district, municipality, locality });
        }
      }
    }
    
    return schools;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Selecione o ficheiro CSV");
      return;
    }

    setImporting(true);
    setProgress(0);
    setStats(null);

    try {
      // Step 1: Parse CSV
      setStatus("A ler ficheiro CSV...");
      const text = await file.text();
      const schools = parseCSV(text);
      
      if (schools.length === 0) {
        toast.error("Nenhuma escola do 1º Ciclo encontrada no ficheiro");
        setImporting(false);
        return;
      }

      setStatus(`Encontradas ${schools.length} escolas. A limpar dados antigos...`);
      setProgress(5);

      // Step 2: Delete existing schools via edge function
      const { error: deleteError } = await supabase.functions.invoke('import-schools-temp', {
        body: { action: 'delete' },
      });

      if (deleteError) {
        console.error('Delete error:', deleteError);
      }

      setProgress(10);
      setStatus(`A importar ${schools.length} escolas em lotes...`);

      // Step 3: Insert in batches of 100 directly
      const batchSize = 100;
      let inserted = 0;
      let errors = 0;

      for (let i = 0; i < schools.length; i += batchSize) {
        const batch = schools.slice(i, i + batchSize);
        
        const { error } = await supabase.functions.invoke('import-schools-temp', {
          body: { action: 'insert', schools: batch },
        });

        if (error) {
          console.error(`Batch error at ${i}:`, error);
          errors += batch.length;
        } else {
          inserted += batch.length;
        }

        const progressPercent = 10 + ((i + batch.length) / schools.length) * 90;
        setProgress(Math.round(progressPercent));
        setStatus(`Importadas ${inserted} de ${schools.length} escolas...`);
      }

      setProgress(100);
      setStats({ total: schools.length, inserted, errors });
      
      if (errors === 0) {
        toast.success(`✅ Importadas ${inserted} escolas com sucesso!`);
        setStatus("Importação concluída com sucesso!");
      } else {
        toast.warning(`Importadas ${inserted} escolas, ${errors} erros`);
        setStatus(`Importação concluída: ${inserted} ok, ${errors} erros`);
      }

    } catch (error: any) {
      toast.error("Erro na importação");
      setStatus(`Erro: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Importar Escolas do 1º Ciclo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ficheiro CSV (RedeEscolas)</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm border rounded p-2"
                disabled={importing}
              />
            </div>

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
                <p className="text-sm">Total processadas: {stats.total}</p>
                <p className="text-sm text-green-600">Inseridas: {stats.inserted}</p>
                {stats.errors > 0 && (
                  <p className="text-sm text-destructive">Erros: {stats.errors}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
