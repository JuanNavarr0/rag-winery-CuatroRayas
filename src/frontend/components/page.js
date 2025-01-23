"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import ChatInput from "./ChatInput";

export default function Home() {
  // Estado para modo oscuro/claro
  const [darkMode, setDarkMode] = useState(true);
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const [conversations, setConversations] = useState([
    { id: 1, title: "Nueva conversación", messages: [] },
  ]);
  const [currentConversationId, setCurrentConversationId] = useState(1);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const currentMessages =
    conversations.find((conv) => conv.id === currentConversationId)?.messages ||
    [];

  // Subida de documento Excel/CSV
  const handleUploadDocument = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:4000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        console.log("Upload exitoso:", data);
        alert(`Archivo subido y procesado: ${data.filename}`);
      } else {
        console.error("Error subiendo archivo:", data);
        alert(`Error subiendo archivo: ${data.error}`);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error subiendo archivo");
    }
  };

  // Lógica para enviar mensaje a /query
  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    const userMessage = { role: "user", content: message };
    const updatedMessages = [...currentMessages, userMessage];
    updateConversationMessages(updatedMessages);

    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:4000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: message }),
      });

      const data = await response.json();
      const assistantMessage = {
        role: "assistant",
        content: data.response || "Error en la respuesta",
        sources: data.documents.map((doc) => doc.title) || [],
      };

      updateConversationMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error("Error enviando mensaje:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConversationMessages = (newMessages) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConversationId
          ? { ...conv, messages: newMessages }
          : conv
      )
    );
  };

  const handleNewConversation = () => {
    const newId = Math.max(...conversations.map((conv) => conv.id)) + 1;
    const newConversation = {
      id: newId,
      title: "Nueva conversación",
      messages: [],
    };
    setConversations((prev) => [...prev, newConversation]);
    setCurrentConversationId(newId);
  };

  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
  };

  const handleDeleteConversation = (id) => {
    setConversations((prev) => {
      const updatedConversations = prev.filter((conv) => conv.id !== id);
      if (id === currentConversationId && updatedConversations.length > 0) {
        setCurrentConversationId(updatedConversations[0].id);
      } else if (updatedConversations.length === 0) {
        setCurrentConversationId(null);
      }
      return updatedConversations;
    });
  };

  const handleEditConversationTitle = (id, newTitle) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === id ? { ...conv, title: newTitle } : conv))
    );
  };

  return (
    <div
      className={`flex h-screen ${
        darkMode ? "bg-[#3b3b3b] text-white" : "bg-white text-black"
      }`}
    >
      <Sidebar
        conversations={conversations}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onEditConversationTitle={handleEditConversationTitle}
        currentConversationId={currentConversationId}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        // Pasamos la función de subir documento
        onUploadDocument={handleUploadDocument}
      />

      <div className="flex flex-col flex-grow p-4">
        {currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-grow">
            <h1 className="text-3xl font-semibold mb-4">¿En qué puedo ayudarte?</h1>
            <ChatInput
              onSend={handleSendMessage}
              input={input}
              setInput={setInput}
            />
          </div>
        ) : (
          <>
            <div className="flex-grow overflow-y-auto space-y-4">
              {currentMessages.map((msg, index) => {
                const isUser = msg.role === "user";
                const userDark = "bg-gray-600 text-white rounded-lg";
                const userLight = "bg-gray-200 text-black rounded-lg";
                const assistantDark = "text-gray-200";
                const assistantLight = "text-gray-800";
                const messageClasses = isUser
                  ? darkMode
                    ? userDark
                    : userLight
                  : darkMode
                  ? assistantDark
                  : assistantLight;
                const alignment = isUser ? "justify-end" : "justify-center";

                return (
                  <div key={index} className={`flex ${alignment}`}>
                    <div className={`p-3 max-w-3xl ${messageClasses}`}>
                      <p>{msg.content}</p>

                      {msg.role === "assistant" && msg.sources?.length > 0 && (
                        <div
                          className={`mt-2 text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          <p className="font-semibold">Fuentes:</p>
                          <ul>
                            {msg.sources.map((source, i) => (
                              <li key={i} className="font-bold">
                                {source}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-center items-center">
                  <p className="text-gray-400 animate-pulse">Pensando...</p>
                </div>
              )}
            </div>
            <ChatInput onSend={handleSendMessage} input={input} setInput={setInput} />
          </>
        )}
      </div>
    </div>
  );
}