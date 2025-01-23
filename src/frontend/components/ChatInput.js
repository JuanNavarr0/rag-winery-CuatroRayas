import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { useRef, useEffect } from "react";

const ChatInput = ({ onSend, input, setInput }) => {
  const textareaRef = useRef(null);

  // Ajustar altura del textarea automáticamente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput(""); // Limpia el input después de enviar
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"; // Resetea la altura
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Evita el salto de línea con Enter
      handleSubmit(e); // Envía el mensaje
    }
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input-container">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        rows="1"
        placeholder="Escribe tu pregunta..."
        className="resize-none overflow-hidden" // Asegura un tamaño manejable
      />
      <button type="submit" aria-label="Enviar mensaje">
        <PaperAirplaneIcon className="h-5 w-5" />
      </button>
    </form>
  );
};

export default ChatInput;