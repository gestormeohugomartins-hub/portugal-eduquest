import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { Users, GraduationCap } from "lucide-react";

const RegisterPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 parchment-bg">
      <div className="w-full max-w-md game-border p-8 bg-card">
        <div className="text-center mb-8">
          <img src={logo} alt="EduQuest" className="w-32 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold">Criar Conta</h1>
          <p className="font-body text-sm text-muted-foreground mt-2">
            Escolhe o tipo de conta que queres criar
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            variant="outline"
            className="w-full h-auto p-6 flex flex-col items-center gap-3 border-2 hover:border-primary hover:bg-primary/5"
            onClick={() => navigate("/register/parent")}
          >
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-lg">Sou Pai/Encarregado</p>
              <p className="font-body text-sm text-muted-foreground">
                Regista-te para autorizar e acompanhar os teus educandos
              </p>
            </div>
          </Button>

          <Button 
            variant="outline"
            className="w-full h-auto p-6 flex flex-col items-center gap-3 border-2 hover:border-accent hover:bg-accent/5"
            onClick={() => navigate("/register/student")}
          >
            <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-accent" />
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-lg">Sou Aluno</p>
              <p className="font-body text-sm text-muted-foreground">
                O teu encarregado já autorizou o teu email
              </p>
            </div>
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="font-body text-sm text-muted-foreground mb-2">
            Já tens conta?
          </p>
          <Link to="/login">
            <Button variant="link" className="font-body text-primary">
              Entrar na minha conta
            </Button>
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-muted-foreground underline font-body">
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
