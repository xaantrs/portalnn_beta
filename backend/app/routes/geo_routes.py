from flask import Blueprint, request, jsonify
from ..services.geosampa_service import query_geosampa

geo_bp = Blueprint('geo_bp', __name__)

@geo_bp.route('/consulta-sql', methods=['GET'])
def consulta_sql():
    setor = request.args.get("setor")
    quadra = request.args.get("quadra")
    lote = request.args.get("lote")

    if not all([setor, quadra, lote]):
        return jsonify({"erro": "Parâmetros 'setor', 'quadra' e 'lote' são obrigatórios."}), 400

    try:
        data = query_geosampa(setor, quadra, lote)
        if not data or not data.get("features"):
             return jsonify({"erro": "Lote não encontrado"}), 404
        return jsonify(data)
    except Exception as e:
        # Log do erro seria ideal aqui
        print(f"Erro na rota consulta_sql: {e}")
        return jsonify({"erro": "Falha ao consultar o serviço externo."}), 500