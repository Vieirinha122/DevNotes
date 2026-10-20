import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ConfirmDialog } from "./components/ui/confirm-dialog";
import { AuthPage, type UserSession } from "./modules/auth/AuthPage";
import { logoutUser } from "./modules/auth/auth.api";
import { HomePage } from "./modules/home/HomePage";

export default function App() {
  const queryClient = useQueryClient();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem("devnote_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleAuthSuccess = (authenticatedUser: UserSession) => {
    setUser(authenticatedUser);
  };

  const executeLogout = () => {
    void logoutUser();
    localStorage.removeItem("devnote_access_token");
    localStorage.removeItem("devnote_user");
    queryClient.clear();
    setIsLogoutDialogOpen(false);
    setUser(null);
  };

  if (user) {
    return (
      <>
        <HomePage user={user} onLogout={() => setIsLogoutDialogOpen(true)} />
        <ConfirmDialog
          open={isLogoutDialogOpen}
          title="Sair da aplicacao"
          description="Deseja encerrar sua sessao agora?"
          confirmLabel="Sair"
          cancelLabel="Continuar"
          onCancel={() => setIsLogoutDialogOpen(false)}
          onConfirm={executeLogout}
        />
      </>
    );
  }

  return <AuthPage onSuccess={handleAuthSuccess} />;
}
