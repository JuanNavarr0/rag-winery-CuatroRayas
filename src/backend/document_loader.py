import os
import json
from PyPDF2 import PdfReader

def extract_text_from_pdfs(input_folder, output_json):
    documents = []
    try:
        for filename in os.listdir(input_folder):
            if filename.endswith(".pdf"):
                filepath = os.path.join(input_folder, filename)
                print(f"Extrayendo texto de: {filename}")
                
                pdf_reader = PdfReader(filepath)
                full_text = ""
                for page in pdf_reader.pages:
                    full_text += page.extract_text() + "\n"

                documents.append({"filename": filename, "text": full_text})

        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(documents, f, ensure_ascii=False, indent=4)
        print(f"Texto extraído guardado en: {output_json}")
    except Exception as e:
        print(f"Error extrayendo texto: {e}")

if __name__ == "__main__":
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
    input_folder = os.path.join(base_dir, 'data/raw/pdfs')
    output_json = os.path.join(base_dir, 'data/processed/texto_extraido/documentos_texto.json')
    extract_text_from_pdfs(input_folder, output_json)