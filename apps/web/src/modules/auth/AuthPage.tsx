import { LoginBodySchema, type LoginInput } from "@devnote/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, KeyRound, Mail, ShieldCheck, Terminal, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { loginUser, registerUser } from "./auth.api";

type AuthMode = "login" | "register";

const RegisterFormSchema = z
  .object({
    name: z.string().trim().min(2, "Informe pelo menos 2 caracteres").max(120, "Nome muito longo"),
    email: z.string().email("Email invalido"),
    password: z
      .string()
      .min(8, "Senha precisa de pelo menos 8 caracteres")
      .max(128, "Senha muito longa"),
    confirmPassword: z.string().min(1, "Confirmacao de senha obrigatoria"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof RegisterFormSchema>;

export interface UserSession {
  id?: string;
  name?: string | null;
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

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(LoginBodySchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setApiError(null);
    setSuccessMessage(null);
    loginForm.reset();
    registerForm.reset();
  };

  const onLoginSubmit = async (values: LoginInput) => {
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      const response = await loginUser(values);
      const user = response.user ?? {
        email: values.email,
        id: response.id,
        name: response.name ?? null,
      };
      setSuccessMessage("Acesso autorizado! Redirecionando para o workspace...");

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

  const onRegisterSubmit = async (values: RegisterFormData) => {
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      const response = await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      setSuccessMessage("Conta criada com sucesso! Redirecionando para seu workspace...");

      try {
        const loginRes = await loginUser({
          email: values.email,
          password: values.password,
        });

        const user = loginRes.user ?? {
          id: response.id,
          name: values.name,
          email: values.email,
        };

        if (loginRes.accessToken) {
          localStorage.setItem("devnote_access_token", loginRes.accessToken);
        }

        localStorage.setItem("devnote_user", JSON.stringify(user));
        setTimeout(() => {
          onSuccess?.(user);
        }, 500);
      } catch {
        const user = {
          id: response.id,
          name: values.name,
          email: values.email,
        };

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
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-background antialiased">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1e2330_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-[420px] border-border bg-card/95 shadow-2xl backdrop-blur-md">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex items-center space-x-2.5 pb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary shadow-sm">
                <Terminal className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">DevNote</span>
            </div>

            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                {mode === "login" ? "Entrar na sua conta" : "Criar nova conta"}
              </CardTitle>
              <CardDescription className="pt-1">
                {mode === "login"
                  ? "Acesse sua base de conhecimento, snippets e notas sincronizadas."
                  : "Crie seu workspace de desenvolvedor para organizar suas solucoes."}
              </CardDescription>
            </div>

            <div className="grid grid-cols-2 gap-1 rounded-md border border-border/60 bg-input p-1">
              <button
                type="button"
                onClick={() => handleModeChange("login")}
                className={`cursor-pointer select-none rounded py-1.5 text-xs font-medium transition-all ${
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
                className={`cursor-pointer select-none rounded py-1.5 text-xs font-medium transition-all ${
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
            {apiError && (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <span className="font-mono font-bold">!</span>
                <span className="flex-1">{apiError}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                <span className="font-mono font-bold">OK</span>
                <span className="flex-1">{successMessage}</span>
              </div>
            )}

            {mode === "login" && (
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-email"
                    className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground"
                  >
                    <span>E-mail</span>
                    <span className="text-[10px] text-muted-foreground/60">obrigatorio</span>
                  </label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="dev@exemplo.com"
                    autoComplete="email"
                    leftIcon={<Mail className="h-4 w-4" />}
                    error={loginForm.formState.errors.email?.message}
                    {...loginForm.register("email")}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="login-password"
                    className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground"
                  >
                    <span>Senha</span>
                  </label>
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    leftIcon={<KeyRound className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="cursor-pointer text-muted-foreground hover:text-foreground focus:outline-none"
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

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="mt-2 flex h-10 w-full items-center justify-center gap-2 text-sm font-semibold tracking-wide"
                >
                  <span>Acessar Workspace</span>
                  <span className="text-xs font-mono opacity-80">Enter</span>
                </Button>
              </form>
            )}

            {mode === "register" && (
              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="register-name"
                    className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground"
                  >
                    <span>Nome</span>
                    <span className="text-[10px] text-muted-foreground/60">obrigatorio</span>
                  </label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Como devemos te chamar?"
                    autoComplete="name"
                    leftIcon={<User className="h-4 w-4" />}
                    error={registerForm.formState.errors.name?.message}
                    {...registerForm.register("name")}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="register-email"
                    className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground"
                  >
                    <span>E-mail</span>
                    <span className="text-[10px] text-muted-foreground/60">obrigatorio</span>
                  </label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="dev@exemplo.com"
                    autoComplete="email"
                    leftIcon={<Mail className="h-4 w-4" />}
                    error={registerForm.formState.errors.email?.message}
                    {...registerForm.register("email")}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="register-password"
                    className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground"
                  >
                    <span>Senha</span>
                    <span className="text-[10px] text-muted-foreground/60">min. 8 caracteres</span>
                  </label>
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Crie uma senha forte"
                    autoComplete="new-password"
                    leftIcon={<KeyRound className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="cursor-pointer text-muted-foreground hover:text-foreground focus:outline-none"
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

                <div className="space-y-1.5">
                  <label
                    htmlFor="register-confirm-password"
                    className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground"
                  >
                    <span>Confirmar Senha</span>
                    <span className="text-[10px] text-muted-foreground/60">obrigatorio</span>
                  </label>
                  <Input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita sua senha"
                    autoComplete="new-password"
                    leftIcon={<KeyRound className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="cursor-pointer text-muted-foreground hover:text-foreground focus:outline-none"
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

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="mt-2 flex h-10 w-full items-center justify-center gap-2 text-sm font-semibold tracking-wide"
                >
                  <span>Criar Minha Conta</span>
                  <span className="text-xs font-mono opacity-80">Enter</span>
                </Button>
              </form>
            )}

            <div className="mt-5 border-t border-border/40 pt-4 text-center">
              {mode === "login" ? (
                <button
                  type="button"
                  onClick={() => handleModeChange("register")}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span>Nao possui conta?</span>
                  <span className="flex items-center gap-0.5 font-medium text-primary">
                    Criar nova conta <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleModeChange("login")}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span>Ja possui conta?</span>
                  <span className="flex items-center gap-0.5 font-medium text-primary">
                    Fazer login <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="relative z-10 flex w-full items-center justify-between border-t border-border/40 bg-background/50 px-6 py-3 text-[11px] font-mono text-muted-foreground/70 backdrop-blur-sm">
        <span>DevNote - Local-first Architecture</span>
        <div className="flex items-center space-x-1.5 text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>E2E Encrypted</span>
        </div>
      </footer>
    </div>
  );
}
