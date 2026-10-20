import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AuthPage, type UserSession } from "./modules/auth/AuthPage";
import { logoutUser } from "./modules/auth/auth.api";
import { HomePage } from "./modules/home/HomePage";

export default function App() {
  const queryClient = useQueryClient();
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

  const handleLogout = () => {
    void logoutUser();
    localStorage.removeItem("devnote_access_token");
    localStorage.removeItem("devnote_user");
    queryClient.clear();
    setUser(null);
  };

  if (user) {
    return <HomePage user={user} onLogout={handleLogout} />;
  }

  return <AuthPage onSuccess={handleAuthSuccess} />;
}
