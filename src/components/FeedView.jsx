import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Plus, Trash2, Edit3, Save, X, Loader2, ArrowLeft, Star, MessageSquare } from "lucide-react";

// ─── Helpers ───────────────────────────────────────────────
const formatPrice = (n) =>
  Number(n).toLocaleString("es-CO", { minimumFractionDigits: 0 });

// ─── Sub-component: Service Card inside PostDetail ─────────
function ServiceChip({ service }) {
  return (
    <div style={{
      background: "#f7f3f1", borderRadius: 16, padding: "12px 16px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <span style={{ fontWeight: 700, color: "#1f2c45", fontSize: "0.9rem" }}>{service.name}</span>
      <span style={{ fontWeight: 900, color: "#ff7665", fontSize: "0.9rem" }}>
        Desde ${formatPrice(service.price_from)}
      </span>
    </div>
  );
}

// ─── POST DETAIL VIEW ──────────────────────────────────────
export function PostDetail({ post, onBack, isOwner, onRequestService }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!post?.id) return;
    supabase
      .from("feed_services")
      .select("*")
      .eq("post_id", post.id)
      .order("price_from")
      .then(({ data }) => { setServices(data || []); setLoading(false); });
  }, [post?.id]);

  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f1" }}>
      {/* Header */}
      <div style={{ background: "#1f2c45", padding: "48px 24px 80px", position: "relative" }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,.1)", border: "none", borderRadius: 14, padding: "10px 16px", color: "white", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 700, marginBottom: 24 }}>
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <h1 style={{ color: "white", fontWeight: 900, fontSize: "1.8rem", margin: "0 0 4px" }}>{post.service_name}</h1>
        <p style={{ color: "rgba(255,255,255,.65)", margin: 0, fontSize: "0.9rem" }}>
          {post.kamellador?.full_name} · {post.kamellador?.specialty}
        </p>
      </div>

      {/* Card flotante */}
      <div style={{ margin: "-44px 20px 0", background: "white", borderRadius: 28, padding: "28px 24px", boxShadow: "0 8px 32px rgba(31,44,69,.1)" }}>
        {/* Avatar + rating */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "#ff7665", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", fontWeight: 900, color: "white", flexShrink: 0 }}>
            {(post.kamellador?.full_name?.[0] || "K").toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 800, color: "#1f2c45", margin: "0 0 4px", fontSize: "1rem" }}>{post.kamellador?.full_name}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Star className="w-4 h-4" style={{ fill: "#f59e0b", color: "#f59e0b" }} />
              <span style={{ fontWeight: 700, color: "#1f2c45", fontSize: "0.85rem" }}>
                {post.kamellador?.rating_avg?.toFixed(1) || "Nuevo"}
              </span>
              {post.kamellador?.services_count > 0 && (
                <span style={{ color: "#a4b1c6", fontSize: "0.8rem" }}>· {post.kamellador.services_count} servicios</span>
              )}
            </div>
          </div>
        </div>

        {/* Biografía */}
        <p style={{ color: "#5f6a79", lineHeight: 1.7, fontSize: "0.9rem", margin: 0 }}>{post.bio}</p>
      </div>

      {/* Servicios */}
      <div style={{ padding: "24px 20px" }}>
        <h3 style={{ fontWeight: 800, color: "#1f2c45", margin: "0 0 14px" }}>Servicios que ofrezco</h3>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#a4b1c6" }}><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : services.length === 0 ? (
          <p style={{ color: "#a4b1c6", fontSize: "0.85rem" }}>Aún no ha agregado servicios específicos.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {services.map(s => <ServiceChip key={s.id} service={s} />)}
          </div>
        )}
      </div>

      {/* CTA Botón */}
      {!isOwner && (
        <div style={{ padding: "0 20px 40px" }}>
          <button
            onClick={() => onRequestService(post)}
            style={{
              width: "100%", background: "#ff7665", color: "white",
              border: "none", borderRadius: 20, padding: "18px",
              fontWeight: 800, fontSize: "1rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: "0 8px 24px rgba(255,118,101,.4)",
            }}
          >
            <MessageSquare className="w-5 h-5" />
            Solicitar Servicio
          </button>
        </div>
      )}
    </div>
  );
}

// ─── POST EDITOR (crear / editar) ──────────────────────────
export function PostEditor({ post, userId, onSaved, onCancel }) {
  const isNew = !post?.id;
  const [serviceName, setServiceName] = useState(post?.service_name || "");
  const [bio, setBio]           = useState(post?.bio || "");
  const [services, setServices] = useState([]);
  const [newServiceName, setNewServiceName]   = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [saving, setSaving] = useState(false);

  // Cargar servicios si es edición
  useEffect(() => {
    if (!post?.id) return;
    supabase.from("feed_services").select("*").eq("post_id", post.id).order("price_from")
      .then(({ data }) => setServices(data || []));
  }, [post?.id]);

  const handleAddService = () => {
    if (!newServiceName.trim() || !newServicePrice) return;
    setServices(prev => [...prev, {
      _temp: true, id: crypto.randomUUID(),
      name: newServiceName.trim(), price_from: Number(newServicePrice),
    }]);
    setNewServiceName(""); setNewServicePrice("");
  };

  const handleRemoveService = (id) => setServices(prev => prev.filter(s => s.id !== id));

  const handleSave = async () => {
    if (!serviceName.trim() || !bio.trim()) return alert("Completa el nombre y la descripción.");
    setSaving(true);
    try {
      let postId = post?.id;

      if (isNew) {
        const { data, error } = await supabase.from("feed_posts").insert({
          kamellador_id: userId,
          service_name: serviceName.trim(),
          bio: bio.trim(),
          payment_status: "free",
        }).select().single();
        if (error) throw error;
        postId = data.id;
      } else {
        const { error } = await supabase.from("feed_posts").update({
          service_name: serviceName.trim(),
          bio: bio.trim(),
        }).eq("id", postId);
        if (error) throw error;
        // Borrar servicios viejos para re-insertar
        await supabase.from("feed_services").delete().eq("post_id", postId);
      }

      // Insertar todos los servicios
      if (services.length > 0) {
        const rows = services.map(s => ({ post_id: postId, name: s.name, price_from: s.price_from }));
        const { error } = await supabase.from("feed_services").insert(rows);
        if (error) throw error;
      }

      onSaved();
    } catch (err) {
      alert("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "14px 18px", borderRadius: 18, border: "2px solid #efe7e2",
    background: "#f7f3f1", outline: "none", fontWeight: 600, color: "#1f2c45",
    fontSize: "0.9rem", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f1", padding: "24px 20px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{ fontWeight: 900, color: "#1f2c45", fontSize: "1.4rem", margin: 0 }}>
          {isNew ? "Nueva Publicación" : "Editar Publicación"}
        </h2>
        <button onClick={onCancel} style={{ background: "#efe7e2", border: "none", borderRadius: 14, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "#1f2c45" }}>
          <X className="w-4 h-4" /> Cancelar
        </button>
      </div>

      <div style={{ background: "white", borderRadius: 24, padding: "24px", marginBottom: 16 }}>
        <label style={{ fontWeight: 800, fontSize: "0.8rem", color: "#a4b1c6", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
          Nombre del Servicio
        </label>
        <input style={inputStyle} placeholder="Ej: Albañilería Profesional" value={serviceName} onChange={e => setServiceName(e.target.value)} />

        <label style={{ fontWeight: 800, fontSize: "0.8rem", color: "#a4b1c6", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", margin: "20px 0 8px" }}>
          Presentación Personal
        </label>
        <textarea
          style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
          placeholder="Ej: Soy José Alberto, tengo 8 años de experiencia en albañilería, especializado en enchapes, construcción y remodelaciones. Me caracterizo por mi puntualidad y compromiso con el trabajo."
          value={bio}
          onChange={e => setBio(e.target.value)}
        />
      </div>

      {/* Servicios */}
      <div style={{ background: "white", borderRadius: 24, padding: "24px" }}>
        <h3 style={{ fontWeight: 800, color: "#1f2c45", margin: "0 0 16px" }}>Mis Servicios y Precios</h3>

        {services.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f7f3f1", borderRadius: 14, padding: "12px 16px", marginBottom: 10 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "#1f2c45", fontSize: "0.85rem" }}>{s.name}</p>
              <p style={{ margin: 0, color: "#ff7665", fontWeight: 800, fontSize: "0.8rem" }}>Desde ${formatPrice(s.price_from)}</p>
            </div>
            <button onClick={() => handleRemoveService(s.id)} style={{ background: "#fee2e2", border: "none", borderRadius: 12, padding: "8px 12px", cursor: "pointer", color: "#ef4444" }}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input style={{ ...inputStyle, flex: 2 }} placeholder="Tipo de servicio" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} />
          <input style={{ ...inputStyle, flex: 1 }} type="number" placeholder="Precio" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} />
          <button onClick={handleAddService} style={{ background: "#1f2c45", border: "none", borderRadius: 18, padding: "0 16px", cursor: "pointer", color: "white", flexShrink: 0 }}>
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: "100%", marginTop: 20, background: "#ff7665", color: "white",
          border: "none", borderRadius: 20, padding: "18px",
          fontWeight: 800, fontSize: "1rem", cursor: saving ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          opacity: saving ? 0.7 : 1, boxShadow: "0 8px 24px rgba(255,118,101,.35)",
        }}
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Guardar Publicación</>}
      </button>
    </div>
  );
}

// ─── FEED VIEW (lista de publicaciones) ────────────────────
export default function FeedView({ user, role, onOpenChat }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | post object
  const isKamellador = role === "kamellador";

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("feed_posts")
      .select(`*, kamellador:profiles!feed_posts_kamellador_id_fkey(id, full_name, specialty, rating_avg, services_count, avatar_url)`)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleDelete = async (postId) => {
    if (!window.confirm("¿Eliminar esta publicación?")) return;
    await supabase.from("feed_posts").delete().eq("id", postId);
    fetchPosts();
  };

  const handleRequestService = async (post) => {
    // Crear o abrir un chat con este kamellador via una operación de tipo "feed_inquiry"
    // Por ahora abrimos el chat directo (usando el mismo sistema de mensajes)
    if (onOpenChat) onOpenChat(post.kamellador);
  };

  // Editing mode
  if (editing) {
    return (
      <PostEditor
        post={editing === "new" ? null : editing}
        userId={user.id}
        onSaved={() => { setEditing(null); fetchPosts(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  // Detail mode
  if (selectedPost) {
    return (
      <PostDetail
        post={selectedPost}
        onBack={() => setSelectedPost(null)}
        isOwner={selectedPost.kamellador_id === user.id}
        onRequestService={handleRequestService}
      />
    );
  }

  // List mode
  return (
    <div style={{ background: "#f7f3f1", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "#1f2c45", padding: "48px 24px 24px" }}>
        <h1 style={{ color: "white", fontWeight: 900, fontSize: "1.6rem", margin: "0 0 4px" }}>Feed de Servicios</h1>
        <p style={{ color: "rgba(255,255,255,.65)", margin: 0, fontSize: "0.85rem" }}>Explora los mejores profesionales cerca de ti</p>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Botón nueva publicación para kamellador */}
        {isKamellador && (
          <button
            onClick={() => setEditing("new")}
            style={{
              width: "100%", marginBottom: 20,
              background: "#ff7665", color: "white", border: "none",
              borderRadius: 20, padding: "16px",
              fontWeight: 800, fontSize: "0.95rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: "0 8px 24px rgba(255,118,101,.35)",
            }}
          >
            <Plus className="w-5 h-5" /> Nueva Publicación
          </button>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#a4b1c6" }}>
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
            <p style={{ fontWeight: 700 }}>Cargando publicaciones...</p>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#a4b1c6" }}>
            <p style={{ fontWeight: 700, fontSize: "1rem" }}>Aún no hay publicaciones</p>
            <p style={{ fontSize: "0.85rem" }}>¡Sé el primero en publicar tus servicios!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {posts.map(post => {
              const isOwner = post.kamellador_id === user.id;
              return (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  style={{
                    background: "white", borderRadius: 24, padding: "20px 22px",
                    cursor: "pointer", boxShadow: "0 2px 12px rgba(31,44,69,.06)",
                    border: "1.5px solid transparent",
                    transition: "border-color .2s, box-shadow .2s",
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = "#ff7665"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(255,118,101,.15)"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(31,44,69,.06)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 14, background: "#ff7665", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 900, color: "white", flexShrink: 0 }}>
                          {(post.kamellador?.full_name?.[0] || "K").toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 800, color: "#1f2c45", margin: 0, fontSize: "0.95rem" }}>{post.service_name}</p>
                          <p style={{ color: "#a4b1c6", margin: 0, fontSize: "0.78rem" }}>{post.kamellador?.full_name}</p>
                        </div>
                      </div>
                      <p style={{ color: "#5f6a79", fontSize: "0.82rem", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {post.bio}
                      </p>
                    </div>

                    {isOwner && isKamellador && (
                      <div style={{ display: "flex", gap: 8, marginLeft: 12 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setEditing(post)} style={{ background: "#f7f3f1", border: "none", borderRadius: 12, padding: "8px 12px", cursor: "pointer", color: "#1f2c45" }}>
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(post.id)} style={{ background: "#fee2e2", border: "none", borderRadius: 12, padding: "8px 12px", cursor: "pointer", color: "#ef4444" }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                    {post.kamellador?.rating_avg > 0 && (
                      <span style={{ background: "#fff7ed", color: "#f59e0b", fontWeight: 800, fontSize: "0.75rem", padding: "4px 10px", borderRadius: 10, display: "flex", alignItems: "center", gap: 4 }}>
                        <Star className="w-3 h-3" style={{ fill: "#f59e0b" }} /> {post.kamellador.rating_avg.toFixed(1)}
                      </span>
                    )}
                    <span style={{ background: "#f0fdf4", color: "#16a34a", fontWeight: 700, fontSize: "0.75rem", padding: "4px 10px", borderRadius: 10 }}>
                      {post.kamellador?.specialty || "Profesional"}
                    </span>
                    {isOwner && (
                      <span style={{ background: "#fff0ee", color: "#ff7665", fontWeight: 700, fontSize: "0.75rem", padding: "4px 10px", borderRadius: 10 }}>Tu publicación</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
