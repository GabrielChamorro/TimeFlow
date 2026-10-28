import React, { useState, useRef, useEffect } from "react";
import { ENDPOINTS, apiFetch } from "../config/api_interaccion_backend";

export default function ChatView({ currentUser, collaborators = [], messages = [], onSendMessage }) {
  const [activeChatId, setActiveChatId] = useState("announcements");
  const [inputText, setInputText] = useState("");
  const [usersList, setUsersList] = useState(collaborators);
  const messagesEndRef = useRef(null);

  // Sincronizar lista de usuarios; si llega vacía, consultar la tabla usuarios directamente
  useEffect(() => {
    if (collaborators && collaborators.length > 0) {
      setUsersList(collaborators);
    } else {
      apiFetch(ENDPOINTS.USUARIOS)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setUsersList(data);
          }
        })
        .catch((err) => console.warn("hubo un error al sincronizar usuarios en chat:", err));
    }
  }, [collaborators]);

  const channels = [
    { id: "announcements", nombre: "Anuncios oficiales", tipo: "broadcast", subtitle: "Solo lectura para trabajadores" },
    { id: "general", nombre: "Chat general del equipo", tipo: "group", subtitle: "Todos los colaboradores" },
  ];

  // Resolver ID del usuario en sesión
  const currentUserId =
    currentUser?.id ||
    usersList.find((u) => u.email === currentUser?.email || u.nombre === currentUser?.nombre)?.id;

  // Filtrar todos los usuarios de la base de datos excepto el usuario actual
  const directContacts = usersList.filter((c) => {
    const isSameId = currentUserId && String(c.id) === String(currentUserId);
    const isSameName = currentUser?.nombre && c.nombre?.trim().toLowerCase() === currentUser.nombre?.trim().toLowerCase();
    return !isSameId && !isSameName;
  });

  const activeChannel = channels.find((c) => c.id === activeChatId);
  const activeContact = directContacts.find((c) => `dm-${c.id}` === activeChatId);

  // Filtrar mensajes del chat activo convirtiendo IDs a String para evitar fallos de tipo
  const activeMessages = messages.filter((m) => {
    if (activeChatId === "announcements" || activeChatId === "general") {
      return m.chatId === activeChatId;
    }
    const contactIdStr = activeChatId.replace("dm-", "");
    const currentIdStr = String(currentUserId);
    const senderIdStr = String(m.senderId);
    const recipientIdStr = String(m.recipientId);

    return (
      (senderIdStr === currentIdStr && recipientIdStr === contactIdStr) ||
      (senderIdStr === contactIdStr && recipientIdStr === currentIdStr)
    );
  });

  const isReadOnly = activeChatId === "announcements" && currentUser?.rol !== "admin";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isReadOnly) return;

    const initials = currentUser?.nombre
      ? currentUser.nombre
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "US";

    const newMsg = {
      chatId: activeChannel ? activeChannel.id : null,
      recipientId: activeContact ? activeContact.id : null,
      senderId: currentUserId,
      senderName: currentUser?.nombre || "Usuario",
      senderAvatar: initials,
      senderRole: currentUser?.rol || "trabajador",
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    onSendMessage(newMsg);
    setInputText("");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs h-[650px] flex overflow-hidden">
      {/* Barra Lateral */}
      <aside className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm">Mensajería TeamFlow</h3>
            <p className="text-[10px] text-slate-400">Sesión: {currentUser?.nombre}</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-indigo-600 text-white">
            {currentUser?.rol}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {/* Canales Generales */}
          <div className="p-2 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-2 tracking-wider">Canales</span>
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChatId(ch.id)}
                className={`w-full text-left p-2.5 rounded-xl transition-colors flex flex-col cursor-pointer ${
                  activeChatId === ch.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "hover:bg-slate-200/70 text-slate-800"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs">{ch.nombre}</span>
                  {ch.tipo === "broadcast" && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                        activeChatId === ch.id ? "bg-indigo-700 text-indigo-100" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      Admin
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] mt-0.5 truncate ${
                    activeChatId === ch.id ? "text-indigo-100" : "text-slate-500"
                  }`}
                >
                  {ch.subtitle}
                </span>
              </button>
            ))}
          </div>

          {/* Contactos para Mensajes Directos */}
          <div className="p-2 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-2 tracking-wider">
              Mensajes Directos ({directContacts.length})
            </span>

            {directContacts.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 italic">
                No hay otros colaboradores registrados en la base de datos.
              </div>
            ) : (
              directContacts.map((contact) => {
                const isSelected = activeChatId === `dm-${contact.id}`;
                const contactInitials = contact.nombre
                  ? contact.nombre
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "US";

                return (
                  <button
                    key={contact.id}
                    onClick={() => setActiveChatId(`dm-${contact.id}`)}
                    className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "hover:bg-slate-200/70 text-slate-800"
                    }`}
                  >
                    <div className="relative">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSelected ? "bg-indigo-800 text-white" : "bg-slate-800 text-white"
                        }`}
                      >
                        {contactInitials}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          contact.estado === "activo" ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-xs truncate">{contact.nombre}</p>
                        <span
                          className={`text-[9px] font-semibold uppercase ${
                            isSelected ? "text-indigo-200" : "text-slate-400"
                          }`}
                        >
                          {contact.rol}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] truncate ${
                          isSelected ? "text-indigo-100" : "text-slate-500"
                        }`}
                      >
                        Mensaje a {contact.nombre}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </aside>

      {/* Panel Principal */}
      <main className="flex-1 flex flex-col bg-slate-100">
        <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex justify-between items-center shadow-xs">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              {activeChannel ? activeChannel.nombre : `Mensaje directo con ${activeContact?.nombre || "Usuario"}`}
            </h4>
            <p className="text-[11px] text-slate-500">
              {activeChannel
                ? activeChannel.subtitle
                : `${activeContact?.rol === "admin" ? "Administrador" : "Trabajador"} • ${
                    activeContact?.estado === "activo" ? "Disponible" : "Desconectado"
                  }`}
            </p>
          </div>
          {activeChatId === "announcements" && (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Canal informativo oficial
            </span>
          )}
        </div>

        {/* Historial de Mensajes */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3">
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
              <p>No hay mensajes en esta conversación.</p>
              {activeContact && (
                <p className="text-[11px] text-slate-400">
                  Inicia un mensaje directo con <strong>{activeContact.nombre}</strong>.
                </p>
              )}
            </div>
          ) : (
            activeMessages.map((msg) => {
              const isMine = String(msg.senderId) === String(currentUserId);
              const isMsgAdmin = msg.senderRole === "admin";

              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-md rounded-2xl px-4 py-2.5 shadow-xs ${
                      isMine
                        ? "bg-indigo-600 text-white rounded-br-xs"
                        : isMsgAdmin && activeChatId === "announcements"
                        ? "bg-amber-50 border border-amber-200 text-slate-800 rounded-bl-xs"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs"
                    }`}
                  >
                    {!isMine && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[10px] font-bold ${
                            isMsgAdmin ? "text-amber-800" : "text-indigo-600"
                          }`}
                        >
                          {msg.senderName}
                        </span>
                        {isMsgAdmin && (
                          <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-xs leading-relaxed break-words">{msg.text}</p>
                    <div className="flex justify-end items-center gap-1 mt-1">
                      <span className={`text-[9px] ${isMine ? "text-indigo-200" : "text-slate-400"}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de Mensajes */}
        <div className="p-3 bg-white border-t border-slate-200">
          {isReadOnly ? (
            <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-center text-xs text-slate-500 font-medium">
              Solo los administradores tienen permiso para publicar anuncios en este canal.
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                maxLength={2000}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  activeChatId === "announcements"
                    ? "Escribe un anuncio para todo el equipo..."
                    : activeContact
                    ? `Escribe un mensaje directo para ${activeContact.nombre}...`
                    : "Escribe un mensaje..."
                }
                className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
              >
                Enviar
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}