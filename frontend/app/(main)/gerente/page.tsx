"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, User } from "../../../lib/auth";
import { BarChart2, Briefcase, Percent, UserCheck } from "lucide-react";

// Dados de exemplo, como no seu arquivo original. No futuro, viriam de uma API.
const mockKPIs = {
  lotesEmAnalise: 47,
  areaTotalMapeada: 125340,
  taxaConversao: 68,
};

const mockFunil = [
  { etapa: "Lotes Mapeados", valor: 150, cor: "bg-blue-500" },
  { etapa: "Em Análise", valor: 47, cor: "bg-yellow-500" },
  { etapa: "Aprovados", valor: 32, cor: "bg-green-500" },
  { etapa: "Adquiridos", valor: 12, cor: "bg-primary" },
];

const mockAnalistas = [
  { nome: "XXX", lotesAnalisados: 12, areaMapeada: 28450 },
];

// Componente reutilizável para os cards de KPI
const KpiCard = ({ title, value, icon: Icon, subtext }: { title: string; value: string | number; icon: React.ElementType; subtext?: string }) => (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium tracking-tight">{title}</h3>
            <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="p-6 pt-0">
            <div className="text-3xl font-bold">{value}</div>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </div>
    </div>
);


export default function GerentePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    // Proteção de rota: verifica se há um usuário e se ele é gerente ou admin
    if (!currentUser || (currentUser.role !== "gerente" && currentUser.role !== "admin")) {
      router.replace("/dashboard"); // Redireciona para o dashboard se não tiver permissão
    } else {
      setUser(currentUser);
    }
  }, [router]);

  // Exibe um estado de carregamento enquanto verifica a permissão
  if (!user) {
    return <div className="p-8">Carregando dados do gerente...</div>;
  }

  return (
    <div className="flex-1 space-y-8 p-8">
      {/* Cabeçalho */}
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Gerencial</h1>
        <p className="text-muted-foreground">Visão geral do desempenho da equipe de Novos Negócios.</p>
      </div>

      {/* Seção do Funil e Desempenho */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Funil de Aquisição */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Funil de Aquisição (Em breve)</h3>
            <div className="space-y-4">
                {mockFunil.map((item) => {
                    const larguraPercentual = (item.valor / mockFunil[0].valor) * 100;
                    return (
                        <div key={item.etapa}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">{item.etapa}</span>
                                <span className="text-muted-foreground">{item.valor}</span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-muted">
                                <div className={`${item.cor} h-3 rounded-full`} style={{ width: `${larguraPercentual}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Desempenho por Analista */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Desempenho por Analista (Em breve)</h3>
            <ul className="space-y-4">
                {mockAnalistas.map((analista) => (
                    <li key={analista.nome} className="flex items-center">
                        <UserCheck className="h-5 w-5 text-green-500 mr-4" />
                        <div className="flex-1">
                            <p className="font-medium">{analista.nome}</p>
                            <p className="text-xs text-muted-foreground">{analista.lotesAnalisados} lotes analisados</p>
                        </div>
                        <span className="text-sm font-semibold">{analista.areaMapeada.toLocaleString("pt-BR")} m²</span>
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
}