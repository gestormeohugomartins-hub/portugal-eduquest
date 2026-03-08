import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, MapPin, School, Globe } from "lucide-react";

interface RankingEntry {
  id: string;
  display_name: string;
  xp: number;
  village_level: number;
  district: string | null;
  school_name: string | null;
  rank?: number;
}

interface RankingsPanelProps {
  studentId: string;
  district: string | null;
  schoolName: string | null;
}

const districtLabels: Record<string, string> = {
  aveiro: "Aveiro", beja: "Beja", braga: "Braga", braganca: "Bragança",
  castelo_branco: "Castelo Branco", coimbra: "Coimbra", evora: "Évora",
  faro: "Faro", guarda: "Guarda", leiria: "Leiria", lisboa: "Lisboa",
  portalegre: "Portalegre", porto: "Porto", santarem: "Santarém",
  setubal: "Setúbal", viana_castelo: "Viana do Castelo", vila_real: "Vila Real",
  viseu: "Viseu", acores: "Açores", madeira: "Madeira",
};

export const RankingsPanel = ({ studentId, district, schoolName }: RankingsPanelProps) => {
  const [nationalRanking, setNationalRanking] = useState<RankingEntry[]>([]);
  const [districtRanking, setDistrictRanking] = useState<RankingEntry[]>([]);
  const [schoolRanking, setSchoolRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<{ national: number; district: number; school: number }>({
    national: 0, district: 0, school: 0
  });

  useEffect(() => {
    fetchRankings();
  }, [studentId, district, schoolName]);

  const fetchRankings = async () => {
    setLoading(true);

    // National ranking - top 10
    const { data: national } = await supabase
      .from("students")
      .select("id, display_name, xp, village_level, district, school_name")
      .order("xp", { ascending: false })
      .limit(10);

    if (national) {
      setNationalRanking(national.map((s, i) => ({ ...s, rank: i + 1 })) as RankingEntry[]);
      const myNatRank = national.findIndex(s => s.id === studentId);
      if (myNatRank >= 0) setMyRank(prev => ({ ...prev, national: myNatRank + 1 }));
    }

    // District ranking
    if (district) {
      const { data: districtData } = await supabase
        .from("students")
        .select("id, display_name, xp, village_level, district, school_name")
        .eq("district", district)
        .order("xp", { ascending: false })
        .limit(10);

      if (districtData) {
        setDistrictRanking(districtData.map((s, i) => ({ ...s, rank: i + 1 })) as RankingEntry[]);
        const myDistRank = districtData.findIndex(s => s.id === studentId);
        if (myDistRank >= 0) setMyRank(prev => ({ ...prev, district: myDistRank + 1 }));
      }
    }

    // School ranking
    if (schoolName) {
      const { data: schoolData } = await supabase
        .from("students")
        .select("id, display_name, xp, village_level, district, school_name")
        .eq("school_name", schoolName)
        .order("xp", { ascending: false })
        .limit(10);

      if (schoolData) {
        setSchoolRanking(schoolData.map((s, i) => ({ ...s, rank: i + 1 })) as RankingEntry[]);
        const mySchRank = schoolData.findIndex(s => s.id === studentId);
        if (mySchRank >= 0) setMyRank(prev => ({ ...prev, school: mySchRank + 1 }));
      }
    }

    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <span className="text-xl">🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return <span className="text-sm font-mono text-muted-foreground">#{rank}</span>;
  };

  const RankingList = ({ entries, currentStudentId }: { entries: RankingEntry[]; currentStudentId: string }) => (
    <div className="space-y-2">
      {entries.map(entry => (
        <div 
          key={entry.id}
          className={`flex items-center gap-3 p-3 rounded-lg ${
            entry.id === currentStudentId ? "bg-primary/10 border border-primary" : "bg-muted/50"
          }`}
        >
          <div className="w-8 text-center">
            {getRankIcon(entry.rank || 0)}
          </div>
          <div className="flex-1">
            <p className="font-body font-semibold text-sm">
              {entry.display_name}
              {entry.id === currentStudentId && <span className="text-primary ml-1">(Tu)</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              Nível {entry.village_level}
            </p>
          </div>
          <Badge variant="secondary" className="font-mono">
            {entry.xp.toLocaleString()} XP
          </Badge>
        </div>
      ))}
      {entries.length === 0 && (
        <p className="text-center text-muted-foreground py-4">Sem dados disponíveis</p>
      )}
    </div>
  );

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">A carregar rankings...</div>;
  }

  return (
    <Card className="p-4">
      <h3 className="font-display font-bold flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-gold" />
        Rankings
      </h3>

      <Tabs defaultValue="national">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="national" className="gap-1 text-xs">
            <Globe className="w-3 h-3" /> Nacional
          </TabsTrigger>
          <TabsTrigger value="district" className="gap-1 text-xs" disabled={!district}>
            <MapPin className="w-3 h-3" /> Distrito
          </TabsTrigger>
          <TabsTrigger value="school" className="gap-1 text-xs" disabled={!schoolName}>
            <School className="w-3 h-3" /> Escola
          </TabsTrigger>
        </TabsList>

        <TabsContent value="national">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Globe className="w-3 h-3" /> Top 10 de Portugal
            {myRank.national > 0 && myRank.national <= 10 && (
              <Badge className="ml-auto">Estás no Top 10! 🎉</Badge>
            )}
          </div>
          <RankingList entries={nationalRanking} currentStudentId={studentId} />
        </TabsContent>

        <TabsContent value="district">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Top 10 de {district ? districtLabels[district] || district : ""}
          </div>
          <RankingList entries={districtRanking} currentStudentId={studentId} />
        </TabsContent>

        <TabsContent value="school">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <School className="w-3 h-3" /> Top 10 da {schoolName || "Escola"}
          </div>
          <RankingList entries={schoolRanking} currentStudentId={studentId} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};