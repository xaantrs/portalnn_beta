"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      // Se houver um usuário salvo no navegador, vá para o dashboard
      router.replace("/dashboard");
    } else {
      // Caso contrário, vá para a tela de login
      router.replace("/login");
    }
  }, [router]);

  // Este componente não renderiza nada visível,
  // apenas um placeholder enquanto o redirecionamento acontece.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  );
}