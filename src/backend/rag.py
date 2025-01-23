import os
import sqlite3
import numpy as np
import json
import sys
from datetime import datetime
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
from openai import OpenAI

# Cargar variables de entorno
load_dotenv()

class RAGAssistantWithSQLite:
    def __init__(self):
        # 1) Modelo de embeddings
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # 2) Cliente de OpenAI
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # 3) Directorio base del proyecto
        self.base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
        
        # 4) Base de datos SQLite
        db_path = os.path.join(self.base_dir, 'data/processed/embeddings/documentos.db')
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()

        # 5) Crear tabla (drop si existe) con las columnas adecuadas
        self.cursor.execute("DROP TABLE IF EXISTS documentos")
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS documentos (
                id INTEGER PRIMARY KEY,
                filename TEXT,
                title TEXT,
                date TEXT,
                description TEXT,
                text TEXT,
                embedding BLOB
            )
        ''')
        self.conn.commit()

        # 6) Cargar documentos desde las carpetas relevantes y procesarlos
        self.load_and_process_documents()

    def load_and_process_documents(self):
        # Directorios de los documentos
        folders_to_process = [
            os.path.join(self.base_dir, 'data/processed/texto_extraido'),
            os.path.join(self.base_dir, 'data/processed/nuevos_documentos')
        ]

        all_documents = []
        for folder_path in folders_to_process:
            if not os.path.exists(folder_path):
                print(f"No existe la carpeta: {folder_path}")
                continue

            # Obtenemos todos los archivos .json en la carpeta
            json_files = [f for f in os.listdir(folder_path) if f.endswith('.json')]

            for json_file in json_files:
                full_json_path = os.path.join(folder_path, json_file)
                # Leemos el contenido
                with open(full_json_path, 'r', encoding='utf-8') as f:
                    docs = json.load(f)
                    all_documents.extend(docs)  # Acumulamos

        # Insertamos cada documento en la tabla con su embedding
        for doc in all_documents:
            filename = doc.get('filename', 'sin_archivo')
            title = doc.get('title', filename)
            date = doc.get('date', "Desconocida")
            description = doc.get('description', "Sin descripción")
            text = doc.get('text', "")

            # Generamos embedding
            embedding = self.embedding_model.encode(text)
            embedding_blob = np.array(embedding).tobytes()

            # Insertar/actualizar en la BD
            self.cursor.execute('''
                INSERT OR REPLACE INTO documentos
                (filename, title, date, description, text, embedding)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (filename, title, date, description, text, embedding_blob))

        self.conn.commit()

    def search_relevant_docs(self, query, top_k=3):
        query_embedding = self.embedding_model.encode(query)

        self.cursor.execute("SELECT title, date, description, text, embedding FROM documentos")
        results = self.cursor.fetchall()

        docs_with_similarity = []
        for title, date, description, text, embedding_blob in results:
            embedding = np.frombuffer(embedding_blob, dtype=np.float32)
            similarity = np.dot(query_embedding, embedding) / (np.linalg.norm(query_embedding) * np.linalg.norm(embedding))
            docs_with_similarity.append((similarity, title, date, description, text))

        docs_with_similarity.sort(reverse=True, key=lambda x: x[0])
        return docs_with_similarity[:top_k]

    def truncate_text(self, text, max_length=500):
        return text if len(text) <= max_length else text[:max_length] + "..."

    def generate_response(self, query):
        relevant_docs = self.search_relevant_docs(query, top_k=2)
        if not relevant_docs:
            return json.dumps({
                "response": "No se encontraron documentos relevantes para responder a tu consulta.",
                "documents": []
            })

        # Construir contexto
        context_parts = []
        formatted_docs = []
        for i, doc in enumerate(relevant_docs, 1):
            similarity, title, date, description, text = doc
            truncated_text = self.truncate_text(text)
            context_parts.append(f"[Documento {i}] {title} (Fecha: {date}) - {description}:\n{truncated_text}")
            formatted_docs.append({
                "id": i,
                "title": title,
                "date": date,
                "description": description,
                "content": truncated_text
            })

        context = "\n\n".join(context_parts)

        messages = [
            {
                "role": "system",
                "content": (
                    "Eres un asistente experto en vinos y enología. "
                    "Adapta el nivel de detalle de tu respuesta a la complejidad de la pregunta."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Basándote en el siguiente contexto, responde la pregunta.\n\n"
                    f"Contexto:\n{context}\n\n"
                    f"Pregunta: {query}"
                )
            }
        ]

        try:
            response = self.client.chat.completions.create(
                model="ft:gpt-3.5-turbo-0125:upgrade-hub::AgBTnYt7",
                messages=messages,
                temperature=0.1,
                max_tokens=1500
            )

            answer = response.choices[0].message.content.strip()
            return json.dumps({
                "response": answer,
                "documents": formatted_docs
            })

        except Exception as e:
            return json.dumps({
                "error": str(e),
                "response": "Lo siento, hubo un error al procesar tu consulta.",
                "documents": []
            })

if __name__ == "__main__":
    rag_assistant = RAGAssistantWithSQLite()
    
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
    else:
        query = "¿Cuál es la historia de la bodega?"

    response = rag_assistant.generate_response(query)
    print(response)