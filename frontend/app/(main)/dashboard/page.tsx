"use client";

import { useState, useEffect } from "react";
import { getCurrentUser, User } from "../../../lib/auth";
import { BarChart, Users, ShieldCheck } from "lucide-react";

// Componente para um card de informação
const InfoCard = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: React.ElementType }) => (
  <div className="rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
    <div className="flex flex-col space-y-1.5 p-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h3>
    </div>
    <div className="p-6 pt-0 text-sm text-muted-foreground">
      {children}
    </div>
  </div>
);

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  if (!user) {
    // Mostra um esqueleto/loading enquanto os dados do usuário não carregam
    return (
      <div className="p-8">
        <div className="mb-8 h-16 w-1/3 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8">
      {/* Cabeçalho */}
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Bem-vindo, {user.name}!
        </h1>
        <p className="text-muted-foreground">
          Este é o seu ponto de partida no Portal de Novos Negócios.
        </p>
      </div>

      {/* Grid de Conteúdo */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <InfoCard title="Suas Informações" icon={Users}>
          <div className="space-y-2">
            <p><strong>Nome:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p className="capitalize"><strong>Perfil:</strong> {user.role}</p>
          </div>
        </InfoCard>

        {/* Card Dinâmico baseado no Perfil do Usuário */}
        {user.role === 'analista' && (
          <InfoCard title="Suas Análises" icon={BarChart}>
            <p>Aqui você pode acessar suas ferramentas para:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Consultar terrenos no GeoSampa.</li>
              <li>Gerar quadras e apresentações.</li>
              <li>Visualizar seu histórico de análises.</li>
            </ul>
          </InfoCard>
        )}

        {user.role === 'gerente' && (
          <InfoCard title="Sua Equipe" icon={Users}>
            <p>Como gerente, você pode visualizar o desempenho e as análises dos analistas da sua equipe.</p>
             <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Acompanhar o funil de aquisição.</li>
              <li>Ver relatórios de produtividade.</li>
              <li>Aprovar ou revisar análises.</li>
            </ul>
          </InfoCard>
        )}
        
        {user.role === 'admin' && (
          <InfoCard title="Visão Geral do Sistema" icon={ShieldCheck}>
            <p>Como administrador, você tem acesso total às funcionalidades e configurações do sistema.</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Dashboard com atividades de todos os usuários.</li>
                <li>Gerenciamento de perfis e acessos.</li>
                <li>Configurações gerais do portal.</li>
            </ul>
          </InfoCard>
        )}
      </div>
    </div>
  );
}