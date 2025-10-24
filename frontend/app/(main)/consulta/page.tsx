"use client";

import dynamic from "next/dynamic";
import { Sidebar } from "../../../components/sidebar"; // Importando a Sidebar

// O Leaflet manipula o DOM diretamente, o que pode entrar em conflito com a renderização
// no lado do servidor (SSR) do Next.js. O 'dynamic' import com 'ssr: false' garante
// que o componente do mapa só será carregado no navegador do cliente.
const GeoSampaMap = dynamic(
  () => import("../../../components/geosampa_map"),
  {
    ssr: false, // Desabilita a renderização no servidor para este componente
    loading: () => (
      <div className="flex h-full items-center justify-center bg-gray-100">
        <p className="text-gray-600">Carregando mapa...</p>
      </div>
    ),
  }
);

export default function ConsultaPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Cabeçalho da Página */}
      <header className="border-b bg-card px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">
          Consulta Automática GeoSampa
        </h1>
      </header>

      {/* Wrapper para o conteúdo principal */}
      <div className="flex-1 overflow-hidden">
        <GeoSampaMap />
      </div>
    </div>
  );
}