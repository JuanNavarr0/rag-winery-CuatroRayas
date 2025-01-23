import pandas as pd
import json
import sys
import os

def process_excel_fully_generic(input_file, output_file):
    try:
        sheets = pd.read_excel(input_file, sheet_name=None)

        all_documents = []

        for sheet_name, df in sheets.items():
            df.columns = df.columns.map(str).str.strip()
            rows = df.to_dict(orient="records")

            for row in rows:
                text = ' '.join([str(value) for value in row.values() if value is not None])

                document = {
                    "filename": os.path.basename(input_file),
                    "title": row.get("Título", "Sin título"),
                    "date": row.get("Fecha", "Desconocida"),
                    "description": row.get("Descripción", "Sin descripción"),
                    "text": text
                }

                all_documents.append(document)

        os.makedirs(os.path.dirname(output_file), exist_ok=True)

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_documents, f, ensure_ascii=False, indent=4)

        print(f"Datos extraídos de '{input_file}' guardados en '{output_file}'.")

    except Exception as e:
        print(f"Error procesando el archivo Excel: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    input_excel = sys.argv[1]
    output_json = sys.argv[2]
    process_excel_fully_generic(
        os.path.abspath(input_excel),
        os.path.abspath(output_json)
    )