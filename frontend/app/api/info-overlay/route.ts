import { type NextRequest, NextResponse } from "next/server";

// Esta API recebe uma latitude/longitude e busca as informações do LOTE naquele ponto.
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
        return NextResponse.json({ erro: "Latitude e Longitude são obrigatórias" }, { status: 400 });
    }

    // O GeoSampa usa um BBOX (uma "caixa") para o GetFeatureInfo. 
    // Vamos criar um BBOX muito pequeno ao redor do ponto de clique.
    const delta = 0.0001; 
    const bbox = `${parseFloat(lng) - delta},${parseFloat(lat) - delta},${parseFloat(lng) + delta},${parseFloat(lat) + delta}`;

    // Parâmetros para a requisição WMS GetFeatureInfo
    const params = new URLSearchParams({
        service: 'WMS',
        version: '1.1.1',
        request: 'GetFeatureInfo',
        layers: 'geoportal:lote_cidadao',    // Busca APENAS na camada de lote
        query_layers: 'geoportal:lote_cidadao',
        info_format: 'application/json',
        srs: 'EPSG:4326', // Pede os dados no formato Lat/Lng
        bbox: bbox,
        width: '101',
        height: '101',
        x: '50', // Píxel central x
        y: '50', // Píxel central y
    });

    const url = `https://wms.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wms?${params.toString()}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Serviço GeoSampa indisponível: Status ${response.status}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
             throw new Error("O serviço GeoSampa não retornou um JSON válido.");
        }

        const data = await response.json();
        
        if (!data.features || data.features.length === 0) {
            return NextResponse.json({ erro: "Nenhum lote encontrado neste ponto." }, { status: 404 });
        }

        // Pega as propriedades do lote encontrado
        const props = data.features[0].properties;
        
        // Monta o objeto Lote exatamente como o seu componente geosampa-map espera
        const loteInfo = {
            setor: props.cd_setor_fiscal,
            quadra: props.cd_quadra_fiscal,
            lote: props.cd_lote,
            iptu: `${props.cd_setor_fiscal}.${props.cd_quadra_fiscal}.${props.cd_lote}-${props.cd_digito_sql}`,
            area: props.qt_area_terreno || 0,
            endereco: `${props.nm_logradouro_completo || 'N/A'}, ${props.cd_numero_porta || 'S/N'}`,
            dadosCompletos: data.features[0]
        };

        // Retorna o objeto Lote para o seu componente
        return NextResponse.json(loteInfo);

    } catch (error: any) {
        console.error("Erro na API /info-lote:", error.message);
        return NextResponse.json({ erro: "Falha ao consultar informações do lote.", details: error.message }, { status: 500 });
    }
}