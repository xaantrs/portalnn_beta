from flask import Blueprint, request, jsonify, session

auth_bp = Blueprint('auth_bp', __name__)

# Simulação de banco de dados de usuários com a hierarquia de equipes
USERS = {
    # Administrador
    'admin@metrocasa.com': {
        'password': 'admin123', 
        'name': 'Administrador', 
        'role': 'admin'
    },

    # --- Equipe Cassiano ---
    'cassiano@metrocasa.com.br': {
        'password': 'Metro@2025', 
        'name': 'Cassiano', 
        'role': 'gerente',
        'team': ['gustavo.remorini@metrocasa.com.br', 'allan.prado@metrocasa.com.br', 'vitor.andrade@metrocasa.com.br']
    },
    'gustavo.remorini@metrocasa.com.br': {'password': 'Metro@2025', 'name': 'Gustavo Remorini', 'role': 'analista'},
    'allan.prado@metrocasa.com.br': {'password': 'Metro@2025', 'name': 'Allan Prado', 'role': 'analista'},
    'vitor.andrade@metrocasa.com.br': {'password': 'Metro@2025', 'name': 'Vitor Andrade', 'role': 'analista'},

    # --- Equipe Ariane ---
    'ariane.veloso@metrocasa.com.br': {
        'password': 'Metro@2025', 
        'name': 'Ariane Veloso', 
        'role': 'gerente',
        'team': ['lucas.pasqualini@metrocasa.com.br', 'aline.rodrigues@metrocasa.com', 'guilherme.moreira@metrocasa.com']
    },
    'lucas.pasqualini@metrocasa.com.br': {'password': 'Metro@2025', 'name': 'Lucas Pasqualini', 'role': 'analista'},
    'aline.rodrigues@metrocasa.com': {'password': 'Metro@2025', 'name': 'Aline Rodrigues', 'role': 'analista'},
    'guilherme.moreira@metrocasa.com': {'password': 'Metro@2025', 'name': 'Guilherme Moreira', 'role': 'analista'},
    
    # --- Equipe Fernando ---
    'fernando.seii@metrocasa.com.br': {
        'password': 'Metro@2025', 
        'name': 'Fernando Seii', 
        'role': 'gerente',
        'team': ['juliane.boscardin@metrocasa.com', 'denise.araujo@metrocasa.com']
    },
    'juliane.boscardin@metrocasa.com': {'password': 'Metro@2025', 'name': 'Juliane Boscardin', 'role': 'analista'},
    'denise.araujo@metrocasa.com': {'password': 'Metro@2025', 'name': 'Denise Araujo', 'role': 'analista'},

    # --- Equipe Luisa ---
    'luisa.zanhar@metrocasa.com.br': {
        'password': 'Metro@2025', 
        'name': 'Luisa Zanhar', 
        'role': 'gerente',
        'team': ['arnon.cugola@metrocasa.com.br', 'cecilia.scheydegger@metrocasa.com.br']
    },
    'arnon.cugola@metrocasa.com.br': {'password': 'Metro@2025', 'name': 'Arnon Cugola', 'role': 'analista'},
    'cecilia.scheydegger@metrocasa.com.br': {'password': 'Metro@2025', 'name': 'Cecilia Scheydegger', 'role': 'analista'},
}

ANALYST_TO_MANAGER_MAP = {}
for email, user_data in USERS.items():
    if user_data.get('role') == 'gerente':
        manager_name = user_data['name']
        for analyst_email in user_data.get('team', []):
            ANALYST_TO_MANAGER_MAP[analyst_email] = manager_name

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = USERS.get(email)
    if user and user['password'] == password:
        session['user_email'] = email
        session['user_name'] = user['name']
        session['user_role'] = user['role']
        
        # Salva a equipe na sessão se o usuário for um gerente
        if user['role'] == 'gerente':
            session['user_team'] = user.get('team', []) # Salva a lista de e-mails da equipe

        return jsonify({
            "success": True,
            "user": {
                "name": user['name'],
                "email": email,
                "role": user['role']
            }
        })
    return jsonify({"success": False, "message": "Credenciais inválidas"}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"success": True})

@auth_bp.route('/me')
def me():
    if 'user_email' in session:
        user_email = session['user_email']
        user_name = session['user_name']
        user_role = session['user_role']

        user_data = {
            "name": user_name,
            "email": user_email,
            "role": user_role
        }

        # --- INÍCIO DA MODIFICAÇÃO ---
        # Adiciona o nome do gerente à resposta
        if user_role == 'analista':
            # Busca o gerente no mapa que criamos
            manager_name = ANALYST_TO_MANAGER_MAP.get(user_email, 'N/I') # 'N/I' se não achar
            user_data['manager_name'] = manager_name
        elif user_role == 'gerente':
            # Se o usuário é gerente, ele é o próprio "gerente"
            user_data['manager_name'] = user_name
        else:
            # Para outros roles (ex: admin)
            user_data['manager_name'] = 'N/I'
        # --- FIM DA MODIFICAÇÃO ---
            
        return jsonify({
            "isLoggedIn": True,
            "user": user_data # 'user_data' agora contém 'manager_name'
        })
    return jsonify({"isLoggedIn": False}), 401

# --- Como usar isso em outras rotas ---

# @app.route('/gerente') # Exemplo de como você usaria isso em outra rota
# def dashboard_gerente():
#     if 'user_email' not in session or session['user_role'] != 'gerente':
#         return "Acesso negado", 403
    
#     # Pega a lista de e-mails da equipe da sessão
#     team_emails = session.get('user_team', [])
    
#     # Você pode buscar os dados completos dos analistas
#     team_data = [USERS[email] for email in team_emails if email in USERS]
    
#     # Agora você pode passar 'team_data' para o seu template
#     # return render_template('gerente.html', team=team_data)
#     return jsonify(team_data)