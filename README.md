# RAG System for Winery Knowledge Management

This repository contains a **Retrieval-Augmented Generation (RAG)** system developed for managing winery knowledge efficiently. It leverages fine-tuned GPT models, a custom SQLite database, and document processing tools to provide intelligent, context-aware responses to user queries.

## Features
- **Document Processing**: Extract and embed textual data from PDFs and Excel files.
- **Semantic Search**: Utilize SentenceTransformers to perform AI-powered document retrieval.
- **Interactive Chat Interface**: Query and interact with winery knowledge via a user-friendly React frontend.
- **Scalable Architecture**: Backend in Python and SQLite, frontend in React and TailwindCSS.

## Tech Stack
- **Backend**: Python, SQLite, SentenceTransformers, OpenAI GPT-3.5
- **Frontend**: Next.js, React, TailwindCSS
- **Data Processing**: Pandas, PyPDF2, JSON

## Installation
### Backend
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/rag_vinos.git
   cd rag_vinos
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up the environment variables:
   ```bash
   cp .env.example .env
   # Add your OpenAI API key in the .env file
   ```

4. Run the backend script:
   ```bash
   python src/backend/rag.py
   ```

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd src/frontend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage
1. Upload PDF or Excel files via the interface.
2. Query the knowledge base through the chat interface.
3. Get intelligent and context-aware responses powered by AI.

## License
This project is licensed under the MIT License.

---

## Next Steps
- **Testing and Debugging**: Ensure all components work together seamlessly.
- **Translation**: Convert comments and code to English for global collaboration.
- **Optimization**: Refactor the codebase for scalability and clarity.
