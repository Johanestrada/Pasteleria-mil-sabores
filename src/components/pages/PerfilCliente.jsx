import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../../context/UserContext";
import { CrudService } from "../../services/crudService";

const PerfilCliente = () => {
  const { user, setUser } = useContext(UserContext); // Accedemos al usuario desde el contexto
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Llenar el formulario cuando el user esté disponible
  useEffect(() => {
    if (user) {
      setNombre(user.nombre || "");
      // Algunos flujos guardan el correo como 'correo' o como 'email', soportamos ambos
      setEmail(user.email || user.correo || "");
    }
  }, [user]);

  const validate = () => {
    if (!nombre.trim()) {
      setMessage({ type: "error", text: "El nombre es requerido." });
      return false;
    }
    // Validación simple de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setMessage({ type: "error", text: "Ingrese un correo válido." });
      return false;
    }
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!user) {
      setMessage({ type: "error", text: "Usuario no cargado." });
      return;
    }
    if (!validate()) return;

    setLoading(true);
    try {
      let docId = user.id || user.uid; // soportar doc id guardado como id o uid

      // Si no hay docId intentamos buscar por email/correo (fallback)
      if (!docId) {
        const emailToSearch = email.trim() || user.email || user.correo;
        if (emailToSearch) {
          const encontrado = await CrudService.findUsuarioByEmail(emailToSearch);
          if (encontrado) docId = encontrado.id;
        }
      }

      if (!docId) {
        setMessage({ type: "error", text: "No se encontró el identificador del usuario para actualizar." });
        setLoading(false);
        return;
      }

      // Actualizamos ambos campos 'email' y 'correo' para mayor compatibilidad
      const datos = { nombre: nombre.trim(), email: email.trim(), correo: email.trim() };
      const ok = await CrudService.updateUsuario(docId, datos);
      if (ok) {
        // Actualizar contexto y localStorage para mantener consistencia
        const updatedUser = { ...user, ...datos };
        setUser(updatedUser);
        try {
          localStorage.setItem("usuario", JSON.stringify(updatedUser));
        } catch (err) {
          // no bloquear por error en localStorage
          console.warn("No se pudo guardar en localStorage:", err);
        }
        setMessage({ type: "success", text: "Perfil actualizado correctamente." });
      } else {
        setMessage({ type: "error", text: "Error al actualizar el perfil." });
      }
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      setMessage({ type: "error", text: "Ocurrió un error. Intente nuevamente." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2>Perfil Cliente</h2>
      {!user ? (
        <p>Cargando usuario...</p>
      ) : (
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: "bold" }}>Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={loading}
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: "bold" }}>Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <button type="submit" disabled={loading} style={{ padding: "8px 16px" }}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>

          {message && (
            <div
              style={{
                marginTop: 12,
                color: message.type === "error" ? "#a00" : "#0a0"
              }}
            >
              {message.text}
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default PerfilCliente;
