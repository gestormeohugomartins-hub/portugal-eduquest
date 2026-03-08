import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, Download, CheckCircle, ArrowLeft, Apple, Play } from "lucide-react";
import logo from "@/assets/logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// TODO: Replace with actual store URLs once published
const APP_STORE_URL = "https://apps.apple.com/app/questeduca/id0000000000";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=pt.questeduca.app";

const InstallPage = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    // Check if running inside Capacitor native app
    const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
    setIsNativeApp(isCapacitor);

    // Check if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches || isCapacitor) {
      setIsInstalled(true);
    }

    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsAndroid(/android/.test(ua));

    // Listen for PWA install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handlePWAInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <img src={logo} alt="Questeduca" className="w-32 mx-auto mb-6" />
          <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-6 mb-6">
            <CheckCircle className="w-12 h-12 text-secondary mx-auto mb-3" />
            <h2 className="font-display text-lg font-bold mb-2">App Instalada!</h2>
            <p className="font-body text-sm text-muted-foreground mb-4">
              Questeduca já está instalada no teu dispositivo.
            </p>
            <Button onClick={() => navigate("/login")} className="bg-primary text-primary-foreground">
              Entrar no Jogo
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
        <p className="font-body text-muted-foreground mb-6">
          Instala a app no teu dispositivo para uma experiência completa!
        </p>


        {/* PWA Install */}
        {deferredPrompt ? (
          <Button
            size="lg"
            variant="outline"
            className="w-full border-2 border-primary/30 font-bold py-6 mb-3"
            onClick={handlePWAInstall}
          >
            <Download className="w-5 h-5 mr-2" />
            Instalar via Browser
          </Button>
        ) : isIOS ? (
          <div className="bg-card border border-border rounded-xl p-4 mb-4 text-left">
            <h3 className="font-display text-sm font-bold mb-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              Alternativa: Instalar via Safari
            </h3>
            <ol className="font-body text-xs text-muted-foreground space-y-2">
              <li>1. Toca no botão <strong>Partilhar</strong> (□↑) no Safari</li>
              <li>2. Toca em <strong>"Adicionar ao ecrã principal"</strong></li>
              <li>3. Confirma com <strong>"Adicionar"</strong></li>
            </ol>
          </div>
        ) : isAndroid ? (
          <div className="bg-card border border-border rounded-xl p-4 mb-4 text-left">
            <h3 className="font-display text-sm font-bold mb-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              Alternativa: Instalar via Chrome
            </h3>
            <ol className="font-body text-xs text-muted-foreground space-y-2">
              <li>1. Toca no menu <strong>⋮</strong> no Chrome</li>
              <li>2. Toca em <strong>"Instalar app"</strong></li>
              <li>3. Confirma com <strong>"Instalar"</strong></li>
            </ol>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-4 mb-4 text-left">
            <h3 className="font-display text-sm font-bold mb-2 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-primary" />
              Instalar no Computador
            </h3>
            <p className="font-body text-xs text-muted-foreground">
              Procura o ícone de instalação na barra de endereços do Chrome ou Edge.
            </p>
          </div>
        )}

        {/* Continue in browser */}
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => navigate("/login")}
        >
          Continuar no Browser
        </Button>
      </div>
    </div>
  );
};

export default InstallPage;
