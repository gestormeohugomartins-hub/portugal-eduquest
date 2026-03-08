import { useState } from "react";
import { Input } from "@/components/ui/input";
import { validatePassword, getPasswordStrength } from "@/lib/passwordValidation";
import { Eye, EyeOff, Check, X } from "lucide-react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showStrength?: boolean;
  id?: string;
}

export const PasswordInput = ({ value, onChange, placeholder = "Mínimo 8 caracteres", showStrength = true, id }: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const { errors } = validatePassword(value);
  const strength = getPasswordStrength(value);

  const rules = [
    { label: "8 caracteres", pass: value.length >= 8 },
    { label: "Maiúscula", pass: /[A-Z]/.test(value) },
    { label: "Minúscula", pass: /[a-z]/.test(value) },
    { label: "Dígito", pass: /[0-9]/.test(value) },
    { label: "Especial (!@#...)", pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(value) },
  ];

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required
          minLength={8}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <>
          {/* Strength bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${strength.color}`}
                style={{ width: `${strength.level}%` }}
              />
            </div>
            <span className="text-[10px] font-body text-muted-foreground">{strength.label}</span>
          </div>

          {/* Rules checklist */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {rules.map(rule => (
              <div key={rule.label} className="flex items-center gap-1">
                {rule.pass ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <X className="w-3 h-3 text-muted-foreground" />
                )}
                <span className={`text-[10px] font-body ${rule.pass ? "text-green-500" : "text-muted-foreground"}`}>
                  {rule.label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
