import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Building2, Upload, FileText } from "lucide-react";

const districts = [
  { value: "aveiro", label: "Aveiro" }, { value: "beja", label: "Beja" },
  { value: "braga", label: "Braga" }, { value: "braganca", label: "Bragança" },
  { value: "castelo_branco", label: "Castelo Branco" }, { value: "coimbra", label: "Coimbra" },
  { value: "evora", label: "Évora" }, { value: "faro", label: "Faro" },
  { value: "guarda", label: "Guarda" }, { value: "leiria", label: "Leiria" },
  { value: "lisboa", label: "Lisboa" }, { value: "portalegre", label: "Portalegre" },
  { value: "porto", label: "Porto" }, { value: "santarem", label: "Santarém" },
  { value: "setubal", label: "Setúbal" }, { value: "viana_castelo", label: "Viana do Castelo" },
  { value: "vila_real", label: "Vila Real" }, { value: "viseu", label: "Viseu" },
  { value: "acores", label: "Açores" }, { value: "madeira", label: "Madeira" },
];

const AssociationRegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<{ id: string; name: string; district: string }[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    presidentName: "",
    presidentRole: "president",
    schoolId: "",
    iban: "",
    bankAccountHolder: "",
  });
  const [ataFile, setAtaFile] = useState<File | null>(null);
  const [bankProofFile, setBankProofFile] = useState<File | null>(null);

  useEffect(() => {
    if (selectedDistrict) {
      supabase
        .from("schools")
        .select("id, name, district")
        .eq("district", selectedDistrict)
        .order("name")
        .then(({ data }) => setSchools(data || []));
    }
  }, [selectedDistrict]);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "AP-";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.schoolId || !ataFile || !bankProofFile) {
      toast.error("Preencha todos os campos obrigatórios e anexe os documentos.");
      return;
    }
    if (!formData.email.includes("@")) {
      toast.error("Utilize o email oficial da associação.");
      return;
    }

    setLoading(true);

    try {
      // Upload documents
      const timestamp = Date.now();
      const ataPath = `atas/${timestamp}_${ataFile.name}`;
      const bankPath = `bank/${timestamp}_${bankProofFile.name}`;

      const [ataUpload, bankUpload] = await Promise.all([
        supabase.storage.from("association-docs").upload(ataPath, ataFile),
        supabase.storage.from("association-docs").upload(bankPath, bankProofFile),
      ]);

      if (ataUpload.error) throw new Error("Erro ao carregar ata: " + ataUpload.error.message);
      if (bankUpload.error) throw new Error("Erro ao carregar comprovativo: " + bankUpload.error.message);

      const code = generateCode();

      const { error } = await supabase.from("parent_associations").insert({
        school_id: formData.schoolId,
        name: formData.name,
        email: formData.email.toLowerCase().trim(),
        president_name: formData.presidentName,
        president_role: formData.presidentRole,
        iban: formData.iban,
        bank_account_holder: formData.bankAccountHolder,
        ata_document_url: ataPath,
        bank_proof_url: bankPath,
        ata_updated_at: new Date().toISOString(),
        association_code: code,
      } as any);

      if (error) throw error;

      toast.success("Registo enviado com sucesso! Ficará pendente de validação. O código da associação será comunicado após aprovação.");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro no registo.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 parchment-bg">
      <div className="w-full max-w-lg game-border p-8 bg-card">
        <div className="text-center mb-6">
          <img src={logo} alt="Questeduca" className="w-24 mx-auto mb-3" />
          <Building2 className="w-10 h-10 text-primary mx-auto mb-2" />
          <h1 className="font-display text-2xl font-bold">Registo de Associação de Pais</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Solicite o registo da sua Associação de Pais para receber doações dos utilizadores Premium.
          </p>
        </div>

        <div className="bg-accent/20 border border-accent rounded-lg p-3 mb-4">
          <p className="font-body text-xs text-muted-foreground">
            <strong>Nota:</strong> O registo deve ser solicitado pelo Presidente ou Vice-Presidente da Associação, 
            com email oficial da mesma. A ata da associação deve ser atualizada anualmente até final de dezembro.
            Por cada subscrição Premium com o código da associação, <strong>1€ reverte para a associação</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="font-body font-semibold">Nome da Associação *</Label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Associação de Pais da EB1..."
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-body font-semibold">Email Oficial da Associação *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="associacao@escola.pt"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-body font-semibold">Nome do Responsável *</Label>
              <Input
                value={formData.presidentName}
                onChange={e => setFormData({ ...formData, presidentName: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-body font-semibold">Cargo *</Label>
              <Select
                value={formData.presidentRole}
                onValueChange={v => setFormData({ ...formData, presidentRole: v })}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="president">Presidente</SelectItem>
                  <SelectItem value="vice_president">Vice-Presidente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="font-body font-semibold">Distrito da Escola *</Label>
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o distrito" /></SelectTrigger>
              <SelectContent>
                {districts.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedDistrict && (
            <div>
              <Label className="font-body font-semibold">Escola *</Label>
              <Select
                value={formData.schoolId}
                onValueChange={v => setFormData({ ...formData, schoolId: v })}
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a escola" /></SelectTrigger>
                <SelectContent>
                  {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="font-body font-semibold">IBAN *</Label>
            <Input
              value={formData.iban}
              onChange={e => setFormData({ ...formData, iban: e.target.value })}
              required
              placeholder="PT50..."
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-body font-semibold">Titular da Conta *</Label>
            <Input
              value={formData.bankAccountHolder}
              onChange={e => setFormData({ ...formData, bankAccountHolder: e.target.value })}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-body font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" /> Ata da Associação (PDF) *
            </Label>
            <Input
              type="file"
              accept=".pdf"
              onChange={e => setAtaFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="font-body font-semibold flex items-center gap-2">
              <Upload className="w-4 h-4" /> Comprovativo Bancário (PDF) *
            </Label>
            <Input
              type="file"
              accept=".pdf"
              onChange={e => setBankProofFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground font-bold text-lg py-5"
            disabled={loading}
          >
            {loading ? "A enviar..." : "🏛️ Submeter Registo"}
          </Button>
        </form>

        <Button
          variant="ghost"
          className="w-full mt-4 font-body text-muted-foreground"
          onClick={() => navigate("/")}
        >
          ← Voltar à página inicial
        </Button>
      </div>
    </div>
  );
};

export default AssociationRegisterPage;
