"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Script from "next/script";
import { PlusCircle, FileDown, Loader2 } from "lucide-react";
import clsx from "clsx";
import { generatePresentation } from '../utils/pptxGenerator';

// --- Tipagem para os objetos que agora estarão no 'window' ---
declare global {
  interface Window {
    L: any;
    PptxGenJS: any;
    leafletImage: any;
  }
}

const DICIONARIO_CA: Record<string, { ca: number; divisor: number }> = {
  "ZEU":     { ca: 6.40, divisor: 32 },
  "ZEUa":    { ca: 3.40, divisor: 25 },
  "ZEUP":    { ca: 3.40, divisor: 25 },
  "ZEUPa":   { ca: 1.90, divisor: 25 },
  "ZEM":     { ca: 3.40, divisor: 25 },
  "ZEMP":    { ca: 3.40, divisor: 25 },
  "ZC":      { ca: 3.40, divisor: 25 },
  "ZCa":     { ca: 1.90, divisor: 25 },
  "ZC-ZEIS": { ca: 3.40, divisor: 25 },
  "ZCOR-2":  { ca: 1.90, divisor: 25 },
  "ZCOR-3":  { ca: 1.90, divisor: 25 },
  "ZCORa":   { ca: 1.90, divisor: 25 },
  "ZM":      { ca: 3.40, divisor: 25 },
  "ZMa":     { ca: 1.90, divisor: 25 },
  "ZMIS":    { ca: 3.40, divisor: 25 },
  "ZMISa":   { ca: 1.90, divisor: 25 },
  "ZEIS-1":  { ca: 2.90, divisor: 25 },
  "ZEIS-2":  { ca: 4.40, divisor: 32 },
  "ZEIS-3":  { ca: 4.40, divisor: 32 },
  "ZEIS-4":  { ca: 2.40, divisor: 25 },
  "ZEIS-5":  { ca: 4.40, divisor: 32 },
  "ZDE-1":   { ca: 3.40, divisor: 25 },
  "ZDE-2":   { ca: 3.40, divisor: 25 },
  "ZPI-1":   { ca: 2.65, divisor: 25 },
  "ZPI-2":   { ca: 2.65, divisor: 25 },
};

// --- Interfaces para estruturar nossos dados ---
interface Lote {
  iptu: string;
  setor: string;
  quadra: string;
  lote: string;
  area: number;
  endereco: string;
  dadosCompletos: any;
  distrito?: string;
  zoneamento?: string;
  larguraCalcada?: string;
  unidadeGeotecnica?: string;
}

interface CondicaoComercial {
  iptu: string;
  m2: number;
  valor: number;
  aluguel: number;
  permutaLoja: number;
  permutaApto: number;
  unidadesGeradas: number;
  condicaoTexto: string;
  situacao: string;
  zoneamento?: string;
  ca: number;
  divisor: number;
}

// Função para capitalizar a primeira letra

const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function GeoSampaMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const highlightLayerRef = useRef<any>(null);
  const overlayLayersRef = useRef<Record<string, any>>({});
  const tempHighlightLayerRef = useRef<any>(null);
  const tempHighlightSourceNameRef = useRef<string | null>(null);
  const canvasRendererRef = useRef<any>(null);
  
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [tipoConsulta, setTipoConsulta] = useState("unico");
  const [form, setForm] = useState({ setor: "", quadra: "", lote: "", listaIptus: "", setorFaixa: "", quadraFaixa: "", loteInicio: "", loteFim: "", rua: ""});
  const [lotePrincipal, setLotePrincipal] = useState<Lote | null>(null);
  const [lotesAdicionais, setLotesAdicionais] = useState<Lote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Nenhum lote selecionado.");
  const [searchResults, setSearchResults] = useState<{ id: string; nome: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resumo, setResumo] = useState("Nenhum lote selecionado.");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [condicoes, setCondicoes] = useState<CondicaoComercial[]>([]);
  const [corretor, setCorretor] = useState("");
  const [codigo, setCodigo] = useState<number | string>("");
  const [loja, setLoja] = useState<number | string>("3000");
  const [apto, setApto] = useState<number | string>("4300");  
  const [analista, setAnalista] = useState("N/I");
  const [gerente, setGerente] = useState("N/I");
  const [isAuthLoading, setIsAuthLoading] = useState(true);

useEffect(() => {
    async function fetchUserData() {
      try {
        // Use o mesmo padrão de API que você usou em 'handleConsultar'
        // Se sua API Flask está em '/api/auth/me', use isso.
        // Se 'consulta-sql' está em '/api/consulta-sql', 'me' deve estar em '/api/auth/me'
        const response = await fetch('/api/auth/me'); // <-- CONFIRME ESTE PATH
        
        if (response.ok) {
          const data = await response.json();
          if (data.isLoggedIn && data.user) {
            setAnalista(data.user.name || "N/I");
            // 'manager_name' agora vem do backend!
            setGerente(data.user.manager_name || "N/I");
          }
        } else {
          console.warn("Usuário não está logado.");
          // Se não estiver logado, os nomes ficam "N/I"
        }
      } catch (err) {
        console.error("Erro ao buscar dados do usuário:", err);
        // Deixa "N/I" em caso de erro de rede
      } finally {
        setIsAuthLoading(false); // Terminou de carregar
      }
    }
    
    fetchUserData();
  }, []); // [] = Roda apenas uma vez quando o componente monta

  const isOverlayActive = (layerName: string): boolean => {
    const map = mapInstanceRef.current;
    const layer = overlayLayersRef.current[layerName];
    return map && layer && map.hasLayer(layer);
  };

  // Helper (pode estar aqui ou no pptxGenerator)
  const base64Parser = (dataURL: string | null | undefined): string | null => {
      if (typeof dataURL !== 'string' || !dataURL.startsWith('data:image')) return null;
      return dataURL.replace(/^data:image\/(png|jpg|jpeg|svg|svg\+xml);base64,/, "");
  };

  // Helper para buscar imagem do mapa
  const getMapImageAsBase64 = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const map = mapInstanceRef.current;
      if (!map || !window.leafletImage) {
        return reject(new Error("Mapa ou plugin leafletImage não está pronto."));
      }
      window.leafletImage(map, (err: any, canvas: HTMLCanvasElement) => {
        if (err) {
          console.error("leafletImage error:", err);
          return reject(new Error("Não foi possível capturar a imagem do mapa."));
        }
        try {
            // 1. Get the image data URL from the canvas
            const dataUrl = canvas.toDataURL('image/png');

            // --- CORREÇÃO AQUI ---
            // 2. Define the 'base64' variable by calling base64Parser
            const base64 = base64Parser(dataUrl);
            // --- FIM DA CORREÇÃO ---

            // 3. Check if base64Parser returned a valid string
            if (!base64) {
              return reject(new Error("A imagem do mapa foi gerada em branco ou erro na conversão para Base64."));
            }

            // 4. Now 'base64' is defined, so you can resolve the promise with it
            resolve(base64);

        } catch (canvasError: any) {
             console.error("canvas.toDataURL error:", canvasError);
             reject(new Error(`Erro ao processar imagem do mapa: ${canvasError.message}. Pode ser CORS.`));
        }
      });
    });
  };

  // --- FUNÇÃO PARA LIDAR COM O CLIQUE NO MAPA (VERSÃO ATUALIZADA) ---
const handleMapClick = useCallback(async (e: any) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // --- Limpa o destaque temporário anterior ---
    if (tempHighlightLayerRef.current) {
        map.removeLayer(tempHighlightLayerRef.current);
        tempHighlightLayerRef.current = null;
    }
    tempHighlightSourceNameRef.current = null; // Limpa o nome também

    // Lógica opcional para exigir consulta antes do clique para identificar camadas
    // Descomente se necessário
    // if (!lotePrincipal && lotesAdicionais.length === 0) {
    //     alert("Consulte um lote antes de identificar camadas pelo mapa.");
    //     return;
    // }

    const latlng = e.latlng;
    const popup = window.L.popup({ minWidth: 280, maxWidth: 350 })
        .setLatLng(latlng)
        .setContent("Buscando informações...")
        .openOn(map);

    // --- Funções Auxiliares (INTERNAS ao useCallback) ---
    const getFeatureInfoUrl = (layers: string) => {
        const point = map.latLngToContainerPoint(latlng, map.getZoom());
        const size = map.getSize();
        const params = {
            request: 'GetFeatureInfo', service: 'WMS', srs: 'EPSG:4326', version: '1.1.1',
            format: 'image/png', bbox: map.getBounds().toBBoxString(), height: size.y,
            width: size.x, layers: layers, query_layers: layers, info_format: 'application/json',
            x: Math.round(point.x), y: Math.round(point.y)
        };
        const wmsUrl = "https://wms.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wms";
        return wmsUrl + window.L.Util.getParamString(params, wmsUrl, true);
    };

    const createHighlightAndCleanup = (feature: any, sourceLayerName: string) => {
        if (feature.geometry) {
            tempHighlightLayerRef.current = window.L.geoJSON(feature, {
                style: { color: "#007bff", weight: 4, opacity: 0.8, fillOpacity: 0.3 }
            }).addTo(map);

            // Guarda o nome da camada que criou este highlight
            tempHighlightSourceNameRef.current = sourceLayerName; // <-- Guarda o nome

            popup.on('remove', () => { // Limpa ao fechar popup
                if (tempHighlightLayerRef.current) {
                    map.removeLayer(tempHighlightLayerRef.current);
                    tempHighlightLayerRef.current = null;
                }
                tempHighlightSourceNameRef.current = null; // Limpa o nome também
            });
        }
    };

    const addDebugButtonListener = (element: HTMLElement, data: any) => {
        element.querySelector('#btn-debug-info')?.addEventListener('click', (event) => {
            event.preventDefault();
            const debugJsonString = JSON.stringify(data, null, 2);
            const newWindow = window.open("", "_blank");
            if (newWindow) {
                newWindow.document.write(`<pre style="word-break: break-all; white-space: pre-wrap;">${debugJsonString}</pre>`);
                newWindow.document.close(); newWindow.focus();
            } else { alert("Não foi possível abrir a nova janela. Verifique seu bloqueador de pop-ups."); }
        });
    };

    const createGenericPopup = (title: string, properties: Record<string, any>, data: any, feature: any) => {
        createHighlightAndCleanup(feature, title); // Passa o nome da camada (title)
        const content = document.createElement('div');
        content.className = "text-sm";
        content.style.fontFamily = "'Inter', sans-serif";
        let innerHTML = `<div style="font-size: 1.1em; font-weight: 600; color: #333;">${title}</div><hr class="my-2">`;
        for (const key in properties) {
            let value = properties[key];
             if (value === null || value === undefined) value = 'N/I'; // Handle null/undefined
            else if (typeof value === 'number') {
                if (key.toLowerCase().includes('area')) value = value.toFixed(2) + ' m²';
                 else if (key.toLowerCase().includes('largura')) value = value.toFixed(2) + 'm';
                 else if (key.toLowerCase().includes('decliv')) value = value.toFixed(2) + '%'; // Usa 'decliv' para abranger os nomes
                 else value = value.toLocaleString('pt-BR');
            }
             else {
                 value = String(value); // Garante que é string
             }
            innerHTML += `<p class="m-0"><strong>${key}:</strong> ${value}</p>`;
        }
        innerHTML += `<div class="mt-2 text-xs"><a href="#" id="btn-debug-info" style="color: #007bff; text-decoration: underline;">Abrir dados brutos em nova aba</a></div>`;
        content.innerHTML = innerHTML;
        addDebugButtonListener(content, data);
        popup.setContent(content);
    };


    try {
        // --- LÓGICA DE PRIORIDADE ---
        let foundFeature = false;

        // 1. Ordem de prioridade das overlays
        const overlayOrder: Array<{ name: string; wmsLayer: string; formatPopup: (props: any) => Record<string, any> }> = [
            { name: "Zoneamento", wmsLayer: "geoportal:perimetro_zona_lei_18177_24", formatPopup: props => ({ "Zoneamento": props.cd_zoneamento_perimetro }) },
            { name: "Infraestrutura Urbana", wmsLayer: "geoportal:geoconvias_lei_melhoramento_vigente", formatPopup: props => ({ "Tipo": props.tx_descricao_tipo_melhoramento, "Lei": props.cd_numero_lei_vigente, "Ano": props.an_lei_melhoramento_vigente }) },
            { name: "Faixa Não Edificavel", wmsLayer: "geoportal:geoconvias_faixa_nao_edificavel", formatPopup: props => ({ "Observação": props.tx_obs, "Área": props.qt_area }) },
            { name: "Área Contaminada", wmsLayer: "geoportal:GEOSAMPA_area_contaminada_sigac", formatPopup: props => ({ "Situação": props.dc_tipo_situacao, "Atividade": props.dc_atividade, "Tipo de Requisição": props.dc_tipo_requisicao, "Data do Processo": props.dt_atualizacao_processo }) },
            { name: "Cobertura Vegetal", wmsLayer: "geoportal:cobertura_vegetal", formatPopup: props => ({ "Tipo": props.tx_descricao_categoria_subcategoria, "Categoria": props.cd_categoria_vegetacao }) },
            { name: "Tombamento", wmsLayer: "geoportal:patrimonio_cultural_bairro_ambiental,geoportal:patrimonio_cultural_bem_tombado,geoportal:patrimonio_cultural_lugar_paisagistico_ambiental,geoportal:patrimonio_cultural_area_envoltoria_CONPRESP,geoportal:patrimonio_cultural_area_envoltoria_CONDEPHAAT,geoportal:patrimonio_cultural_area_envoltoria_IPHAN,geoportal:patrimonio_cultural_acervo_tombado", formatPopup: props => ({ "Dados": "Em breve"}) },
            { name: "Unidade GeoTecnica", wmsLayer: "geoportal:carta_geotecnica", formatPopup: props => ({ "Unidade": props.tx_unidade_geotecnica, "Descrição": props.ds_unidade }) },
            { name: "Calçada", wmsLayer: "geoportal:calcada", formatPopup: props => ({
                "Largura Mín": props.qt_largura_minima_trecho,
                "Largura Máx": props.qt_largura_maxima_trecho,
                "Largura Média": props.qt_largura_media_trecho,
                "Decliv. Mín": props.pc_declividade_minima_trecho ?? props.qt_declividade_minima,
                "Decliv. Máx": props.pc_declividade_maxima_trecho ?? props.qt_declividade_maxima,
                "Decliv. Média": props.pc_declividade_media_trecho ?? props.qt_declividade_media
             }) },
        ];

        // 2. Loop pelas overlays
        for (const overlay of overlayOrder) {
            if (isOverlayActive(overlay.name)) {
                console.log("Verificando camada ativa:", overlay.name);
                try {
                    const layerUrl = getFeatureInfoUrl(overlay.wmsLayer);
                    const response = await fetch(layerUrl);
                    if (!response.ok) {
                        console.warn(`Camada ${overlay.name} retornou erro ${response.status}`);
                        continue; // Tenta a próxima camada se esta falhar
                    }
                    const data = await response.json();

                    if (data.features && data.features.length > 0) {
                        const feature = data.features[0];
                        const props = feature.properties;
                        const popupProps = overlay.formatPopup(props);
                        createGenericPopup(overlay.name, popupProps, data, feature);
                        foundFeature = true;
                        break; // Para o loop
                    }
                } catch (layerErr) {
                   console.error(`Erro ao buscar camada ${overlay.name}:`, layerErr);
                   // Continua para a próxima camada
                }
            }
        }

        // 3. Fallback para Lote
        if (!foundFeature) {
            console.log("Nenhuma overlay ativa retornou dados, verificando Lote...");
            try {
                const loteUrl = getFeatureInfoUrl('geoportal:lote_cidadao');
                const loteResponse = await fetch(loteUrl);
                 if (!loteResponse.ok) {
                    console.error("Erro na resposta do servidor de Lote:", loteResponse.status, loteResponse.statusText);
                    // Não lança erro, apenas vai para o 'Nenhum item encontrado'
                 } else {
                    const loteData = await loteResponse.json();
                    if (loteData.features && loteData.features.length > 0) {
                        const loteFeature = loteData.features[0];
                        const loteProps = loteFeature.properties;
                        const setor = loteProps.cd_setor_fiscal;
                        const quadra = loteProps.cd_quadra_fiscal;
                        const iptu = `${setor}.${quadra}.${loteProps.cd_lote}-${loteProps.cd_digito_sql}`;
                        const areaDoTerreno = loteProps.qt_area_terreno || 0;
                        const enderecoBase = `${loteProps.nm_logradouro_completo || 'Endereço'}, ${loteProps.cd_numero_porta || 'S/N'}`;
                        const usoDoImovel = loteProps.dc_tipo_uso_imovel || 'Não informado';
                        const calcada = loteProps.qt_largura_media_trecho || 'Não informado';

                        // Busca Distrito e Zona APENAS para o popup do Lote
                        const [distritoData, zoneamentoData, geotecnicaData, calcadaData] = await Promise.all([
                            fetch(getFeatureInfoUrl('geoportal:distrito_municipal')).then(res => res.ok ? res.json() : { features: [] }), // Retorna objeto vazio em caso de erro
                            fetch(getFeatureInfoUrl('geoportal:perimetro_zona_lei_18177_24')).then(res => res.ok ? res.json() : { features: [] }),
                            fetch(getFeatureInfoUrl('geoportal:carta_geotecnica')).then(res => res.ok ? res.json() : { features: [] }),
                            fetch(getFeatureInfoUrl('geoportal:calcada')).then(res => res.ok ? res.json() : { features: [] })
                          ]);
                          
                        const distrito = (distritoData?.features?.[0]?.properties.nm_distrito_municipal) || 'N/I';
                        const zoneamento = (zoneamentoData?.features?.[0]?.properties.cd_zoneamento_perimetro) || 'N/I';
                        const enderecoCompleto = `${enderecoBase} - ${distrito}`;
                        const geotecnicaStr = (geotecnicaData?.features?.[0]?.properties.tx_unidade_geotecnica) || 'N/I';
                        const calcadaStr = (calcadaData?.features?.[0]?.properties.qt_largura_media_trecho) || '';

                        const loteInfo: Lote = { // Para Adicionar/Remover
                            iptu: iptu, setor: setor, quadra: quadra, lote: loteProps.cd_lote,
                            area: areaDoTerreno, endereco: enderecoBase, dadosCompletos: loteFeature,
                            zoneamento: zoneamento,
                            unidadeGeotecnica: geotecnicaStr,
                        };

                        const isAdicionado = [...lotesAdicionais, lotePrincipal].filter(Boolean).some(l => l?.iptu === loteInfo.iptu);
                        const isPrincipal = lotePrincipal?.iptu === loteInfo.iptu;
                        const content = document.createElement('div');
                        content.className = "text-sm";
                        content.style.fontFamily = "'Inter', sans-serif";
                        content.innerHTML = `
                            <div style="font-size: 1.1em; font-weight: 600; color: #333;">${enderecoCompleto}</div>
                            <hr class="my-2">
                            <p class="m-0"><strong>IPTU:</strong> ${iptu}</p>
                            <p class="m-0"><strong>Uso:</strong> ${usoDoImovel}</p>
                            <p class="m-0"><strong>Área Terreno:</strong> ${areaDoTerreno.toFixed(2)} m²</p>
                            <p class="m-0"><strong>Zoneamento:</strong> ${zoneamento}</p>
                            <p class="m-0"><strong>Calçada (Média):</strong> ${calcada}</p>
                            <p class="m-0"><strong>Geotecnica:</strong> ${geotecnicaStr}</p>
                            <div class="mt-2 border-t border-border pt-2 space-y-1">
                              ${lotePrincipal ? `<button id="btn-adicionar-lote" class="w-full mt-2 rounded-md bg-blue-600 text-white px-3 py-1 text-sm ${isAdicionado ? 'hidden' : ''}">Adicionar Lote</button>` : ''}
                              ${lotePrincipal ? `<button id="btn-remover-lote" class="w-full mt-2 rounded-md bg-red-600 text-white px-3 py-1 text-sm ${!isAdicionado || isPrincipal ? 'hidden' : ''}">Remover Lote</button>` : ''}
                            </div>
                            <div class="mt-2 text-xs"><a href="#" id="btn-debug-lote" style="color: #007bff; text-decoration: underline;">Abrir dados brutos (Lote Completo)</a></div>
                        `;
                        // Listeners Adicionar/Remover (só se houver lote principal)
                         if (lotePrincipal) {
                            content.querySelector('#btn-adicionar-lote')?.addEventListener('click', () => { setLotesAdicionais(prev => [...prev, loteInfo]); map.closePopup(); });
                            content.querySelector('#btn-remover-lote')?.addEventListener('click', () => { setLotesAdicionais(prev => prev.filter(l => l.iptu !== loteInfo.iptu)); map.closePopup(); });
                        }
                        // Listener Debug Completo do Lote
                        content.querySelector('#btn-debug-lote')?.addEventListener('click', async (event) => {
                            event.preventDefault();
                            popup.setContent("Buscando dados completos...");
                            const calcadaFilter = `cd_setor_quadra LIKE '${setor}${quadra}%'`;
                            const wfsCalcadaUrl = `https://wms.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=geoportal:calcada&outputFormat=application/json&cql_filter=${encodeURIComponent(calcadaFilter)}`;
                            const requestsToFetch: Record<string, Promise<any>> = {};
                            Object.entries(overlayLayersRef.current).forEach(([key, layer]) => {
                               if (layer.wmsParams?.layers && layer.wmsParams.layers !== 'geoportal:lote_cidadao') {
                                 requestsToFetch[key] = fetch(getFeatureInfoUrl(layer.wmsParams.layers)).then(res => res.ok ? res.json() : {error: `Falha ao buscar ${key}`});
                               }
                             });
                             requestsToFetch["Distrito"] = Promise.resolve(distritoData); // Reusa
                             requestsToFetch["Zoneamento"] = Promise.resolve(zoneamentoData); // Reusa
                             requestsToFetch["Calcada (WFS)"] = fetch(wfsCalcadaUrl).then(res => res.ok ? res.json() : {error: 'Falha ao buscar WFS Calçada'});

                             const requestKeys = Object.keys(requestsToFetch);
                             const requestPromises = Object.values(requestsToFetch);
                             // Usar allSettled para não falhar se uma camada der erro
                             const allResultsSettled = await Promise.allSettled(requestPromises);
                             const debugDataCompleto: Record<string, any> = { "Lote (Principal)": loteData };
                             requestKeys.forEach((key, index) => {
                                 const result = allResultsSettled[index];
                                 debugDataCompleto[key] = result.status === 'fulfilled' ? result.value : { error: `Erro ao buscar ${key}`, reason: result.reason };
                             });

                             // Chama a função para abrir a nova aba (precisa ser síncrono ou dentro de timeout 0)
                              setTimeout(() => {
                                 const debugJsonString = JSON.stringify(debugDataCompleto, null, 2);
                                 const newWindow = window.open("", "_blank");
                                 if (newWindow) {
                                     newWindow.document.write(`<pre style="word-break: break-all; white-space: pre-wrap;">${debugJsonString}</pre>`);
                                     newWindow.document.close(); newWindow.focus();
                                 } else { alert("Não foi possível abrir a nova janela. Verifique seu bloqueador de pop-ups."); }
                             }, 0);
                             popup.setContent(content); // Restaura o popup original rapidamente
                        });
                        popup.setContent(content);
                        foundFeature = true;
                    }
                 }
            } catch (loteErr: any) {
                console.error("Erro ao processar camada Lote:", loteErr);
                // Não marca foundFeature = true, permite cair no 'Nenhum item'
            }
        }

        // 4. Se NADA foi encontrado
        if (!foundFeature) {
             console.log("Nenhum item encontrado.");
             popup.setContent("Nenhum item de interesse encontrado neste ponto.");
        }

    } catch (err: any) {
      console.error("Erro geral no handleMapClick:", err);
      popup.setContent(`<span class="text-xs text-red-600">Erro inesperado: ${err.message}</span>`);
    }
}, [lotePrincipal, lotesAdicionais, overlayLayersRef, isOverlayActive]); // Dependências

  useEffect(() => {
    if (!mapRef.current || !scriptsLoaded || mapInstanceRef.current) return;
    const map = window.L.map(mapRef.current, { center: [-23.55, -46.63], zoom: 12, zoomControl: false, maxZoom: 20 });
    mapInstanceRef.current = map;
    canvasRendererRef.current = window.L.canvas();
    window.L.control.zoom({ position: "topright" }).addTo(map);
    
    const wmsUrl = "https://wms.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wms";

    const wmsOptions = { 
        format: 'image/png', 
        transparent: true, 
        maxZoom: 20, 
        attribution: "GeoSampa",
        crossOrigin: 'anonymous'
    };
    
    const baseLayers = {
      "GeoSampa": window.L.tileLayer.wms(wmsUrl, { layers: "geoportal:MapaBase_Politico", format: 'image/png', transparent: true, attribution: "GeoSampa", maxZoom: 20, crossOrigin: 'anonymous' }).addTo(map),
      "OpenStreetMap": window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: 'OpenStreetMap', maxZoom: 20 })
    };

    const loteLayer = window.L.tileLayer.wms(wmsUrl, {
      layers: "geoportal:lote_cidadao",
      format: "image/png",
      transparent: true,
      crossOrigin: 'anonymous',
      maxZoom: 20}).addTo(map);

    const overlayLayers: Record<string, any> = {
      "Zoneamento": window.L.tileLayer.wms(wmsUrl, { layers: "geoportal:perimetro_zona_lei_18177_24", format: 'image/png', transparent: true, maxZoom: 20, crossOrigin: 'anonymous' }),
      "Topografia": window.L.tileLayer.wms(wmsUrl, { layers: "geoportal:curva_mestra,geoportal:curva_intermediaria", format: 'image/png', transparent: true, maxZoom: 20, crossOrigin: 'anonymous' }),
      "Infraestrutura Urbana": window.L.tileLayer.wms(wmsUrl, { layers: "geoportal:geoconvias_lei_melhoramento_vigente", format: 'image/png', transparent: true, maxZoom: 20, crossOrigin: 'anonymous' }),
      "Área Contaminada": window.L.tileLayer.wms(wmsUrl, { layers: "geoportal:GEOSAMPA_area_contaminada_sigac", format: 'image/png', transparent: true, maxZoom: 20, crossOrigin: 'anonymous' }),
      "Cobertura Vegetal": window.L.tileLayer.wms(wmsUrl, { layers: "geoportal:cobertura_vegetal", format: 'image/png', transparent: true, maxZoom:20, crossOrigin: 'anonymous' }),
      "Tombamento": window.L.tileLayer.wms(wmsUrl, {layers: "geoportal:patrimonio_cultural_bairro_ambiental,geoportal:patrimonio_cultural_bem_tombado,geoportal:patrimonio_cultural_lugar_paisagistico_ambiental,geoportal:patrimonio_cultural_area_envoltoria_CONPRESP,geoportal:patrimonio_cultural_area_envoltoria_CONDEPHAAT,geoportal:patrimonio_cultural_area_envoltoria_IPHAN,geoportal:patrimonio_cultural_acervo_tombado", format: 'image/png', transparent: true, maxZoom:20, crossOrigin: 'anonymous' }),
      "Unidade GeoTecnica": window.L.tileLayer.wms(wmsUrl, { layers: "geoportal:carta_geotecnica", format: 'image/png', transparent: true, maxZoom:20, crossOrigin: 'anonymous' }),
      "Calçada": window.L.tileLayer.wms(wmsUrl, { layers: "geoportal:calcada", format: 'image/png', transparent: true, maxZoom:20, crossOrigin: 'anonymous' }),
    };

    overlayLayersRef.current = overlayLayers;

    window.L.control.layers(baseLayers, overlayLayers, { position: 'topleft', maxZoom: 20 }).addTo(map);
    layerGroupRef.current = window.L.layerGroup().addTo(map);
    
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [scriptsLoaded]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.on('click', handleMapClick);
    return () => { map.off('click', handleMapClick); };
  }, [handleMapClick]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleConsultar = async () => {
    setIsLoading(true); setStatus("Consultando..."); setError(null); setResumo("");
    if(layerGroupRef.current) layerGroupRef.current.clearLayers();
    if (highlightLayerRef.current) { highlightLayerRef.current.remove(); highlightLayerRef.current = null; }
    setLotePrincipal(null); setLotesAdicionais([]); setCondicoes([]);

    const iptusParaConsultar: { setor: string; quadra: string; lote: string }[] = [];
    // ... (lógica para preencher iptusParaConsultar - igual a antes) ...
    if (tipoConsulta === "unico") { if(form.setor && form.quadra && form.lote) iptusParaConsultar.push({ setor: form.setor.padStart(3, '0'), quadra: form.quadra.padStart(3, '0'), lote: form.lote.padStart(4, '0') }); }
    else if (tipoConsulta === "multiplos") { form.listaIptus.split("\n").filter(iptu => iptu.trim()).forEach(iptu => { const [s, q, l] = iptu.trim().split(/[.-]/); if (s && q && l) iptusParaConsultar.push({ setor: s.padStart(3, '0'), quadra: q.padStart(3, '0'), lote: l.padStart(4, '0') }); }); }
    else if (tipoConsulta === "faixa") { const inicio = parseInt(form.loteInicio, 10), fim = parseInt(form.loteFim, 10); if (form.setorFaixa && form.quadraFaixa && !isNaN(inicio) && !isNaN(fim)) { for (let i = inicio; i <= fim; i++) iptusParaConsultar.push({ setor: form.setorFaixa.padStart(3, '0'), quadra: form.quadraFaixa.padStart(3, '0'), lote: i.toString().padStart(4, '0') }); } }

        // COMEÇO DA LOGICA DE ENDEREÇO

    // ... (código anterior) ...
    else if (tipoConsulta === "endereco") {
      if (!form.rua || form.rua.length < 5) {
        setStatus("Digite o nome da Rua (mínimo 5 caracteres).");
        setIsLoading(false);
        return;
      }
      
      try {
        setSearchResults([]); // Limpa resultados antigos
        setStatus("Buscando ruas..."); // Atualiza status
        
        const params = new URLSearchParams({ rua: form.rua });
        const response = await fetch(`/api/busca-endereco?${params.toString()}`);
        const data = await response.json(); 

        if (!response.ok) {
          throw new Error(data.erro || 'Falha ao buscar endereço');
        }
        
        const searchResults: {id: string, nome: string}[] = data.resultados || [];
        
        if (searchResults.length === 0) {
          setStatus("Nenhuma rua encontrada.");
          setIsLoading(false);
          return; // Para aqui
        }
        
        // --- MUDANÇA CRÍTICA ---
        // 1. Coloca os resultados no novo estado
        setSearchResults(searchResults); 
        // 2. Atualiza o status
        setStatus(`${searchResults.length} rua(s) encontrada(s).`);
        // 3. NÃO busca mais IPTUs, só para a execução
        setIsLoading(false);
        return; 
        
      } catch (err: any) {
        setError(`Erro ao buscar endereço: ${err.message}`);
        setIsLoading(false);
        return; // Para aqui
      }
    }

    // FIM DA LOGICA DE ENDEREÇO

    if (iptusParaConsultar.length === 0) { setStatus("Nenhum IPTU válido para consultar."); setIsLoading(false); return; }
    
    let erros: string[] = [];
    let resultados: Lote[] = [];
    
    for (const iptu of iptusParaConsultar) {
        try {
            const params = new URLSearchParams({ setor: iptu.setor, quadra: iptu.quadra, lote: iptu.lote });
            const response = await fetch(`/api/consulta-sql?${params.toString()}`);
            if (!response.ok) { const err = await response.json(); throw new Error(err.erro); }
            const data = await response.json();
            
            if (data.features?.length > 0) {
                const feature = data.features[0];
                const props = feature.properties;

                // --- INÍCIO DA BUSCA PELO ZONEAMENTO ---
                let zoneamento = "N/I";
                let calcadaStr = "N/I";
                let geotecniaStr = "N/I";
                let distritoStr = "N/I";
                try {
                    // 1. Achar o centro do lote
                    const lotBounds = window.L.geoJSON(feature).getBounds();
                    const center = lotBounds.getCenter();
                    const wmsUrl = "https://wms.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wms";

                    // 2. Helper para montar URL GetFeatureInfo (pode ser refatorado se já existir em handleMapClick)
                    const getFeatureInfoUrl = (layers: string) => {
                      const w = 0.0001; 
                      const smallBbox = `${center.lng - w},${center.lat - w},${center.lng + w},${center.lat + w}`;
                      const params = new URLSearchParams({
                        request: 'GetFeatureInfo', service: 'WMS', srs: 'EPSG:4326',
                        version: '1.1.1', format: 'image/png',
                        bbox: smallBbox, height: '3', width: '3',
                        layers: layers, query_layers: layers,
                        info_format: 'application/json',
                        x: '1', y: '1'
                      });
                        return `${wmsUrl}?${params.toString()}`;
                    };

                    const getWfsCalcadaUrl = () => {
                        const wfsUrl = "https://wms.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wfs";                        
                        const cdLogradouroDoLote = props.cd_logradouro;

                        if (!cdLogradouroDoLote) {
                            console.warn('Lote ${iptu.lote} não possui cd_logradouro nas propriedades.');
                            return null;
                        }
                        
                        const calcadaFilter = `cd_logradouro = '${cdLogradouroDoLote}'`;

                        const params = new URLSearchParams({
                            service: 'WFS',
                            version: '1.0.0',
                            request: 'GetFeature',
                            typeName: 'geoportal:calcada',
                            outputFormat: 'application/json',
                            cql_filter: calcadaFilter
                        });
                        return `${wfsUrl}?${params.toString()}`;
                    };

                    const calcadaWfsUrl = getWfsCalcadaUrl();
                    const fetchPromises = [
                        fetch(getFeatureInfoUrl('geoportal:perimetro_zona_lei_18177_24')),
                    ]

                    calcadaWfsUrl ? fetch(calcadaWfsUrl)
                    : Promise.resolve({ ok: false, json: () => Promise.resolve({ error: "cd_logradouro não encontrado no lote" }) }),                    
                    ([
                        fetch(getFeatureInfoUrl('geoportal:carta_geotecnica')),
                        fetch(getFeatureInfoUrl('geoportal:distrito_municipal')),
                    ]);

                    const [zonaResp, calcadaWfsResp, geotecnicaResponse, distritoResp] = await Promise.all(fetchPromises);

                    if (zonaResp.ok) {
                      const zonaData = await zonaResp.json();
                      if (zonaData.features && zonaData.features.length > 0) {
                        zoneamento = zonaData.features[0].properties.cd_zoneamento_perimetro || "N/I";
                      }
                    }

                    // 4. Processa Calçada
                    if (calcadaWfsResp.ok) {
                         const calcadaData = await calcadaWfsResp.json();
                         if (calcadaData.features && calcadaData.features.length > 0) {
                            // WFS pode retornar vários trechos, pegamos o primeiro.
                            const propsCalc = calcadaData.features[0].properties;
                            const largura = propsCalc.qt_largura_media_trecho ?? propsCalc.qt_largura_media;
                            if (largura !== null && largura !== undefined) {
                                calcadaStr = `${Number(largura).toFixed(2)} m`;
                            }
                         }
                    }

                    // 5. Processa Geotecnia 
                    if (geotecnicaResponse.ok) {
                        const geotecnicaData = await geotecnicaResponse.json();
                        if (geotecnicaData.features && geotecnicaData.features.length > 0) {
                            geotecniaStr = geotecnicaData.features[0].properties.tx_unidade_geotecnica || 'N/I';
                        }
                    }

                    // 6. Processa Distrito
                  if (distritoResp.ok) {
                      const distritoData = await distritoResp.json();
                      if (distritoData.features && distritoData.features.length > 0) {
                          distritoStr = distritoData.features[0].properties.nm_distrito_municipal || 'N/I';
                      }
                  }

                } catch (err) {
                    console.error("Erro ao buscar dados (zona/calcada/geotecnia/distrito):", err);
                }
                // --- FIM DA BUSCA PELO ZONEAMENTO ---

                resultados.push({ 
                	...iptu, 
                	iptu: `${iptu.setor}.${iptu.quadra}.${iptu.lote}-${props.cd_digito_sql}`, 
                	area: props.qt_area_terreno || 0, 
                	endereco: `${props.nm_logradouro_completo || 'N/A'}, ${props.cd_numero_porta || 'S/N'}`,
                  distrito: distritoStr, 
                	dadosCompletos: feature,
    	            zoneamento: zoneamento,
                  larguraCalcada: calcadaStr,
                  unidadeGeotecnica: geotecniaStr
                });
            } else { 
            	erros.push(`${iptu.setor}.${iptu.quadra}.${iptu.lote}: Não encontrado`); 
            }
        } catch (err: any) { 
        	erros.push(`${iptu.setor}.${iptu.quadra}.${iptu.lote}: ${err.message}`); 
        }
   }
    
    if(resultados.length > 0) { 
    	setLotePrincipal(resultados[0]); 
    	setLotesAdicionais(resultados.slice(1)); 
    }
    if (erros.length > 0) setError(erros.join('\n'));
    setStatus("Consulta finalizada.");
    setIsLoading(false);
  };

  const handleResultadoClique = async (rua: { id: string; nome: string }) => {
    setIsLoading(true);
    setStatus(`Buscando geometria para ${rua.nome}...`);
    setSearchResults([]); // Limpa a lista de resultados
    setError(null);

    // Limpa destaques de IPTU antigos
    if (layerGroupRef.current) layerGroupRef.current.clearLayers();
    if (highlightLayerRef.current) {
      highlightLayerRef.current.remove();
      highlightLayerRef.current = null;
    }
    // Limpa destaques de clique antigos
    if (tempHighlightLayerRef.current) {
      tempHighlightLayerRef.current.remove();
      tempHighlightLayerRef.current = null;
    }

    try {
      const response = await fetch(`/api/geometria-rua?id=${rua.id}`);
      const geojsonData = await response.json();

      if (!response.ok) {
        throw new Error(geojsonData.erro || "Não foi possível carregar a geometria da rua.");
      }
      
      if (!geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
        throw new Error("Geometria da rua não encontrada.");
      }

      const map = mapInstanceRef.current;
      if (!map) return;

      // Desenha a rua no mapa
      const ruaLayer = window.L.geoJSON(geojsonData, {
        style: { color: "#ff0000", weight: 5, opacity: 0.8 } // Vermelho
      }).addTo(layerGroupRef.current); // Adiciona ao layer group

      // Dá zoom na rua
      map.fitBounds(ruaLayer.getBounds().pad(0.1));

      setStatus(`Exibindo: ${rua.nome}`);
      
    } catch (err: any) {
      setError(err.message);
      setStatus("Erro ao carregar rua.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;
    if(layerGroupRef.current) layerGroupRef.current.clearLayers();
    if (highlightLayerRef.current) { highlightLayerRef.current.remove(); highlightLayerRef.current = null; }
    const todosLotes = [lotePrincipal, ...lotesAdicionais].filter(Boolean) as Lote[];
    if (todosLotes.length === 0) { setResumo("Nenhum lote selecionado."); return; };

    // SEM onEachFeature
    if (lotePrincipal) { 
      highlightLayerRef.current = window.L.geoJSON(lotePrincipal.dadosCompletos, { 
        style: { color: "#d32f2f", weight: 3, fillOpacity: 0.2 }, 
        renderer: canvasRendererRef.current
      }).addTo(map); 
    }
    // SEM onEachFeature
    if (lotesAdicionais.length > 0) { 
      window.L.geoJSON(lotesAdicionais.map(l => l.dadosCompletos), { 
        style: { color: "#d32f2f", weight: 2, fillOpacity: 0.3 },
        renderer: canvasRendererRef.current 
      }).addTo(layerGroupRef.current); 
    }
    
    const allBounds = window.L.geoJSON(todosLotes.map(l => l.dadosCompletos)).getBounds();
    if(allBounds.isValid()) { map.fitBounds(allBounds.pad(0.2)); }
    const totalArea = todosLotes.reduce((acc, lote) => acc + (lote.area || 0), 0);
    const resumoHtml = `<b>${todosLotes.length} lote(s) selecionado(s).</b><br><b>Área total:</b> ${totalArea.toFixed(2)} m²<hr>` + todosLotes.map(l => `Lote: ${l.iptu} (${(l.area || 0).toFixed(2)} m²)`).join('<br>');
    setResumo(resumoHtml);
  }, [lotePrincipal, lotesAdicionais]);

  // --- NOVO useEffect para limpar highlight ao desativar camada ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    // Precisa esperar o mapa e o overlayLayersRef estarem prontos
    if (!map || !scriptsLoaded || Object.keys(overlayLayersRef.current).length === 0) return;

    // Listener para o evento 'overlayremove' do controle de camadas
    const handleOverlayRemove = (e: any) => {
      // e.name é o nome da camada que foi desmarcada (ex: "Unidade GeoTecnica")
      if (tempHighlightSourceNameRef.current && e.name === tempHighlightSourceNameRef.current) {
        if (tempHighlightLayerRef.current) {
          map.removeLayer(tempHighlightLayerRef.current);
          tempHighlightLayerRef.current = null;
        }
        tempHighlightSourceNameRef.current = null;
        console.log(`Highlight removido para a camada desativada: ${e.name}`);
      }
    };

    map.on('overlayremove', handleOverlayRemove);

    // Função de limpeza
    return () => {
      if (map) { // Garante que o mapa ainda existe ao desmontar
       map.off('overlayremove', handleOverlayRemove);
      }
    };
    // Re-executa se o mapa for recriado (embora não deva ser comum)
  }, [scriptsLoaded]);

  const handleCondicaoChange = (iptu: string, field: keyof CondicaoComercial, value: string | number) => {
    
    let processedValue = value;
    const MAX_VALUE = 100_000_000; // Limite de 100 Milhões

    // 1. Validar Limite de 100 Milhões
    if (field === 'valor' || field === 'aluguel') {
      let numValue = Number(value);
      if (numValue > MAX_VALUE) {
        numValue = MAX_VALUE;
      }
      processedValue = numValue;
    }

    // 2. Capitalizar o texto da Condição
    if (field === 'condicaoTexto' && typeof value === 'string') {
      processedValue = capitalizeFirstLetter(value);
    }

    setCondicoes(prev => 
      prev.map(c => (c.iptu === iptu ? { ...c, [field]: processedValue } : c))
    );
  };
  
  const handleSaveCondicoes = () => setIsModalOpen(false);

  const openModal = () => {
    const todosLotes = [lotePrincipal, ...lotesAdicionais].filter(Boolean) as Lote[];
    
    setCondicoes(todosLotes.map(lote => {
      const existente = condicoes.find(c => c.iptu === lote.iptu);
      if (existente) {
        return existente;
      }

      // 2. Se for novo, calcula os padrões
      const zona = lote.zoneamento || "N/I";
      const dadosCA = DICIONARIO_CA[zona];

      let caPadrao = 0;
      let divisorPadrao = 25; // Default (ex: 25)
      let unidadesCalculadas = 0;

      if (dadosCA) {
        caPadrao = dadosCA.ca; 
        divisorPadrao = dadosCA.divisor;
        
        if (lote.area > 0 && divisorPadrao > 0) {
          unidadesCalculadas = Math.floor((lote.area * caPadrao) / divisorPadrao);
        }
      }

      // 3. Retorna o objeto completo para o modal
      return { 
        iptu: lote.iptu, 
        m2: lote.area, 
        valor: 0, 
        aluguel: 0, 
        permutaLoja: 0, 
        permutaApto: 0, 
        unidadesGeradas: unidadesCalculadas,
        condicaoTexto: '', 
        situacao: 'NEGOCIAÇÃO',
        zoneamento: zona, 
        ca: caPadrao, 		 
        divisor: divisorPadrao
      };
    }));
    setIsModalOpen(true);
  };
  
  const totaisCondicoes = useMemo(() => {

    const precoLoja = Number(loja) || 0;
    const precoApto = Number(apto) || 0
    // Recalcula os totais ao vivo
    return condicoes.reduce((acc, curr) => {
      const valorNumerico = Number(curr.valor) || 0;
      const aluguelNumerico = Number(curr.aluguel) || 0;
      const valorPermutaLoja = (Number(curr.permutaLoja) || 0);
      const valorPermutaApto = (Number(curr.permutaApto) || 0);
      const totalLinha = valorNumerico + aluguelNumerico + valorPermutaLoja + valorPermutaApto;      // Pega os valores que o usuário pode ter mudado
      const caAtual = Number(curr.ca) || 0;
      const divisorAtual = Number(curr.divisor) || 0;
      const unidadesCalculadas = (curr.m2 > 0 && divisorAtual > 0)
        ? Math.floor((curr.m2 * caAtual) / divisorAtual)
        : 0;

      // Acumuladores
      acc.m2 += curr.m2 || 0;
      acc.valor += valorNumerico;
      acc.aluguel += aluguelNumerico;
      acc.permutaLoja += Number(curr.permutaLoja) || 0;
      acc.permutaApto += Number(curr.permutaApto) || 0;
      acc.unidadesGeradas += unidadesCalculadas; 
      acc.totalGeral += totalLinha;
      return acc;
    }, { m2: 0, valor: 0, aluguel: 0, permutaLoja: 0, permutaApto: 0, unidadesGeradas: 0, totalGeral: 0 });
  }, [condicoes]);

  const handleGerarPptx = useCallback(async () => {

    if (isAuthLoading) { setStatus("❌ Erro: Aguardando dados de autenticação..."); return;}
    // Validações
    if (!lotePrincipal) { setStatus("❌ Erro: Lote não selecionado."); return; }
    if (!condicoes || condicoes.length === 0) { setStatus("❌ Erro: Condições não salvas."); return; }
    if (typeof window.PptxGenJS === 'undefined') { setStatus("❌ Erro: PptxGenJS não carregado."); return; }

    setStatus("Gerando PPTX... Capturando imagem...");
    setIsLoading(true);
    try {
      const mapImageBase64 = await getMapImageAsBase64(); 
      setStatus("Gerando PPTX... Montando slides...");
      
      // 1. Combina o lote principal e os adicionais em um único array
      const todosLotes = [lotePrincipal, ...lotesAdicionais].filter(Boolean) as Lote[];
      /**
       * Função helper para extrair valores, pegar os únicos e formatar.
       * @param extractor - Função que diz como extrair o valor de um lote (ex: l => l.larguraCalcada)
       */
      const getValoresUnicos = (extractor: (lote: Lote) => string | undefined | null): string => {
        // 2. Extrai o valor de cada lote, usando 'N/I' como padrão
        const valores = todosLotes.map(lote => extractor(lote) || 'N/I');
        
        // 3. Usa um Set para pegar apenas os valores únicos (remove duplicados)
        const unicos = [...new Set(valores)];

        // 4. Lógica inteligente: Se tivermos valores reais E 'N/I', removemos o 'N/I'.
        const unicosFiltrados = unicos.length > 1 ? unicos.filter(v => v !== 'N/I') : unicos;

        // 5. Junta os valores com " / " ou retorna "N/I" se nada for encontrado
        return unicosFiltrados.length > 0 ? unicosFiltrados.join(' / ') : 'N/I';
      };

      // 6. Aplica a função helper para cada campo que precisa ser concatenado
      const usoImovel = getValoresUnicos(lote => lote.dadosCompletos?.properties?.dc_tipo_uso_imovel);
      const larguraCalcada = getValoresUnicos(lote => lote.larguraCalcada);
      const unidadeGeotecnica = getValoresUnicos(lote => lote.unidadeGeotecnica);

      // 7. Para o endereço, mantemos apenas o do lote principal, pois concatenar endereços não faz sentido.
      const enderecoCompleto = `${lotePrincipal.endereco || 'N/I'} - ${lotePrincipal.distrito || 'N/I'}`;

      const successMessage = await generatePresentation({
        lotePrincipal: lotePrincipal, // PASSA O OBJETO INTEIRO AGORA
        condicoes,
        totaisCondicoes,
        mapImageBase64,
        corretor: capitalizeFirstLetter(corretor),
        codigo: codigo,
        loja: Number(loja) || 0,
        apto: Number(apto) || 0,
        enderecoCompleto: enderecoCompleto,
        usoImovel: usoImovel,
        larguraCalcada: larguraCalcada,
        unidadeGeotecnica: unidadeGeotecnica,
        analista: analista,
        gerente: gerente,
      });
      setStatus(successMessage);
    } catch (error: any) {
      setStatus(error.message || "❌ Erro desconhecido.");
      console.error("Erro ao gerar PPTX:", error);
    } finally {
      setIsLoading(false);
    }
  // --- Adiciona totaisCondicoes às dependências ---
  }, [lotePrincipal, condicoes, totaisCondicoes, corretor, codigo, loja, apto, getMapImageAsBase64, analista, gerente, isAuthLoading]);

  return (
    <>
      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="lazyOnload" onReady={() => setScriptsLoaded(true)} />
      <Script src="https://unpkg.com/leaflet-image@0.4.0/leaflet-image.js" strategy="lazyOnload" />
      <Script src="https://cdn.jsdelivr.net/gh/gitbrent/pptxgenjs/dist/pptxgen.bundle.js" strategy="lazyOnload" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div className="flex h-full">
        <aside className="w-96 flex-shrink-0 overflow-y-auto border-r bg-card p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Consulta IPTU</h2>
          <div className="flex space-x-2 rounded-lg bg-muted p-1 mb-4">
              {['unico', 'multiplos', 'faixa', 'endereco'].map(val => (
                <button key={val} onClick={() => setTipoConsulta(val)}
                  className={`w-full rounded-md py-1.5 text-sm font-medium transition-colors ${tipoConsulta === val ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-secondary'}`}>
                  {val === 'unico' ? '1 Lote' : val === 'multiplos' ? 'Vários' : val === 'faixa' ? 'Faixa' : 'Endereço'}
                </button>
              ))}
          </div>
          {tipoConsulta === "unico" && ( <div className="space-y-3">
              <input name="setor" value={form.setor} onChange={handleFormChange} maxLength={3} placeholder="Setor (3 dígitos)" className="w-full rounded-md border px-3 py-2 text-sm" />
              <input name="quadra" value={form.quadra} onChange={handleFormChange} maxLength={3} placeholder="Quadra (3 dígitos)" className="w-full rounded-md border px-3 py-2 text-sm" />
              <input name="lote" value={form.lote} onChange={handleFormChange} maxLength={4} placeholder="Lote (4 dígitos)" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div> )}
          {tipoConsulta === "multiplos" && ( <textarea name="listaIptus" value={form.listaIptus} onChange={handleFormChange} rows={5} placeholder="045.102.0016&#10;045.102.0017"
            className="w-full rounded-md border px-3 py-2 text-sm" /> )}
          {tipoConsulta === "faixa" && ( <div className="space-y-3">
            <input name="setorFaixa" value={form.setorFaixa} onChange={handleFormChange} maxLength={3} placeholder="Setor (3 dígitos)" className="w-full rounded-md border px-3 py-2 text-sm" />
            <input name="quadraFaixa" value={form.quadraFaixa} onChange={handleFormChange} maxLength={3} placeholder="Quadra (3 dígitos)" className="w-full rounded-md border px-3 py-2 text-sm" />
            <div className="flex items-center gap-2">
              <input name="loteInicio" value={form.loteInicio} onChange={handleFormChange} maxLength={4} placeholder="Lote Início" className="w-full rounded-md border px-3 py-2 text-sm" />
              <span>até</span>
              <input name="loteFim" value={form.loteFim} onChange={handleFormChange} maxLength={4} placeholder="Lote Fim" className="w-full rounded-md border px-3 py-2 text-sm" />
            </div>
          </div> )}
            {tipoConsulta === "endereco" && ( <div className="space-y-3">
              <label className="block text-sm font-medium text-[#333333] mb-1">Funcionalidade será implementada em breve</label>
              <input 
                name="rua" 
                value={form.rua} 
                onChange={handleFormChange} 
                placeholder="Ex: Paulista" 
                className="w-full rounded-md border px-3 py-2 text-sm" 
              />
              <small className="text text-gray-500">Digite o nome principal do logradouro sem o título (são, santo, brig., etec.), sem preposição (de, dos, etc.), sem acentuação e cedilha.</small>
          </div> )}

          <button onClick={handleConsultar} disabled={isLoading}
            className="w-full mt-4 rounded-lg bg-primary py-2 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Consultando...</> : "Consultar"}
          </button>

         {/* --- BLOCO DE RESULTADOS ADICIONADO AQUI --- */}
          {searchResults.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h3 className="text-sm font-semibold mb-2">Resultados da Busca:</h3>
              <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
                {searchResults.map((rua) => (
                  <button
                    key={rua.id}
                    onClick={() => handleResultadoClique(rua)}
                    className="w-full text-left p-2 rounded-md text-sm hover:bg-secondary transition-colors"
                  >
                    {rua.nome}
                  </button>
                ))}
              </div>
            </div>
          )}
         {/* --- FIM DO BLOCO ADICIONADO --- */}
          
          {lotePrincipal && ( <div className="mt-4 space-y-2 border-t pt-4">
              <button onClick={openModal} className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  <PlusCircle className="h-4 w-4" /> Adicionar/Editar Condições
              </button>
              <button onClick={handleGerarPptx} className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                  <FileDown className="h-4 w-4" /> Gerar PPTX
              </button>
          </div> )}

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold text-primary mb-2">Resumo</h3>
            {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-wrap">{error}</div>}
            <div className="text-sm text-muted-foreground break-words" dangerouslySetInnerHTML={{ __html: isLoading ? status : resumo }} />
          </div>
        </aside>
        
        <div ref={mapRef} className="flex-1 bg-gray-100" />
      </div>
      
      <div className={clsx("fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 transition-opacity", isModalOpen ? "opacity-100" : "opacity-0 pointer-events-none")}>
        <div className={clsx("w-full max-w-6xl rounded-lg bg-card shadow-xl transition-transform", isModalOpen ? "scale-100" : "scale-95")}>
          <div className="p-4 flex justify-between items-center border-b">
          <h3 className="text-lg font-semibold text-primary">Condição Comercial</h3>

          {/* Main container for the input groups - Stacks rows vertically */}
          <div className="flex flex-col gap-2"> {/* Added flex-col and gap-2 */}

            {/* --- Row 1: Corretor and Código --- */}
            <div className="flex gap-3 items-center"> {/* Container for the first row */}
              {/* Corretor Group */}
              <div className="flex items-center gap-2">
                <label htmlFor="corretor" className="text-sm font-medium whitespace-nowrap">
                  Corretor:
                </label>
                <input
                  type="text"
                  id="corretor"
                  value={corretor}
                  onChange={(e) => setCorretor(e.target.value)}
                  onBlur={(e) => setCorretor(capitalizeFirstLetter(e.target.value))}
                  className="w-64 rounded-md border bg-secondary px-3 py-1 text-sm"
                  placeholder="Nome do corretor"
                />
              </div>

              {/* Código Group */}
              <div className="flex items-center gap-2">
                <label htmlFor="codigo" className="text-sm font-medium whitespace-nowrap">
                  Código:
                </label>
                <input
                  type="number"
                  id="codigo"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-48 rounded-md border bg-secondary px-3 py-1 text-sm"
                  placeholder="12345"
                />
              </div>
            </div>

            {/* --- Row 2: Loja and Apto --- */}
            <div className="flex gap-10 items-center"> {/* Container for the second row */}
              {/* Loja Group */}
              <div className="flex items-center gap-2">
                <label htmlFor="loja" className="text-sm font-medium whitespace-nowrap">
                  Loja:
                </label>
                <input
                  type="number"
                  id="loja"
                  value={loja}
                  // IMPORTANT: Make sure onChange updates the 'loja' state
                  onChange={(e) => setLoja(e.target.value)}
                  className="w-64 rounded-md border bg-secondary px-3 py-1 text-sm" // Adjusted width like Corretor
                  placeholder="Ex: 50" // Example placeholder
                />
              </div>

              {/* Apto Group */}
              <div className="flex items-center gap-2">
                <label htmlFor="apto" className="text-sm font-medium whitespace-nowrap">
                  Apto:
                </label>
                <input
                  type="number"
                  id="apto"
                  value={apto}
                   // IMPORTANT: Make sure onChange updates the 'apto' state
                  onChange={(e) => setApto(e.target.value)}
                  className="w-52 rounded-md border bg-secondary px-3 py-1 text-sm" // Adjusted width like Codigo
                  placeholder="Ex: 100" // Example placeholder
                />
              </div>
            </div>

          </div> {/* End of flex-col container */}
        </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[1300px] border-collapse text-xs text-center">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 border">Lote</th>
                  <th className="p-2 border">m²</th>
                  <th className="p-2 border">R$</th>
                  <th className="p-2 border">Aluguel</th>
                  <th className="p-2 border">Loja m²</th>
                  <th className="p-2 border">Apto m²</th>
                  <th className="p-2 border">TOTAL</th>
                  <th className="p-2 border">R$/m²</th>
                  <th className="p-2 border w-16">CA</th>
                  <th className="p-2 border w-16">Divisor</th>
                  <th className="p-2 border">Unidades</th>
                  <th className="p-2 border">Fração</th>
                  <th className="p-2 border w-1/4">Condição</th>
                  <th className="p-2 border">Situação</th>
                </tr>
              </thead>
              <tbody>
                {condicoes.map((c) => {
                  {
                    /* --- CÁLCULO AO VIVO --- */
                  }
                  const valor = Number(c.valor) || 0;
                  const aluguel = Number(c.aluguel) || 0;

                  const precoLoja = Number(loja) || 0;
                  const precoApto = Number(apto) || 0;
                  const valorPermutaLoja = (Number(c.permutaLoja) || 0) * precoLoja;
                  const valorPermutaApto = (Number(c.permutaApto) || 0) * precoApto;

                  const totalLinha = valor + aluguel + valorPermutaLoja + valorPermutaApto;
                  
                  // Pega os valores dos inputs (que foram pré-preenchidos)
                  const caAtual = Number(c.ca) || 0;
                  const divisorAtual = Number(c.divisor) || 0;

                  // Recalcula Unidades e Fração AO VIVO
                  const unidadesCalculadas =
                    c.m2 > 0 && divisorAtual > 0
                      ? Math.floor((c.m2 * caAtual) / divisorAtual)
                      : 0;

                  const MAX_VALOR_CALCULADO = 30000;

                  // 2. Aplica o limite para R$/m²
                  const rsPorM2Bruto = c.m2 > 0 ? totalLinha / c.m2 : 0;
                  const rsPorM2 = 
                    (rsPorM2Bruto > 0 && rsPorM2Bruto > MAX_VALOR_CALCULADO)
                      ? MAX_VALOR_CALCULADO
                      : rsPorM2Bruto;

                  const custoPorUnidadeBruto =
                    unidadesCalculadas > 0 ? totalLinha / unidadesCalculadas : 0;

                  const custoPorUnidade =
                    (custoPorUnidadeBruto > 0 && custoPorUnidadeBruto > MAX_VALOR_CALCULADO)
                      ? MAX_VALOR_CALCULADO // Se for maior, usa o limite
                      : custoPorUnidadeBruto; // Senão, usa o valor calculado (ou zero)
                    {
                    /* --- FIM DO CÁLCULO --- */
                  }

                  return (
                    <tr key={c.iptu}>
                      <td className="p-1 border">{c.iptu.split("-")[0]}</td>
                      <td className="p-1 border">{c.m2.toFixed(2)}</td>
                      <td className="p-1 border">
                        <input type="number" value={c.valor || ""} onChange={(e) => handleCondicaoChange(c.iptu, "valor", e.target.value)} className="w-full text-center bg-secondary p-1 rounded-sm"/>
                      </td>
                      <td className="p-1 border">
                        <input type="number" value={c.aluguel || ""} onChange={(e) => handleCondicaoChange(c.iptu, "aluguel", e.target.value)} className="w-full text-center bg-secondary p-1 rounded-sm"/>
                      </td>
                      <td className="p-1 border">
                        <input type="number" value={c.permutaLoja || ""} onChange={(e) => handleCondicaoChange(c.iptu, "permutaLoja", e.target.value)} className="w-20 text-center bg-secondary p-1 rounded-sm"/>
                      </td>
                      <td className="p-1 border">
                        <input type="number" value={c.permutaApto || ""} onChange={(e) => handleCondicaoChange(c.iptu, "permutaApto", e.target.value)} className="w-20 text-center bg-secondary p-1 rounded-sm"/>
                      </td>
                      <td className="p-1 border">
                        {totalLinha.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="p-1 border">
                        {rsPorM2.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Este input vem preenchido por openModal, mas pode ser mudado */}
                      <td className="p-1 border">
                        <input type="number" step="0.1" value={c.ca || ""} onChange={(e) => handleCondicaoChange(c.iptu, "ca", e.target.value)} className="w-20 text-center bg-secondary p-1 rounded-sm"/>
                      </td>
                      <td className="p-1 border">
                        <input type="number" value={c.divisor || ""} onChange={(e) => handleCondicaoChange(c.iptu, "divisor", e.target.value)} className="w-20 text-center bg-secondary p-1 rounded-sm"/>
                      </td>

                      {/* --- CAMPOS CALCULADOS --- */}
                      <td className="p-1 border">{unidadesCalculadas}</td>
                      <td className="p-1 border">
                        {custoPorUnidade.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-1 border">
                        <input type="text" value={c.condicaoTexto} 
                        onChange={(e) => handleCondicaoChange(c.iptu, "condicaoTexto", e.target.value)} 
                        onBlur={(e) => handleCondicaoChange(c.iptu, "condicaoTexto", capitalizeFirstLetter(e.target.value))}
                        className="w-full text-left bg-secondary p-1 rounded-sm"/>
                      </td>

                      <td className="p-1 border">
                        <select value={c.situacao} onChange={(e) => handleCondicaoChange(c.iptu, "situacao", e.target.value)} className="w-full bg-secondary p-1 rounded-sm">
                          <option>NEGOCIAÇÃO</option>
                          <option>CONTRATO</option>
                          <option>FINALIZADO</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="font-bold bg-muted">
                <tr>
                  <td className="p-2 border">TOTAL</td>
                  <td className="p-2 border">{totaisCondicoes.m2.toFixed(2)}</td>
                  <td className="p-2 border">{totaisCondicoes.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                  <td className="p-2 border">{totaisCondicoes.aluguel.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                  <td className="p-2 border">{totaisCondicoes.permutaLoja.toFixed(1)}</td>
                  <td className="p-2 border">{totaisCondicoes.permutaApto.toFixed(1)}</td>
                  <td className="p-2 border">{totaisCondicoes.totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                  <td className="p-2 border">
                    {(totaisCondicoes.m2 > 0 ? totaisCondicoes.totalGeral / totaisCondicoes.m2 : 0).toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
                  </td>
                  
                  {/* --- COLUNAS VAZIAS DO RODAPÉ (CA e Divisor) --- */}
                  <td className="p-2 border"></td>
                  <td className="p-2 border"></td>
                  
                  <td className="p-2 border">{totaisCondicoes.unidadesGeradas}</td>
                  <td className="p-2 border">
                    {(totaisCondicoes.unidadesGeradas > 0 ? totaisCondicoes.totalGeral / totaisCondicoes.unidadesGeradas : 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 border"></td>
                  <td className="p-2 border"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t">
            <button onClick={() => setIsModalOpen(false)} className="rounded-md bg-muted px-4 py-2 text-sm font-medium hover:bg-secondary">Fechar</button>
            <button onClick={handleSaveCondicoes} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Salvar</button>
          </div>
        </div>
      </div>
    </>
  );
}