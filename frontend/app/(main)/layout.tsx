"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../components/sidebar"; // Importando a Sidebar
import { getCurrentUser, User } from "../../lib/auth"; // Importando funções de autenticação

// Este é o layout para as seções protegidas da aplicação
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  // Usamos um estado para saber se a verificação inicial foi feita
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      // Se não houver usuário no localStorage, redireciona para o login
      router.replace("/login");
    } else {
      // Se houver usuário, permite a renderização do conteúdo
      setIsVerified(true);
    }
  }, [router]);

  // Enquanto a verificação não termina, mostramos uma tela de carregamento
  // Isso evita que a página protegida "pisque" na tela antes do redirecionamento
  if (!isVerified) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }

  // Se o usuário está verificado, renderiza o layout principal
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children} {/* Aqui o conteúdo da página atual (ex: dashboard) será renderizado */}
      </main>
    </div>
  );
}