from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import os

app = Flask(__name__)

# --- CONFIGURAÇÃO CORS ---
# Enquanto testa, libera qualquer domínio. Depois, coloque o domínio do frontend.
CORS(app)

# --- CONEXÃO COM O MONGODB ATLAS ---
uri = os.getenv("MONGO_URI")

try:
    client = MongoClient(uri, server_api=ServerApi('1'))
    client.admin.command('ping')  # Teste rápido
    print("✅ CONECTADO! O Banco de Dados respondeu.")
except Exception as e:
    print(f"❌ Erro na conexão: {e}")

# Define onde buscar os dados
db = client['db_quiz']
collection_perguntas = db['perguntas']

# --- ROTA 1: HOME ---
@app.route('/')
def home():
    return "Backend Limpo está ON! 🚀"

# --- ROTA 2: ENTREGAR PERGUNTAS ---
@app.route('/perguntas')
def get_perguntas():
    try:
        perguntas = list(collection_perguntas.find({}, {'_id': 0}))
        return jsonify(perguntas)
    except Exception as e:
        print(f"Erro Mongo: {e}")
        return jsonify({"erro": "Serviço temporariamente indisponível"}), 500

if __name__ == '__main__':
    # Porta dinâmica para Render
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
