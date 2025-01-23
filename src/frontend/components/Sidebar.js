import React, { useState, useEffect, useRef } from "react";
import { FiEdit2, FiTrash2, FiShare2 } from "react-icons/fi";
import { PlusIcon, DocumentArrowUpIcon } from "@heroicons/react/24/solid";

const Sidebar = ({
  conversations,
  onSelectConversation,
  currentConversationId,
  onDeleteConversation,
  onEditConversationTitle,
  onNewConversation,
  onUploadDocument,
  // ...
  darkMode,
  toggleDarkMode,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [menuVisible, setMenuVisible] = useState(null);
  const menuRef = useRef();

  // Input file ref
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onUploadDocument(file);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuVisible(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const handleMenuToggle = (e, convId) => {
    e.stopPropagation();
    setMenuVisible(menuVisible === convId ? null : convId);
  };

  const handleEdit = (id) => {
    const newTitle = prompt("Editar título de la conversación:", "");
    if (newTitle) onEditConversationTitle(id, newTitle);
    setMenuVisible(null);
  };

  const handleDelete = (id) => {
    if (confirm("¿Eliminar esta conversación?")) {
      onDeleteConversation(id);
    }
    setMenuVisible(null);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sidebar">
      {/* Buscador */}
      <div className="search-bar-container">
        <svg
          className="search-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-4.35-4.35m1.1-5.65a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
          ></path>
        </svg>
        <input
          type="text"
          placeholder="Buscar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
      </div>

      {/* Botones de acción */}
      <div className="sidebar-buttons flex items-center space-x-2">
        <button onClick={onNewConversation} className="action-button">
          <PlusIcon className="h-6 w-6" />
        </button>

        {/* Botón para subir Excel/CSV */}
        <button onClick={handleUploadClick} className="action-button">
          <DocumentArrowUpIcon className="h-6 w-6" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xls,.xlsx,.csv"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Toggle modo oscuro/claro */}
        <label
          htmlFor="toggleDarkMode"
          className="toggle-button relative inline-block w-12 h-6 select-none"
        >
          <input
            id="toggleDarkMode"
            type="checkbox"
            checked={darkMode}
            onChange={toggleDarkMode}
            className="sr-only peer"
          />
          <span className="absolute inset-0 bg-gray-400 rounded-full peer-checked:bg-gray-600" />
          <span className="absolute left-0 top-0 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center peer-checked:translate-x-6 peer-checked:bg-gray-300">
            {darkMode ? "🌙" : "☀️"}
          </span>
        </label>
      </div>

      {/* Lista de conversaciones */}
      <ul className="sidebar-list">
        {filteredConversations.map((conv) => (
          <li
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={`sidebar-item ${
              conv.id === currentConversationId ? "selected" : ""
            }`}
          >
            <div className="conversation-title">
              <span>{conv.title}</span>
              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => handleMenuToggle(e, conv.id)}
                  className="ellipsis-button"
                >
                  &#x22EE;
                </button>
                {menuVisible === conv.id && (
                  <div
                    ref={menuRef}
                    className="context-menu"
                    style={{
                      position: "absolute",
                      top: "0",
                      right: "-190px",
                      zIndex: 9999,
                    }}
                  >
                    <button onClick={() => handleEdit(conv.id)}>
                      <FiEdit2 className="menu-icon" /> Editar
                    </button>
                    <button>
                      <FiShare2 className="menu-icon" /> Compartir
                    </button>
                    <button
                      onClick={() => handleDelete(conv.id)}
                      className="delete-button"
                    >
                      <FiTrash2 className="menu-icon delete-icon" /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;