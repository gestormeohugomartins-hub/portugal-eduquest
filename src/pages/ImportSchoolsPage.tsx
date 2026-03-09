import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ImportSchoolsPage() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<{ inserted: number; errors: number } | null>(null);

  const handleImport = async () => {
    if (!file) { toast.error("Selecione o ficheiro CSV"); return; }

    setImporting(true);
    setProgress(0);
    setStats(null);

    try {
      // Step 1: Read CSV
      setStatus("A ler ficheiro...");
      setProgress(5);
      const csvText = await file.text();

      // Step 2: Import in batches via loop
      let offset = 0;
      let totalInserted = 0;
      let totalErrors = 0;
      let hasMore = true;

      while (hasMore) {
        setStatus(`A importar lote a partir de ${offset}...`);
        
        const { data, error } = await supabase.functions.invoke('import-schools-temp', {
          body: { action: 'import_batch', csvText, offset },
        });

        if (error) {
          console.error('Batch error:', error);
          totalErrors++;
          break;
        }

        const result = data as { success: boolean; inserted: number; hasMore: boolean; nextOffset: number; total: number; error?: string };
        
        if (!result.success) {
          totalErrors += result.inserted === 0 ? 1 : 0;
          break;
        }

        totalInserted += result.inserted;
        hasMore = result.hasMore;
        offset = result.nextOffset;

        // Progress: 15% to 95%
        const pct = result.total > 0 
          ? Math.min(95, 15 + (offset / result.total) * 80) 
          : 50;
        setProgress(Math.round(pct));
        setStatus(`Importadas ${totalInserted} escolas...`);
      }

      setProgress(100);
      setStats({ inserted: totalInserted, errors: totalErrors });

      if (totalErrors === 0) {
        toast.success(`✅ Importadas ${totalInserted} escolas!`);
        setStatus("Importação concluída!");
      } else {
        toast.warning(`Importadas ${totalInserted} escolas, ${totalErrors} erros`);
        setStatus(`Concluída com ${totalErrors} erros`);
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
              Importa apenas distrito e nome da escola (1º Ciclo). Formato: CSV do GesEdu.
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
