// frontend/utils/pptxGenerator.ts

import { url } from "inspector";

// --- Tipos Necessários ---

// 1. INTERFACE LOTE ATUALIZADA (para bater com a de GeoSampaMap.tsx)
interface Lote {
  iptu: string;
  setor: string;
  quadra: string;
  lote: string;
  area: number;
  endereco: string;
  distrito?: string;
  dadosCompletos: any;
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
  ca: number;
  divisor: number;
  condicaoTexto?: string;
  situacao: string;
}

type TotaisCondicoes = {
  m2: number;
  valor: number;
  aluguel: number;
  permutaLoja: number;
  permutaApto: number;
  unidadesGeradas: number;
  totalGeral: number;
};

// 2. INTERFACE DE PARÂMETROS ATUALIZADA
interface GeneratePresentationParams {
  lotePrincipal: Lote;
  condicoes: CondicaoComercial[];
  totaisCondicoes: TotaisCondicoes;
  mapImageBase64: string;
  corretor: string;
  codigo: number | string;
  enderecoCompleto: string;
  usoImovel: string;
  larguraCalcada: string;
  unidadeGeotecnica: string;
  analista: string;
  gerente: string;
  loja: number;
  apto: number;
}

// --- Função Principal Exportada ---

// 3. ASSINATURA DA FUNÇÃO ATUALIZADA
export async function generatePresentation({
  lotePrincipal,
  condicoes,
  totaisCondicoes,
  mapImageBase64,
  corretor,
  codigo,
  loja,
  apto,
  enderecoCompleto,
  usoImovel,
  larguraCalcada,
  unidadeGeotecnica,
  analista,
  gerente,
}: GeneratePresentationParams): Promise<string> {
  try {
    if (typeof window.PptxGenJS === 'undefined') {
      throw new Error('Biblioteca PptxGenJS não carregada.');
    }

    let pptx = new window.PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    // --- SLIDE 1: MAPA E RESUMO (LAYOUT MODIFICADO) ---
    let slideResumo = pptx.addSlide();
    slideResumo.background = { color: 'FFFFFF' }; // Fundo branco

    const imageHeightInCm = 8.97;
    const imageWidthInCm = 11.94;
    const cmToInch = 2.54;

    const imageHeightInInches = imageHeightInCm / cmToInch; // ~3.53 polegadas
    const imageWidthInInches = imageWidthInCm / cmToInch;   // ~4.54 polegadas

    // --- ETAPA 1: Adicionar a imagem do mapa (quadrada) ---
    slideResumo.addImage({
      data: `data:image/png;base64,${mapImageBase64}`,
      x: 0.1, // Margem esquerda
      y: 0.30, // Margem superior
      w: imageWidthInInches,  // Largura da imagem em polegadas
      h: imageHeightInInches, // Altura da imagem em polegadas
    });

  // Coluna 2: Textos
    const textX = 4.866;  
    const textW = 2.85;
    let currentY = 0.4; // Posição Y inicial
    
    const rectHeightInInches = imageHeightInInches; // Mesma altura da imagem
    const rectWidthInCm = 12.7; // Largura específica para o retângulo
    const rectWidthInInches = rectWidthInCm / cmToInch; // ~5.00 polegadas

    slideResumo.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 4.88,
      y: 0.30,
      w: rectWidthInInches,
      h: rectHeightInInches,
      fill: { color: 'FFFFFF' },
      rectRadius: 0.1,
      });

    // Extrair dados
    const enderecoCompletoStr = enderecoCompleto || 'Endereço não informado';
    const areaTotalStr = totaisCondicoes.m2.toFixed(2) + ' m²';
    const codigoStr = String(codigo || 'N/I');
    const zoneamentoStr = lotePrincipal.zoneamento || 'N/I';
    const condLotePrincipal = condicoes.find(c => c.iptu === lotePrincipal.iptu);
    const caStr = String(condLotePrincipal?.ca || 'N/I');
    const unidadesStr = String(totaisCondicoes.unidadesGeradas);
    const usoStr = usoImovel || 'N/I';
    const calcadaStr = larguraCalcada || '';
    const geotecniaStr = unidadeGeotecnica || 'N/I';
    const corretorStr = corretor || 'N/I';
    const setorQuadraStr = `${lotePrincipal.setor} / ${lotePrincipal.quadra}`;
    const analistaStr = analista || 'N/I';
    const gerenteStr = gerente || 'N/I';

    // === ENDEREÇO COMPLETO (addText direto, alinhado à esquerda) ===
    const initialAddressY = currentY; // Salva o Y atual para o endereço
    slideResumo.addText(enderecoCompletoStr.toUpperCase(), {
      x: textX,
      y: initialAddressY,
      w: 5.0,
      h: 0.3, // Altura da caixa de texto
      fontSize: 14,
      fontFace: 'Segoe UI',
      color: '333333',
      bold: true,
      align: 'left',
      valign: 'top',
    });

    currentY = initialAddressY + 0.3 + 0.25;

    // Estilização padrão para label
    const commonLabelProps = {
      fontSize: 11,
      bold: true,
      align: 'left' as 'left',
      valign: 'top' as 'top',
      fontFace: 'Segoe UI',
      color: '333333',
      h: 0.2, // Altura padrão da caixa de texto da label
    };
    const commonLabelGap = 0.5; // Espaçamento entre label e valor
    const commonLineHeight = 0.20; // Altura total da linha (para incrementar currentY)

    // --- ÁREA ---
    slideResumo.addText('Área Total:', { ...commonLabelProps, x: textX, y: currentY, w: 2.0 });
    slideResumo.addText(areaTotalStr, {
      x: textX + 0.35 + commonLabelGap, y: currentY, w: textW + 1.0 - commonLabelGap, h: commonLabelProps.h,
      fontSize: 12, bold: false, align: 'left', valign: 'top', fontFace: 'Segoe UI', color: '333333',
    });
    currentY += commonLineHeight;

    // --- CÓDIGO ---
    slideResumo.addText('Código:', { ...commonLabelProps, x: textX, y: currentY, w: 2.0 });
    slideResumo.addText(codigoStr, {
      x: textX + 0.14 + commonLabelGap, y: currentY, w: textW + 1.5 - commonLabelGap, h: commonLabelProps.h,
      fontSize: 12, bold: false, align: 'left', valign: 'top', fontFace: 'Segoe UI', color: '333333',
    });
    currentY += commonLineHeight;

    // --- ZONEAMENTO ---
    slideResumo.addText('Zoneamento:', { ...commonLabelProps, x: textX, y: currentY, w: 2.0 });
    slideResumo.addText(zoneamentoStr, {
      x: textX + 0.51 + commonLabelGap, y: currentY, w: textW + 1.8 - commonLabelGap, h: commonLabelProps.h,
      fontSize: 12, bold: false, align: 'left', valign: 'top', fontFace: 'Segoe UI', color: '333333',
    });
    currentY += commonLineHeight;

    // --- CA (Coeficiente de Aproveitamento) ---
    slideResumo.addText('CA:', { ...commonLabelProps, x: textX, y: currentY, w: 2.0 });
    slideResumo.addText(caStr, {
      x: textX - 0.2 + commonLabelGap, y: currentY, w: textW - 1.0 - commonLabelGap, h: commonLabelProps.h,
      fontSize: 12, bold: false, align: 'left', valign: 'top', fontFace: 'Segoe UI', color: '333333',
    });
    currentY += commonLineHeight;

    // --- UNIDADES ---
    slideResumo.addText('Unidades:', { ...commonLabelProps, x: textX, y: currentY, w: 2.0 });
    slideResumo.addText(unidadesStr, {
      x: textX + 0.28 + commonLabelGap, y: currentY, w: textW - 1.0 - commonLabelGap, h: commonLabelProps.h,
      fontSize: 12, bold: false, align: 'left', valign: 'top', fontFace: 'Segoe UI', color: '333333',
    });
    currentY += commonLineHeight;

    // --- USO ---
    slideResumo.addText('Uso:', { ...commonLabelProps, x: textX, y: currentY, w: 2.6 }); // w personalizado
    slideResumo.addText(usoStr, {
      x: textX - 0.12 + commonLabelGap, y: currentY, w: textW + 1.8, h: commonLabelProps.h,
      fontSize: 12, bold: false, align: 'left', valign: 'top', fontFace: 'Segoe UI', color: '333333',
    });
    currentY += commonLineHeight;

    // --- CALÇADA (Média) ---
    slideResumo.addText('Calçada (Média):', { ...commonLabelProps, x: textX, y: currentY, w: 1.6 }); // w personalizado
    slideResumo.addText(calcadaStr, {
      x: textX + 0.76 + commonLabelGap, y: currentY, w: textW - 1.6 - commonLabelGap, h: commonLabelProps.h,
      fontSize: 12, bold: false, align: 'left', valign: 'top', fontFace: 'Segoe UI', color: '333333',
    });
    currentY += commonLineHeight;

    // --- UNIDADE GEOTÉCNICA ---
    slideResumo.addText('Unidade Geotécnica:', { ...commonLabelProps, x: textX, y: currentY, w: 2.0 }); // w personalizado
    slideResumo.addText(geotecniaStr, {
      x: textX + 1.04 + commonLabelGap, y: currentY, w: textW - 1.6 - commonLabelGap, h: commonLabelProps.h,
      fontSize: 12, bold: false, align: 'left', valign: 'top', fontFace: 'Segoe UI', color: '333333',
    });
    currentY += commonLineHeight;
    
    currentY += 0.1; // Espaço extra

    // --- CORRETOR ---
    slideResumo.addText('Corretor:', { ...commonLabelProps, x: textX, y: currentY, w: 2.0 }); // w personalizado
    slideResumo.addText(corretorStr.toUpperCase(), { // Valor do corretor em maiúsculas
      x: textX + 0.22 + commonLabelGap, y: currentY, w: textW - 0.9 - commonLabelGap, h: commonLabelProps.h,
      fontSize: 12, bold: false, align: 'left', valign: 'top', fontFace: 'Segoe UI', color: '333333',
    });
    currentY += commonLineHeight;
    
    // === SETOR / QUADRA ===
    // Label
    slideResumo.addText('SETOR / QUADRA:', {
      x: textX, 
      y: 0.65, 
      w: 1.4, h: 0.2, // Coordenadas e largura específicas para a label
      fontSize: 10, bold: false, 
      align: 'left', valign: 'top', 
      fontFace: 'Segoe UI', color: '7F7F7F',
    });

    // Valor
    slideResumo.addText(setorQuadraStr, {
      x: textX + 1.0 + 0.2, y: 0.65, w: 1.4, h: 0.2, // Coordenadas e largura específicas para o valor
      fontSize: 10, bold: false, align: 'left', valign: 'top', fontFace: 'Segoe UI', color: '7F7F7F',
    });

    currentY += 0.3; // Incrementa Y para a próxima linha


    slideResumo.addText('Comprador:', {
      x: 2.3, y: 0.05, w: 1.0, h: 0.3, // Coordenadas e largura específicas para a label
      fontSize: 10, bold: true, align: 'left', valign: 'middle', fontFace: 'Segoe UI', color: '333333',
    });

    // Valor
    slideResumo.addText(analistaStr, {
      x: 3.2, y: 0.05, w: textW - 1.0 - 0.1, h: 0.3, // Coordenadas e largura específicas para o valor
      fontSize: 11, bold: false, align: 'left', valign: 'middle', fontFace: 'Segoe UI', color: '333333',
    });
    // === GERENTE ===
    // Label
    slideResumo.addText('Gerente:', {
      x: 0.05, y: 0.05, w: 1.0, h: 0.3, // Coordenadas e largura específicas para a label
      fontSize: 10, bold: true, align: 'left', valign: 'middle', fontFace: 'Segoe UI', color: '333333',
    });
    // Valor
    slideResumo.addText(gerenteStr, {
      x: 0.69, y: 0.05, w: textW - 1.0 - 0.1, h: 0.3, // Coordenadas e largura específicas para o valor
      fontSize: 11, bold: false, align: 'left', valign: 'middle', fontFace: 'Segoe UI', color: '333333',
    });
    
    currentY += 0.1; // Espaço extra

    // Cabeçalho da Tabela
    const tableHeaderRow = [
       { text: "Lote", options: { bold: true, fill: 'FFABAB', fontSize: 8, align: 'center', valign: 'middle' } },
       { text: "m²", options: { bold: true, fill: 'FFABAB', fontSize: 8, align: 'center', valign: 'middle' } },
       { text: "R$", options: { bold: true, fill: 'FFABAB', fontSize: 8, align: 'center', valign: 'middle' } },
       { text: "Aluguel", options: { bold: true, fill: 'FFABAB', fontSize: 8, align: 'center', valign: 'middle' } },
       { text: "Loja m²", options: { bold: true, fill: 'FFABAB', fontSize: 8, align: 'center', valign: 'middle' } },
       { text: "Apto m²", options: { bold: true, fill: 'FFABAB', fontSize: 8, align: 'center', valign: 'middle' } },
       { text: "TOTAL", options: { bold: true, fill: 'FFABAB', fontSize: 8, align: 'center', valign: 'middle' } },
       { text: "Unid.", options: { bold: true, fill: 'FFABAB', fontSize: 8, align: 'center', valign: 'middle' } },
       { text: "Fração", options: { bold: true, fill: 'FFABAB', fontSize: 8, align: 'center', valign: 'middle' } },
       { text: "Observações", options: { bold: true, fill: 'FFABAB', fontSize: 8, align: 'center', valign: 'middle' } },
       { text: "Status", options: { bold: true, fill: 'FFABAB', fontSize: 8, align: 'center', valign: 'middle' } },
    ];

    // Linhas de Dados
    const tableDataRows = condicoes.map(c => {
      const v = Number(c.valor) || 0; const a = Number(c.aluguel) || 0;
      const valorPermutaLoja = (Number(c.permutaLoja) || 0) * loja;
      const valorPermutaApto = (Number(c.permutaApto) || 0) * apto;       
      const t = v + a + valorPermutaLoja + valorPermutaApto;
      const ca = Number(c.ca) || 0; const dv = Number(c.divisor) || 0;
      const u = (c.m2 > 0 && dv > 0) ? Math.floor((c.m2 * ca) / dv) : 0;
      const cpu = u > 0 ? t / u : 0;
      const fmtC = (n: number) => n === 0 ? '-' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const fmtN = (n: number | undefined | null) => Number(n || 0).toFixed(1);
      const defaultCellOptions = { fontSize: 8, align: 'center', valign: 'middle' };

       return [
        { text: (c.iptu.split("-")[0] || c.iptu).split(".").pop() || c.iptu, options: defaultCellOptions },         { text: c.m2.toFixed(2), options: defaultCellOptions },
         { text: fmtC(v), options: defaultCellOptions },
         { text: fmtC(a), options: defaultCellOptions },
         { text: fmtN(c.permutaLoja), options: defaultCellOptions },
         { text: fmtN(c.permutaApto), options: defaultCellOptions },
         { text: fmtC(t), options: defaultCellOptions },
         { text: u.toString(), options: defaultCellOptions },
         { text: fmtC(cpu), options: defaultCellOptions },
         { text: c.condicaoTexto || '-', options: defaultCellOptions },
         { text: c.situacao || '-', options: defaultCellOptions },
       ];
    });

    // Linha de Total
    const totais = totaisCondicoes;
    const fmtCT = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const totalCellOptions = { bold: true, fill: 'F0F0F0', align: 'center', fontSize: 8, valign: 'middle' }; 

    const totalRow = [
      { text: 'TOTAL', options: totalCellOptions },
      { text: totais.m2.toFixed(2), options: totalCellOptions },
      { text: fmtCT(totais.valor), options: totalCellOptions },
      { text: fmtCT(totais.aluguel), options: totalCellOptions },
      { text: totais.permutaLoja.toFixed(1), options: totalCellOptions },
      { text: totais.permutaApto.toFixed(1), options: totalCellOptions },
      { text: fmtCT(totais.totalGeral), options: totalCellOptions },
      { text: totais.unidadesGeradas.toString(), options: totalCellOptions },
      { text: (totais.unidadesGeradas > 0 ? fmtCT(totais.totalGeral / totais.unidadesGeradas) : '-'), options: totalCellOptions },
      { text: '', options: totalCellOptions }, // Placeholder Condição
      { text: '', options: totalCellOptions }, // Placeholder Situação
    ];

    const completeTableData = [ tableHeaderRow, ...tableDataRows, totalRow ];

    // Adiciona a Tabela ao Slide 2
    slideResumo.addTable(completeTableData, {
      x: 0.1, y: 3.9, w: 10.5, 
      colW: [0.53, 0.6, 1.1, 1.1, 0.6, 0.6, 1.1, 0.45, 1.0, 1.7, 1.0], 
      fontSize: 8,
      border: { type: 'solid', pt: 0.5, color: 'BBBBBB' },
      valign: 'center',
      align: ['center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center'],
    })

    // --- GERAÇÃO DO ARQUIVO ---
    const fileName = `Quadra - ${lotePrincipal.endereco.replace(/[.-]/g, '_')}.pptx`;
    await pptx.writeFile({ fileName: fileName });

    return `✅ Quadra '${fileName}' gerada com sucesso!`;

  } catch (error: any) {
    console.error("Erro detalhado na função generatePresentation:", error);
    throw new Error(`❌ Erro ao gerar PPTX: ${error.message || 'Erro desconhecido'}`);
  }
}