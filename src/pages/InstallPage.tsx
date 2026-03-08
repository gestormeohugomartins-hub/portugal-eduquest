import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, Download, CheckCircle, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsAndroid(/android/.test(ua));

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>

        <img src={logo} alt="Questeduca" className="w-32 mx-auto mb-6" />

        <h1 className="font-display text-2xl font-bold mb-2">
          Instalar Questeduca
        </h1>
        <p className="font-body text-muted-foreground mb-8">
          Instala a app no teu dispositivo para jogares em qualquer lugar, mesmo sem internet!
        </p>

        {isInstalled ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h2 className="font-display text-lg font-bold text-green-800 mb-2">
              App Instalada!
            </h2>
            <p className="font-body text-sm text-green-700 mb-4">
              Questeduca já está instalada no teu dispositivo.
            </p>
            <Button onClick={() => navigate("/login")} className="bg-primary text-primary-foreground">
              Entrar no Jogo
            </Button>
          </div>
        ) : (
          <>
            {/* Android / Chrome Install Button */}
            {deferredPrompt && (
              <Button
                size="lg"
                className="w-full bg-primary text-primary-foreground font-bold py-6 mb-4"
                onClick={handleInstall}
              >
                <Download className="w-5 h-5 mr-2" />
                Instalar App
              </Button>
            )}

            {/* iOS Instructions */}
            {isIOS && !deferredPrompt && (
              <div className="bg-card border border-border rounded-xl p-6 mb-6 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="w-8 h-8 text-primary" />
                  <h2 className="font-display text-lg font-bold">Instalar no iPhone/iPad</h2>
                </div>
                <ol className="font-body text-sm text-muted-foreground space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                    <span>Toca no botão <strong>Partilhar</strong> (ícone quadrado com seta) na barra do Safari</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                    <span>Desliza para baixo e toca em <strong>"Adicionar ao ecrã principal"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                    <span>Toca em <strong>"Adicionar"</strong> no canto superior direito</span>
                  </li>
                </ol>
              </div>
            )}

            {/* Android Instructions (fallback) */}
            {isAndroid && !deferredPrompt && (
              <div className="bg-card border border-border rounded-xl p-6 mb-6 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="w-8 h-8 text-primary" />
                  <h2 className="font-display text-lg font-bold">Instalar no Android</h2>
                </div>
                <ol className="font-body text-sm text-muted-foreground space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                    <span>Toca no menu <strong>⋮</strong> (três pontos) no Chrome</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                    <span>Toca em <strong>"Instalar app"</strong> ou <strong>"Adicionar ao ecrã principal"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                    <span>Confirma tocando em <strong>"Instalar"</strong></span>
                  </li>
                </ol>
              </div>
            )}

            {/* Desktop Instructions */}
            {!isIOS && !isAndroid && !deferredPrompt && (
              <div className="bg-card border border-border rounded-xl p-6 mb-6 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <Monitor className="w-8 h-8 text-primary" />
                  <h2 className="font-display text-lg font-bold">Instalar no Computador</h2>
                </div>
                <p className="font-body text-sm text-muted-foreground mb-3">
                  No Chrome, Edge ou outros browsers compatíveis:
                </p>
                <ol className="font-body text-sm text-muted-foreground space-y-2">
                  <li>• Procura o ícone de instalação na barra de endereços</li>
                  <li>• Ou usa o menu do browser → "Instalar Questeduca"</li>
                </ol>
              </div>
            )}
          </>
        )}

        {/* Play in browser option */}
        {!isInstalled && (
          <Button
            variant="outline"
            className="w-full border-2 border-primary/30 font-bold"
            onClick={() => navigate("/login")}
          >
            <Monitor className="w-4 h-4 mr-2" />
            Continuar no Browser
          </Button>
        )}

        <p className="font-body text-xs text-muted-foreground mt-6">
          A app funciona em iPhone, iPad, Android, Windows, Mac e Linux.
          <br />Não precisa de app store!
        </p>
      </div>
    </div>
  );
};

export default InstallPage;
