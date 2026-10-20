import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Terminal,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  LoginBodySchema,
  type LoginInput,
} from "@devnote/contracts";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { loginUser, registerUser } from "./auth.api";

type AuthMode = "login" | "register";

// Schema de registro com validação de confirmação de senha
const RegisterFormSchema = z
  .object({
    email: z.string().email("Email inválido"),
    password: z
      .string()
      .min(8, "Senha precisa de pelo menos 8 caracteres")
      .max(128, "Senha muito longa"),
    confirmPassword: z.string().min(1, "Confirmação de senha obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof RegisterFormSchema>;

export interface UserSession {
  id?: string;
  email: string;
}

interface AuthPageProps {
  onSuccess?: (user: UserSession) => void;
}

export function AuthPage({ onSuccess }: AuthPageProps = {}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Formulário de Login
  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(LoginBodySchema),
    defaultValues: { email: "", password: "" },
  });

  // Formulário de Cadastro (com confirmação de senha)
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  // Alterna entre login e cadastro limpando mensagens e campos
  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setApiError(null);
    setSuccessMessage(null);
    loginForm.reset();
    registerForm.reset();
  };

  // Submissão do formulário de login
  const onLoginSubmit = async (values: LoginInput) => {
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      const response = await loginUser(values);
      const user = response.user ?? { email: values.email, id: response.id };
      setSuccessMessage(`Acesso autorizado! Redirecionando para o workspace...`);
      if (response.accessToken) {
        localStorage.setItem("devnote_access_token", response.accessToken);
      }
      localStorage.setItem("devnote_user", JSON.stringify(user));
      setTimeout(() => {
        onSuccess?.(user);
      }, 500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao realizar login";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submissão do formulário de cadastro
  const onRegisterSubmit = async (values: RegisterFormData) => {
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      const response = await registerUser({
        email: values.email,
        password: values.password,
      });
      setSuccessMessage("Conta criada com sucesso! Redirecionando para seu workspace...");
      try {
        const loginRes = await loginUser({
          email: values.email,
          password: values.password,
        });
        const user = loginRes.user ?? { email: values.email, id: response.id };
        if (loginRes.accessToken) {
          localStorage.setItem("devnote_access_token", loginRes.accessToken);
        }
        localStorage.setItem("devnote_user", JSON.stringify(user));
        setTimeout(() => {
          onSuccess?.(user);
        }, 500);
      } catch {
        const user = { email: values.email, id: response.id };
        localStorage.setItem("devnote_user", JSON.stringify(user));
        setTimeout(() => {
          onSuccess?.(user);
        }, 600);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao cadastrar";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background flex flex-col justify-between overflow-hidden antialiased">
      {/* Grade técnica de fundo sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e2330_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Conteúdo Central */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-[420px] border-border bg-card/95 backdrop-blur-md shadow-2xl">
          <CardHeader className="space-y-3 pb-4">
            {/* Título da aplicação no cabeçalho do formulário */}
            <div className="flex items-center space-x-2.5 pb-1">
              <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                <Terminal className="h-4 w-4" />
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground">
                DevNote
              </span>
            </div>

            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                {mode === "login" ? "Entrar na sua conta" : "Criar nova conta"}
              </CardTitle>
              <CardDescription className="pt-1">
                {mode === "login"
                  ? "Acesse sua base de conhecimento, snippets e notas sincronizadas."
                  : "Crie seu workspace de desenvolvedor para organizar suas soluções."}
              </CardDescription>
            </div>

            {/* Alternador de Modo (Abas Login / Cadastro) */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-input rounded-md border border-border/60">
              <button
                type="button"
                onClick={() => handleModeChange("login")}
                className={`py-1.5 text-xs font-medium rounded transition-all cursor-pointer select-none ${
                  mode === "login"
                    ? "bg-white/10 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("register")}
                className={`py-1.5 text-xs font-medium rounded transition-all cursor-pointer select-none ${
                  mode === "register"
                    ? "bg-white/10 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Cadastrar
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            {/* Mensagem de Erro da API */}
            {apiError && (
              <div className="mb-4 p-3 rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
                <span className="font-mono font-bold">!</span>
                <span className="flex-1">{apiError}</span>
              </div>
            )}

            {/* Mensagem de Sucesso */}
            {successMessage && (
              <div className="mb-4 p-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs flex items-start gap-2">
                <span className="font-mono font-bold">✓</span>
                <span className="flex-1">{successMessage}</span>
              </div>
            )}

            {/* Formulário de Login */}
            {mode === "login" && (
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-4"
                noValidate
              >
                {/* E-mail */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase flex items-center justify-between">
                    <span>E-mail</span>
                    <span className="text-[10px] text-muted-foreground/60">obrigatório</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="dev@exemplo.com"
                    autoComplete="email"
                    leftIcon={<Mail className="h-4 w-4" />}
                    error={loginForm.formState.errors.email?.message}
                    {...loginForm.register("email")}
                  />
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase flex items-center justify-between">
                    <span>Senha</span>
                  </label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    leftIcon={<KeyRound className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                        tabIndex={-1}
                        title={showPassword ? "Ocultar senha" : "Ver senha"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                    error={loginForm.formState.errors.password?.message}
                    {...loginForm.register("password")}
                  />
                </div>

                {/* Botão de Envio Login */}
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="w-full mt-2 h-10 text-sm font-semibold tracking-wide flex items-center justify-center gap-2"
                >
                  <span>Acessar Workspace</span>
                  <span className="text-xs font-mono opacity-80">↵</span>
                </Button>
              </form>
            )}

            {/* Formulário de Cadastro */}
            {mode === "register" && (
              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-4"
                noValidate
              >
                {/* E-mail */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase flex items-center justify-between">
                    <span>E-mail</span>
                    <span className="text-[10px] text-muted-foreground/60">obrigatório</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="dev@exemplo.com"
                    autoComplete="email"
                    leftIcon={<Mail className="h-4 w-4" />}
                    error={registerForm.formState.errors.email?.message}
                    {...registerForm.register("email")}
                  />
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase flex items-center justify-between">
                    <span>Senha</span>
                    <span className="text-[10px] text-muted-foreground/60">mín. 8 caracteres</span>
                  </label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Crie uma senha forte"
                    autoComplete="new-password"
                    leftIcon={<KeyRound className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                        tabIndex={-1}
                        title={showPassword ? "Ocultar senha" : "Ver senha"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                    error={registerForm.formState.errors.password?.message}
                    {...registerForm.register("password")}
                  />
                </div>

                {/* Confirmação de Senha */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase flex items-center justify-between">
                    <span>Confirmar Senha</span>
                    <span className="text-[10px] text-muted-foreground/60">obrigatório</span>
                  </label>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita sua senha"
                    autoComplete="new-password"
                    leftIcon={<KeyRound className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                        tabIndex={-1}
                        title={showConfirmPassword ? "Ocultar senha" : "Ver senha"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                    error={registerForm.formState.errors.confirmPassword?.message}
                    {...registerForm.register("confirmPassword")}
                  />
                </div>

                {/* Botão de Envio Cadastro */}
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="w-full mt-2 h-10 text-sm font-semibold tracking-wide flex items-center justify-center gap-2"
                >
                  <span>Criar Minha Conta</span>
                  <span className="text-xs font-mono opacity-80">↵</span>
                </Button>
              </form>
            )}

            {/* Alternador em rodapé do Card */}
            <div className="mt-5 pt-4 border-t border-border/40 text-center">
              {mode === "login" ? (
                <button
                  type="button"
                  onClick={() => handleModeChange("register")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Não possui conta?</span>
                  <span className="text-primary font-medium flex items-center gap-0.5">
                    Criar nova conta <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleModeChange("login")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Já possui conta?</span>
                  <span className="text-primary font-medium flex items-center gap-0.5">
                    Fazer login <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer Inferior Limpo */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-border/40 flex items-center justify-between text-[11px] font-mono text-muted-foreground/70 bg-background/50 backdrop-blur-sm">
        <span>DevNote • Local-first Architecture</span>
        <div className="flex items-center space-x-1.5 text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>E2E Encrypted</span>
        </div>
      </footer>
    </div>
  );
}