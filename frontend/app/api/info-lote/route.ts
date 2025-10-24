import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
        return NextResponse.json({ erro: "Latitude e Longitude são obrigatórias" }, { status: 400 });
    }

    // O GeoSampa usa um BBOX para o GetFeatureInfo. Vamos criar um pequeno BBOX ao redor do ponto.
    const delta = 0.0001;
    const bbox = `${parseFloat(lng) - delta},${parseFloat(lat) - delta},${parseFloat(lng) + delta},${parseFloat(lat) + delta}`;

    const params = new URLSearchParams({
        service: 'WMS',
        version: '1.1.1',
        request: 'GetFeatureInfo',
        layers: 'geoportal:lote_cidadao',
        query_layers: 'geoportal:lote_cidadao',
        info_format: 'application/json',
        srs: 'EPSG:4326', // Pedindo no formato Lat/Lng
        bbox: bbox,
        width: '101',
        height: '101',
        x: '50', // Coordenada x do pixel central
        y: '50', // Coordenada y do pixel central
    });

    const url = `https://wms.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wms?${params.toString()}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Serviço GeoSampa indisponível ou com erro: Status ${response.status}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
             throw new Error("O serviço GeoSampa não retornou um JSON válido.");
        }

        const data = await response.json();
        if (!data.features || data.features.length === 0) {
            return NextResponse.json({ erro: "Nenhum lote encontrado neste ponto." }, { status: 404 });
        }

        const props = data.features[0].properties;
        const loteInfo = {
            setor: props.cd_setor_fiscal,
            quadra: props.cd_quadra_fiscal,
            lote: props.cd_lote,
            iptu: `${props.cd_setor_fiscal}.${props.cd_quadra_fiscal}.${props.cd_lote}-${props.cd_digito_sql}`,
            area: props.qt_area_terreno || 0,
            endereco: `${props.nm_logradouro_completo || 'N/A'}, ${props.cd_numero_porta || 'S/N'}`,
            dadosCompletos: data.features[0] // Reprojecao nao eh necessaria aqui, pois ja pedimos em EPSG:4326
        };

        return NextResponse.json(loteInfo);

    } catch (error: any) {
        console.error("Erro na API /info-lote:", error.message);
        return NextResponse.json({ erro: "Falha ao consultar informações do lote.", details: error.message }, { status: 500 });
    }
}