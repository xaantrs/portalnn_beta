import urllib3
import json
from pyproj import Transformer
from shapely.geometry import shape, mapping
import shapely.ops as ops

http = urllib3.PoolManager()
# Define o transformador de coordenadas uma vez para ser reutilizado
transformer = Transformer.from_crs("EPSG:31983", "EPSG:4326", always_xy=True)

def _reproject_geojson(geojson):
    """Reprojeta as geometrias de um GeoJSON de EPSG:31983 para EPSG:4326."""
    for feature in geojson.get("features", []):
        try:
            geom = shape(feature["geometry"])
            geom_wgs84 = ops.transform(transformer.transform, geom)
            feature["geometry"] = mapping(geom_wgs84)
        except Exception as e:
            print(f"Aviso: Erro ao reprojetar geometria: {e}")
            # Continua mesmo que uma geometria falhe
    return geojson

def query_geosampa(setor: str, quadra: str, lote: str):
    """Consulta o serviço WFS do GeoSampa para um lote específico."""
    url = "https://wms.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wms"
    cql_filter = f"cd_setor_fiscal='{setor}' AND cd_quadra_fiscal='{quadra}' AND cd_lote='{lote}'"

    params = {
        "service": "WFS",
        "version": "1.0.0",
        "request": "GetFeature",
        "typeName": "geoportal:lote_cidadao",
        "outputFormat": "application/json",
        "CQL_FILTER": cql_filter
    }

    try:
        resp = http.request('GET', url, fields=params)
        if resp.status != 200:
            raise Exception(f"Serviço GeoSampa retornou status {resp.status}")
        
        data = json.loads(resp.data.decode('utf-8'))
        
        # Reprojeta as coordenadas para o padrão WGS84 (Lat/Lng) usado pelo Leaflet
        reprojected_data = _reproject_geojson(data)
        return reprojected_data

    except Exception as e:
        print(f"Erro na requisição ao GeoSampa: {e}")
        # Relança a exceção para que a rota possa tratá-la
        raise e