import { type NextRequest, NextResponse } from "next/server";
import proj4 from "proj4";

// As funções de reprojeção que você já tem continuam aqui...
const sourceProjection = "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
const destProjection = "EPSG:4326";
const reprojectCoordinate = (coord: number[]): number[] => {
  if (!coord || coord.length < 2) return [];
  return proj4(sourceProjection, destProjection, [coord[0], coord[1]]);
};
const reprojectGeometry = (geometry: any): any => {
    if (!geometry) return null;
    switch (geometry.type) {
        case 'Point': geometry.coordinates = reprojectCoordinate(geometry.coordinates); break;
        case 'LineString': case 'MultiPoint': geometry.coordinates = geometry.coordinates.map(reprojectCoordinate); break;
        case 'Polygon': case 'MultiLineString': geometry.coordinates = geometry.coordinates.map((ring: number[][]) => ring.map(reprojectCoordinate)); break;
        case 'MultiPolygon': geometry.coordinates = geometry.coordinates.map((polygon: number[][][]) => polygon.map((ring) => ring.map(reprojectCoordinate))); break;
    }
    return geometry;
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const setor = searchParams.get("setor");
  const quadra = searchParams.get("quadra");
  const lote = searchParams.get("lote");

  if (!setor || !quadra || !lote) {
    return NextResponse.json({ erro: "Preencha setor, quadra e lote" }, { status: 400 });
  }

  const baseUrl = "https://wms.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wms";
  const cql_filter = `cd_setor_fiscal='${setor}' AND cd_quadra_fiscal='${quadra}' AND cd_lote='${lote}'`;
  
  const params = new URLSearchParams({
    service: "WFS", version: "1.0.0", request: "GetFeature",
    typeName: "geoportal:lote_cidadao", outputFormat: "application/json",
    CQL_FILTER: cql_filter,
  });

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`);

    // --- CORREÇÃO ADICIONADA AQUI ---
    // 1. Verifica se a resposta do GeoSampa foi bem-sucedida
    if (!response.ok) {
        const errorText = await response.text(); // Lê a resposta como texto (pode ser HTML)
        console.error("GeoSampa Error Body:", errorText);
        throw new Error(`O serviço GeoSampa retornou um erro: Status ${response.status}`);
    }

    // 2. Verifica se a resposta é realmente JSON antes de processar
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        console.error("GeoSampa Non-JSON Response:", responseText);
        throw new Error("O serviço GeoSampa não retornou um JSON válido.");
    }
    // --- FIM DA CORREÇÃO ---

    const data = await response.json();

    if (data.features) {
      data.features.forEach((feature: any) => {
        feature.geometry = reprojectGeometry(feature.geometry);
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro na API /consulta-sql:", error.message);
    return NextResponse.json({ erro: "Falha ao consultar o serviço GeoSampa.", details: error.message }, { status: 500 });
  }
}