const districtPositions: Record<string, { x: number; y: number; label: string }> = {
  viana_castelo: { x: 15, y: 8, label: "Viana do Castelo" },
  braga: { x: 25, y: 12, label: "Braga" },
  vila_real: { x: 35, y: 10, label: "Vila Real" },
  braganca: { x: 50, y: 8, label: "Bragança" },
  porto: { x: 20, y: 20, label: "Porto" },
  aveiro: { x: 15, y: 30, label: "Aveiro" },
  viseu: { x: 35, y: 25, label: "Viseu" },
  guarda: { x: 50, y: 25, label: "Guarda" },
  coimbra: { x: 22, y: 38, label: "Coimbra" },
  castelo_branco: { x: 45, y: 38, label: "C. Branco" },
  leiria: { x: 18, y: 45, label: "Leiria" },
  santarem: { x: 30, y: 50, label: "Santarém" },
  portalegre: { x: 48, y: 48, label: "Portalegre" },
  lisboa: { x: 18, y: 60, label: "Lisboa" },
  setubal: { x: 22, y: 68, label: "Setúbal" },
  evora: { x: 38, y: 62, label: "Évora" },
  beja: { x: 35, y: 75, label: "Beja" },
  faro: { x: 30, y: 85, label: "Faro" },
  acores: { x: 75, y: 20, label: "Açores" },
  madeira: { x: 75, y: 50, label: "Madeira" },
};

export const PortugalMap = () => {
  return (
    <div className="px-4">
      <h2 className="font-display text-xl font-bold mb-4 text-center">🗺️ Mapa de Portugal</h2>
      <p className="font-body text-sm text-muted-foreground text-center mb-4">
        Explora o mapa e encontra jogadores de todo o país!
      </p>
      
      <div className="relative w-full max-w-md mx-auto game-border bg-accent/10 rounded-xl" style={{ aspectRatio: "3/4" }}>
        {/* Simplified Portugal outline */}
        <div className="absolute inset-4">
          {Object.entries(districtPositions).map(([key, pos]) => (
            <div
              key={key}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div className="w-4 h-4 bg-primary rounded-full border-2 border-primary-foreground shadow-lg group-hover:scale-150 transition-transform animate-pulse" />
              <span className="absolute left-5 top-0 text-xs font-body font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-card px-1 rounded shadow">
                {pos.label}
              </span>
            </div>
          ))}
        </div>

        {/* Islands separator */}
        <div className="absolute right-4 top-1/4 bottom-1/4 w-px border-l-2 border-dashed border-border" />
        <span className="absolute right-2 top-[15%] text-xs font-body text-muted-foreground rotate-90">Ilhas</span>
      </div>
    </div>
  );
};
