import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import villageHero from "@/assets/village-hero.png";
import { Button } from "@/components/ui/button";
import { Shield, BookOpen, Users, Map, Cookie, FileText, Mail, MessageSquare, X, Smartphone, Monitor } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { sendEmail } from "@/lib/email";

const Index = () => {
  const navigate = useNavigate();
  const [cookiesAccepted, setCookiesAccepted] = useState(
    localStorage.getItem("cookiesAccepted") === "true"
  );
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    type: "informacao",
    message: "",
  });
  const [sendingContact, setSendingContact] = useState(false);

  const acceptCookies = () => {
    localStorage.setItem("cookiesAccepted", "true");
    setCookiesAccepted(true);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingContact(true);

    try {
      const typeLabels: Record<string, string> = {
        informacao: "Pedido de Informação",
        sugestao: "Sugestão",
        reclamacao: "Reclamação",
        outro: "Outro",
      };

      await sendEmail({
        to: "info@serv2all.pt",
        subject: `[Questeduca] ${typeLabels[contactForm.type]} - ${contactForm.name}`,
        html: `
          <h2>${typeLabels[contactForm.type]}</h2>
          <p><strong>Nome:</strong> ${contactForm.name}</p>
          <p><strong>Email:</strong> ${contactForm.email}</p>
          <p><strong>Mensagem:</strong></p>
          <p>${contactForm.message.replace(/\n/g, '<br>')}</p>
        `,
      });

      toast.success("Mensagem enviada com sucesso!");
      setContactOpen(false);
      setContactForm({ name: "", email: "", type: "informacao", message: "" });
    } catch (error) {
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    }

    setSendingContact(false);
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Cookie Banner */}
      {!cookiesAccepted && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-border p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Cookie className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <p className="font-body text-sm text-muted-foreground">
                Utilizamos cookies essenciais para o funcionamento do site. 
                Ao continuar, aceita a nossa Política de Privacidade.
              </p>
            </div>
            <Button onClick={acceptCookies} size="sm" className="bg-primary text-primary-foreground">
              Aceitar
            </Button>
          </div>
        </div>
      )}

      {/* Floating Contact Button */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogTrigger asChild>
          <button className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Contacte-nos</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <Label className="font-body font-semibold">Nome</Label>
              <Input
                value={contactForm.name}
                onChange={e => setContactForm({...contactForm, name: e.target.value})}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-body font-semibold">Email</Label>
              <Input
                type="email"
                value={contactForm.email}
                onChange={e => setContactForm({...contactForm, email: e.target.value})}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-body font-semibold">Tipo de Contacto</Label>
              <Select value={contactForm.type} onValueChange={v => setContactForm({...contactForm, type: v})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="informacao">Pedido de Informação</SelectItem>
                  <SelectItem value="sugestao">Sugestão</SelectItem>
                  <SelectItem value="reclamacao">Reclamação</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-body font-semibold">Mensagem</Label>
              <Textarea
                value={contactForm.message}
                onChange={e => setContactForm({...contactForm, message: e.target.value})}
                required
                rows={4}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold" disabled={sendingContact}>
              {sendingContact ? "A enviar..." : "Enviar Mensagem"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <div className="relative">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${villageHero})` }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-4 pt-8">
          <img 
            src={logo} 
            alt="Questeduca" 
            className="w-56 md:w-72 mb-6 drop-shadow-xl"
          />
          <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground text-center mb-3">
            Aprende, Constrói, Defende!
          </h1>
          <p className="font-body text-base md:text-lg text-muted-foreground text-center max-w-xl mb-6">
            O jogo educativo que transforma o estudo em aventura para o 1º ciclo do ensino básico.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground font-bold px-8 py-5"
              onClick={() => navigate("/register")}
            >
              🏰 Começar Aventura
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-primary/30 font-bold px-8 py-5"
              onClick={() => navigate("/login")}
            >
              ⚔️ Entrar
            </Button>
          </div>

          {/* Platform Download/Play Section */}
          <div className="bg-card/80 backdrop-blur rounded-2xl border border-border p-6 max-w-lg w-full">
            <p className="font-display text-sm font-bold text-center mb-4 text-muted-foreground">
              Disponível em todas as plataformas
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://play.google.com/store/apps/details?id=app.lovable.381d72f5897a457e979e5888fd33045b"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-foreground text-background rounded-xl px-5 py-3 font-body font-bold text-sm hover:opacity-90 transition-opacity"
              >
                <Smartphone className="w-5 h-5" />
                <div className="text-left">
                  <span className="text-[10px] font-normal opacity-70 block leading-none">Disponível no</span>
                  Google Play
                </div>
              </a>
              <a
                href="https://apps.apple.com/app/questeduca/id000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-foreground text-background rounded-xl px-5 py-3 font-body font-bold text-sm hover:opacity-90 transition-opacity"
              >
                <Smartphone className="w-5 h-5" />
                <div className="text-left">
                  <span className="text-[10px] font-normal opacity-70 block leading-none">Disponível na</span>
                  App Store
                </div>
              </a>
              <Button
                variant="outline"
                className="border-2 border-primary/30 font-bold rounded-xl px-5 py-3 h-auto"
                onClick={() => navigate("/login")}
              >
                <Monitor className="w-5 h-5 mr-2" />
                <div className="text-left">
                  <span className="text-[10px] font-normal opacity-70 block leading-none">Jogar no</span>
                  PC / Browser
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-12 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">
            Como Funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, title: "Aprender", desc: "Perguntas do 1º ao 4º ano", color: "bg-accent" },
              { icon: Shield, title: "Construir", desc: "Melhora a tua aldeia", color: "bg-secondary" },
              { icon: Users, title: "Socializar", desc: "Faz amigos seguros", color: "bg-primary" },
              { icon: Map, title: "Explorar", desc: "Mapa de Portugal", color: "bg-diamond" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl p-5 text-center border border-border hover:border-primary/50 transition-colors"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-bold mb-1">{feature.title}</h3>
                <p className="font-body text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Parental Control */}
      <div className="py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
            Controlo Parental Total
          </h2>
          <p className="font-body text-muted-foreground mb-6">
            Os pais registam-se primeiro, autorizam os educandos, monitorizam amizades e conversas, 
            e acompanham a evolução escolar em tempo real.
          </p>
          <Button 
            variant="outline"
            onClick={() => navigate("/register")}
          >
            Saber Mais
          </Button>
        </div>
      </div>

      {/* FAQ & Parental Links */}
      <div className="py-12 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">
            Saber Mais
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-primary/30 font-bold"
              onClick={() => navigate("/faq")}
            >
              ❓ Perguntas Frequentes
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-primary/30 font-bold"
              onClick={() => navigate("/register")}
            >
              🛡️ Controlo Parental
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-primary/30 font-bold"
              onClick={() => navigate("/register/association")}
            >
              🏛️ Associações de Pais
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <h3 className="font-display font-bold mb-3">Questeduca</h3>
              <p className="font-body text-sm text-muted-foreground">
                Jogo educativo para o 1º Ciclo do Ensino Básico em Portugal.
              </p>
            </div>
            
            {/* Legal Links */}
            <div>
              <h3 className="font-display font-bold mb-3">Legal</h3>
              <div className="space-y-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="font-body text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                      <FileText className="w-4 h-4" /> Termos de Utilização
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">Termos de Utilização</DialogTitle>
                    </DialogHeader>
                    <div className="font-body text-sm text-muted-foreground space-y-4">
                      <p><strong>Última atualização:</strong> Março 2026</p>
                      
                      <h4 className="font-semibold text-foreground">Entidade Responsável</h4>
                      <p>Hugo Alberto da Silva Martins<br />NIF: 218246587<br />Contacto: info@serv2all.pt</p>
                      
                      <h4 className="font-semibold text-foreground">1. Aceitação dos Termos</h4>
                      <p>Ao aceder e utilizar o Questeduca, aceita estar vinculado a estes Termos de Utilização. Se não concordar com alguma parte destes termos, não deve utilizar o serviço.</p>
                      
                      <h4 className="font-semibold text-foreground">2. Descrição do Serviço</h4>
                      <p>O Questeduca é uma plataforma educativa online destinada a crianças do 1º ao 4º ano do ensino básico, com supervisão parental obrigatória.</p>
                      
                      <h4 className="font-semibold text-foreground">3. Registo e Conta</h4>
                      <p>O registo de menores requer autorização prévia do encarregado de educação. Os pais são responsáveis pela veracidade dos dados fornecidos e pela supervisão da utilização pelos seus educandos.</p>
                      
                      <h4 className="font-semibold text-foreground">4. Utilização Aceitável</h4>
                      <p>Os utilizadores comprometem-se a utilizar a plataforma de forma responsável, respeitando os outros utilizadores e não partilhando conteúdo inadequado.</p>
                      
                      <h4 className="font-semibold text-foreground">5. Propriedade Intelectual</h4>
                      <p>Todo o conteúdo do Questeduca, incluindo textos, imagens, logótipos e software, é propriedade exclusiva do titular e está protegido por direitos de autor.</p>
                      
                      <h4 className="font-semibold text-foreground">6. Limitação de Responsabilidade</h4>
                      <p>O Questeduca é fornecido "tal como está". Não garantimos que o serviço seja ininterrupto ou livre de erros.</p>
                      
                      <h4 className="font-semibold text-foreground">7. Lei Aplicável</h4>
                      <p>Estes termos são regidos pela lei portuguesa. Qualquer litígio será submetido aos tribunais portugueses competentes.</p>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="font-body text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                      <Shield className="w-4 h-4" /> Política de Privacidade
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">Política de Privacidade</DialogTitle>
                    </DialogHeader>
                    <div className="font-body text-sm text-muted-foreground space-y-4">
                      <p><strong>Última atualização:</strong> Março 2026</p>
                      <p>Em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD) - Regulamento (UE) 2016/679.</p>
                      
                      <h4 className="font-semibold text-foreground">1. Responsável pelo Tratamento</h4>
                      <p>O responsável pelo tratamento dos dados é identificado nos Termos de Utilização. Para contacto: info@serv2all.pt</p>
                      
                      <h4 className="font-semibold text-foreground">2. Dados Recolhidos</h4>
                      <p>Recolhemos: nome, email, distrito, ano de escolaridade, dados de progresso no jogo e interações sociais dentro da plataforma.</p>
                      
                      <h4 className="font-semibold text-foreground">3. Finalidade do Tratamento</h4>
                      <p>Os dados são utilizados para: funcionamento da plataforma, personalização da experiência educativa, comunicações essenciais e cumprimento de obrigações legais.</p>
                      
                      <h4 className="font-semibold text-foreground">4. Base Legal</h4>
                      <p>O tratamento baseia-se no consentimento do titular (ou do encarregado de educação no caso de menores) e na execução do contrato de utilização.</p>
                      
                      <h4 className="font-semibold text-foreground">5. Direitos do Titular</h4>
                      <p>Tem direito a: aceder, retificar, apagar, limitar o tratamento, portabilidade e oposição ao tratamento dos seus dados. Para exercer estes direitos, contacte info@serv2all.pt.</p>
                      
                      <h4 className="font-semibold text-foreground">6. Proteção de Menores</h4>
                      <p>Os dados de menores são tratados com especial cuidado. O registo requer autorização parental e os pais têm acesso total às atividades dos educandos.</p>
                      
                      <h4 className="font-semibold text-foreground">7. Retenção de Dados</h4>
                      <p>Os dados são conservados enquanto a conta estiver ativa. Após eliminação da conta, os dados são removidos no prazo de 30 dias, exceto quando exigido por lei.</p>
                      
                      <h4 className="font-semibold text-foreground">8. Segurança</h4>
                      <p>Implementamos medidas técnicas e organizativas adequadas para proteger os dados contra acesso não autorizado, perda ou destruição.</p>
                      
                      <h4 className="font-semibold text-foreground">9. Autoridade de Controlo</h4>
                      <p>Pode apresentar reclamação à Comissão Nacional de Proteção de Dados (CNPD) em www.cnpd.pt.</p>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="font-body text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                      <Cookie className="w-4 h-4" /> Política de Cookies
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">Política de Cookies</DialogTitle>
                    </DialogHeader>
                    <div className="font-body text-sm text-muted-foreground space-y-4">
                      <p><strong>Última atualização:</strong> Março 2026</p>
                      
                      <h4 className="font-semibold text-foreground">O que são Cookies?</h4>
                      <p>Cookies são pequenos ficheiros de texto armazenados no seu dispositivo quando visita um website.</p>
                      
                      <h4 className="font-semibold text-foreground">Cookies que Utilizamos</h4>
                      <p><strong>Cookies Essenciais:</strong> Necessários para o funcionamento básico do site, incluindo autenticação e segurança.</p>
                      <p><strong>Cookies de Sessão:</strong> Mantêm a sua sessão ativa enquanto utiliza a plataforma.</p>
                      <p><strong>Cookies de Preferências:</strong> Guardam as suas preferências.</p>
                      
                      <h4 className="font-semibold text-foreground">Cookies de Terceiros</h4>
                      <p>Não utilizamos cookies de publicidade ou rastreamento de terceiros.</p>
                      
                      <h4 className="font-semibold text-foreground">Contacto</h4>
                      <p>Para questões sobre cookies, contacte: info@serv2all.pt</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {/* Contact */}
            <div>
              <h3 className="font-display font-bold mb-3">Contacto</h3>
              <p className="font-body text-sm text-muted-foreground">
                <Mail className="w-4 h-4 inline mr-1" />
                info@serv2all.pt
              </p>
            </div>
          </div>
          
          <div className="border-t border-border pt-6 text-center">
            <p className="font-body text-xs text-muted-foreground">
              © 2026 Questeduca. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;