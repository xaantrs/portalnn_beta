"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, setCurrentUser, User } from "../lib/auth";
import { Home, LayoutDashboard, Map, BarChart, Users, FileText, LogOut, Building } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Carrega os dados do usuário do localStorage quando o componente é montado no navegador
    setUser(getCurrentUser());
  }, []);

  const handleLogout = async () => {
    try {
      // Chama a API de logout no backend Flask
      await fetch("http://127.0.0.1:5001/api/auth/logout", {
        method: "POST",
        credentials: "include", // Importante para enviar o cookie de sessão
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      // Limpa os dados do usuário do localStorage e redireciona para o login
      setCurrentUser(null);
      router.push("/login");
    }
  };

  const isActive = (path: string) => pathname === path;

  // Renderiza um estado de carregamento enquanto as informações do usuário não estão disponíveis
  if (!user) {
    return (
      <aside className="w-64 flex-shrink-0 bg-card p-4">
        <div className="h-full animate-pulse rounded-md bg-gray-200"></div>
      </aside>
    );
  }

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Building className="h-6 w-6 text-primary" />
          <span className="text-lg">Metrocasa</span>
        </Link>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          <li>
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive("/dashboard")
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Home className="h-4 w-4" />
              <span className="font-medium">Início</span>
            </Link>
          </li>
          <li>
            <Link
              href="/consulta"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive("/consulta")
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Map className="h-4 w-4" />
              <span className="font-medium">Consulta GeoSampa</span>
            </Link>
          </li>
          
          {/* Link visível apenas para Gerentes e Admins */}
          {(user.role === "gerente" || user.role === "admin") && (
            <li>
              <Link
                href="/gerente"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                  isActive("/gerente")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="font-medium">Equipe (Em breve)</span>
              </Link>
            </li>
          )}

          {/* Link visível apenas para Admins */}
           {user.role === 'admin' && (
            <li>
                <Link
                    href="/dashboard-admin"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                        isActive("/dashboard-admin")
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard Admin</span>
                </Link>
            </li>
            )}
        </ul>
      </nav>

      {/* Rodapé da Sidebar com informações do usuário */}
      <div className="mt-auto border-t p-4">
        <div className="mb-4">
          <p className="font-semibold text-foreground">{user.name}</p>
          <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}