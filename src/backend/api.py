from fastapi import FastAPI, HTTPException
from rag import RAGAssistantWithSQLite

app = FastAPI()
rag_assistant = RAGAssistantWithSQLite()

@app.post("/api")
async def generate_response(data: dict):
    try:
        message = data.get("message", "").strip()
        if not message:
            raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío.")

        response = rag_assistant.generate_response(message)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))