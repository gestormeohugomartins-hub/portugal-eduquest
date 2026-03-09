import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, User, Users, Settings } from "lucide-react";
import { AccessibilitySettings } from "@/components/accessibility/AccessibilitySettings";

interface Student {
  id: string;
  display_name: string;
  nickname?: string | null;
}

interface Profile {
  id: string;
  display_name: string;
  email: string;
}

interface AccessibilityManagerProps {
  profile: Profile;
  children: Student[];
}

export const AccessibilityManager = ({ profile, children }: AccessibilityManagerProps) => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(id)) {
      newOpenSections.delete(id);
    } else {
      newOpenSections.add(id);
    }
    setOpenSections(newOpenSections);
  };

  const users = [
    {
      id: profile.id,
      type: "parent" as const,
      name: profile.display_name,
      subtitle: profile.email,
      icon: User,
      table: "profiles" as const,
      userId: profile.id,
    },
    ...children.map(child => ({
      id: child.id,
      type: "student" as const,
      name: child.display_name,
      subtitle: child.nickname ? `(${child.nickname})` : "Educando",
      icon: Users,
      table: "students" as const,
      userId: child.id,
    }))
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg font-bold">Configurações de Acessibilidade</h3>
      </div>
      
      <p className="font-body text-sm text-muted-foreground mb-4">
        Configure as opções de acessibilidade para a sua conta e para cada um dos seus educandos.
      </p>

      <div className="space-y-3">
        {users.map(user => (
          <div key={user.id} className="border border-border rounded-lg overflow-hidden">
            <Collapsible 
              open={openSections.has(user.id)} 
              onOpenChange={() => toggleSection(user.id)}
            >
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-auto p-4 hover:bg-accent/50"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <user.icon className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <div className="font-body font-semibold">{user.name}</div>
                        <div className="font-body text-xs text-muted-foreground">
                          {user.subtitle}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.type === "parent" ? (
                        <span className="font-body text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          Encarregado
                        </span>
                      ) : (
                        <span className="font-body text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                          Educando
                        </span>
                      )}
                      {openSections.has(user.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="p-4 border-t border-border bg-accent/5">
                  <AccessibilitySettings 
                    userId={user.userId}
                    table={user.table}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <h4 className="font-body font-semibold text-sm mb-2">ℹ️ Sobre as Configurações de Acessibilidade</h4>
        <ul className="font-body text-xs text-muted-foreground space-y-1">
          <li>• <strong>Lupa:</strong> Ativa uma lupa retangular móvel para ampliar conteúdo</li>
          <li>• <strong>Suporte para Dislexia:</strong> Aplica a fonte OpenDyslexic para facilitar a leitura</li>
          <li>• <strong>Filtros para Daltonismo:</strong> Ajusta as cores para diferentes tipos de daltonismo</li>
          <li>• As configurações são aplicadas individualmente e guardadas automaticamente</li>
        </ul>
      </div>
    </div>
  );
};