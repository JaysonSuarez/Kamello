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

  const avatar = post.kamellador?.avatar_url;
  const initial = (post.kamellador?.full_name?.[0] || "K").toUpperCase();
  const rating = post.kamellador?.rating_avg?.toFixed(1) || "Nuevo";
  const servicesCount = post.kamellador?.services_count || 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f7f3f1", paddingBottom: "100px", position: "relative" }}>
      {/* Header Branded Background */}
      <div style={{ height: "180px", width: "100%", background: "#1f2c45", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {/* Logo de fondo sutil */}
        <img 
          src="/images/K-Editado.png" 
          alt="" 
          style={{ 
            position: "absolute", 
            width: "240px", 
            height: "240px", 
            opacity: 0.1, 
            filter: "brightness(2) grayscale(1)",
            transform: "rotate(-10deg)" 
          }} 
        />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 20 }}>
          <button onClick={onBack} style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer" }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profile Info Overlap */}
      <div style={{ padding: "0 20px", marginTop: "-60px", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ position: "relative", width: "fit-content" }}>
            <div style={{ width: 120, height: 120, borderRadius: "50%", border: "4px solid #ff7665", background: "white", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
              {avatar ? (
                <img src={avatar} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "3rem", fontWeight: 900, color: "#1f2c45" }}>{initial}</span>
              )}
            </div>
            {post.payment_status === "premium" && (
              <div style={{ position: "absolute", bottom: 0, right: 0, background: "#ff7665", color: "white", fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: 12, border: "2px solid white" }}>
                PRO ⭐
              </div>
            )}
          </div>
          
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 style={{ color: "#1f2c45", fontSize: "1.5rem", fontWeight: 900, margin: "0 0 4px", lineHeight: 1.2 }}>{post.kamellador?.full_name}</h1>
                <p style={{ color: "#ff7665", fontWeight: 700, fontSize: "1rem", margin: 0 }}>{post.service_name}</p>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              <span style={{ background: "rgba(255,118,101,0.1)", color: "#ff7665", padding: "4px 12px", borderRadius: 16, fontSize: "0.75rem", fontWeight: 800, border: "1px solid rgba(255,118,101,0.2)" }}>
                {post.kamellador?.specialty || "Servicios"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Biografía */}
      <div style={{ padding: "20px 20px 0" }}>
        <p style={{ color: "#5f6a79", lineHeight: 1.6, fontSize: "0.9rem", margin: 0 }}>{post.bio}</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: "20px" }}>
        <div style={{ background: "white", borderRadius: 16, padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(31,44,69,0.05)" }}>
          <p style={{ color: "#a4b1c6", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>Trabajos</p>
          <p style={{ color: "#1f2c45", fontSize: "1.25rem", fontWeight: 900, margin: 0 }}>{servicesCount}</p>
        </div>
        <div style={{ background: "white", borderRadius: 16, padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(31,44,69,0.05)" }}>
          <p style={{ color: "#a4b1c6", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>Rating</p>
          <p style={{ color: "#1f2c45", fontSize: "1.25rem", fontWeight: 900, margin: 0 }}>{rating}</p>
        </div>
        <div style={{ background: "white", borderRadius: 16, padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(31,44,69,0.05)" }}>
          <p style={{ color: "#a4b1c6", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>Garantía</p>
          <p style={{ color: "#1f2c45", fontSize: "1.25rem", fontWeight: 900, margin: 0 }}>100%</p>
        </div>
      </div>

      {/* Servicios */}
      <div style={{ padding: "0 20px" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#1f2c45", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <Star className="w-5 h-5 text-[#ff7665]" />
          Servicios y Precios
        </h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#a4b1c6" }}><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : services.length === 0 ? (
          <p style={{ color: "#a4b1c6", fontSize: "0.85rem", textAlign: "center" }}>No hay servicios específicos publicados.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {services.map(s => <ServiceChip key={s.id} service={s} />)}
          </div>
        )}
      </div>

      {/* Sticky Bottom CTA */}
      {!isOwner && (
        <div style={{ position: "fixed", bottom: 80, left: 0, right: 0, padding: "0 20px", zIndex: 50 }}>
          <div style={{ maxWidth: "500px", margin: "0 auto" }}>
            <button
              onClick={() => onRequestService(post)}
              style={{
                width: "100%", background: "#ff7665", color: "white",
                border: "none", borderRadius: 16, padding: "16px",
                fontWeight: 900, fontSize: "1rem", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: "0 8px 24px rgba(255,118,101,0.3)",
                textTransform: "uppercase", letterSpacing: "0.05em"
              }}
            >
              <MessageSquare className="w-5 h-5" />
              Solicitar Servicio
            </button>
          </div>
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
    // Pasar el post completo para poder extraer el nombre del servicio, id del kamellador, etc.
    if (onOpenChat) onOpenChat(post);
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
          <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 80 }}>
            {posts.map(post => {
              const isOwner = post.kamellador_id === user.id;
              const avatar = post.kamellador?.avatar_url;
              const initial = (post.kamellador?.full_name?.[0] || "K").toUpperCase();
              
              return (
                <div key={post.id} style={{ background: "white", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 20px rgba(31,44,69,0.08)" }}>
                  {/* Hero Image Area */}
                  <div style={{ position: "relative", aspectRatio: "4/3", width: "100%", background: "#1f2c45", overflow: "hidden" }} onClick={() => setSelectedPost(post)}>
                    {/* Fallback image o gradiente para el hero */}
                    <img 
                      src={`https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80`} 
                      alt="Work preview" 
                      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} 
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(31,44,69,0.95), rgba(31,44,69,0.2) 50%, transparent)" }} />
                    
                    {post.payment_status === "premium" && (
                      <div style={{ position: "absolute", top: 16, left: 16, display: "flex", alignItems: "center", gap: 4, background: "#ff7665", color: "white", padding: "4px 12px", borderRadius: 20, fontSize: "10px", fontWeight: 800, letterSpacing: "0.05em" }}>
                        <Star className="w-3 h-3" style={{ fill: "white" }} />
                        DESTACADO
                      </div>
                    )}
                    
                    {/* Overlay Content Bottom */}
                    <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid white", overflow: "hidden", background: "#ff7665", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {avatar ? (
                            <img src={avatar} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "white" }}>{initial}</span>
                          )}
                        </div>
                        <div>
                          <h2 style={{ color: "white", fontSize: "1.1rem", fontWeight: 800, lineHeight: 1.2, margin: 0 }}>{post.kamellador?.full_name}</h2>
                          <div style={{ display: "inline-flex", background: "#ff7665", padding: "2px 8px", borderRadius: 6, marginTop: 4 }}>
                            <span style={{ color: "white", fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>{post.service_name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar & Caption */}
                  <div style={{ padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#5f6a79" }}>
                          <Star className="w-5 h-5 text-[#f59e0b]" style={{ fill: "#f59e0b" }} />
                          <span style={{ fontSize: "0.85rem", fontWeight: 800 }}>{post.kamellador?.rating_avg?.toFixed(1) || "N/A"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#5f6a79" }}>
                          <MessageSquare className="w-5 h-5 text-[#a4b1c6]" />
                          <span style={{ fontSize: "0.85rem", fontWeight: 800 }}>{post.kamellador?.services_count || 0}</span>
                        </div>
                      </div>
                      
                      {isOwner ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setEditing(post)} style={{ background: "#f7f3f1", border: "none", borderRadius: 12, padding: "8px 12px", cursor: "pointer", color: "#1f2c45" }}>
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(post.id)} style={{ background: "#fee2e2", border: "none", borderRadius: 12, padding: "8px 12px", cursor: "pointer", color: "#ef4444" }}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setSelectedPost(post)}
                          style={{ background: "#ff7665", color: "white", fontWeight: 800, border: "none", padding: "8px 24px", borderRadius: 12, fontSize: "0.85rem", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Ver / Contratar
                        </button>
                      )}
                    </div>
                    <div style={{ color: "#1f2c45", fontSize: "0.85rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      <span style={{ fontWeight: 800 }}>{post.service_name} </span>
                      {post.bio}
                    </div>
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
