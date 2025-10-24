"use client"; // Diretiva que informa ao Next.js que este é um componente de cliente (interativo)

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setCurrentUser } from "../../../lib/auth"; // Importaremos a função para salvar o usuário no navegador
import type { User } from "../../../lib/auth"; // E o tipo 'User'

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Previne o recarregamento padrão da página ao submeter o formulário
    setError("");
    setLoading(true);

    try {
      // Faz a chamada de API para o backend Flask que criamos
      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Se o login for bem-sucedido, salva os dados do usuário no localStorage do navegador
        setCurrentUser(data.user as User);
        // Redireciona para o dashboard principal
        router.push("/dashboard");
      } else {
        setError(data.message || "Email ou senha incorretos.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("Não foi possível conectar ao servidor. Verifique se a API está rodando.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Lado Esquerdo - Formulário */}
        <div className="w-full p-8 md:w-1/2 lg:p-12">
          <h1 className="text-2xl font-bold text-gray-800">Portal de Novos Negócios</h1>
          <p className="mt-2 text-gray-600">Bem-vindo! Faça login para continuar.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-center text-sm text-red-700">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="seu.email@metrocasa.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
                required
                autoComplete="current-password" /* <-- CORREÇÃO ADICIONADA AQUI */
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
            
            <div className="text-center">
              <a href="#" className="text-sm text-primary hover:text-primary-dark">
                Esqueceu sua senha?
              </a>
            </div>
          </form>
        </div>

        {/* Lado Direito - Imagem/Branding */}
        <div className="hidden items-center justify-center bg-primary p-12 md:flex md:w-1/2">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold">METROCASA</h2>
            <p className="mt-2 opacity-90">
              Análise de terrenos e geração de relatórios estratégicos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}