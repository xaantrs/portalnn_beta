from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.secret_key = 'metrocasa-secret-key-2024'

    # Habilita o CORS para permitir requisições do frontend
    CORS(app, supports_credentials=True)

    # Importa e registra as rotas (Blueprints)
    from .routes.auth_routes import auth_bp
    from .routes.geo_routes import geo_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(geo_bp, url_prefix='/api/geo')

    return app