import { useState } from "react";
import { AuthPage, type UserSession } from "./modules/auth/AuthPage";
import { HomePage } from "./modules/home/HomePage";

export default function App() {
  // Inicializa o estado lendo a sessão salva no localStorage
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem("devnote_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Callback de sucesso da autenticação (login ou registro)
  const handleAuthSuccess = (authenticatedUser: UserSession) => {
    setUser(authenticatedUser);
  };

  // Encerra a sessão e retorna para a tela de autenticação
  const handleLogout = () => {
    localStorage.removeItem("devnote_access_token");
    localStorage.removeItem("devnote_user");
    setUser(null);
  };

  // Redirecionamento condicional: se logado, exibe o Workspace (Home)
  if (user) {
    return <HomePage user={user} onLogout={handleLogout} />;
  }

  // Se não autenticado, exibe a tela de login/cadastro
  return <AuthPage onSuccess={handleAuthSuccess} />;
}
