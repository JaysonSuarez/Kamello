import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import {
  CheckCircle2, Clock, CreditCard, Loader2, LogOut, MapPin,
  MessageSquare, Navigation, Phone, Search, Send, Shield, Star, X
} from "lucide-react";
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SERVICE_CATEGORIES, getServiceCategory } from "./serviceCategories";
import { OPERATION_SELECT, useOperations } from "./hooks/useOperations";
import BottomSheet from "./components/BottomSheet";
import BottomNav from "./components/BottomNav";
import ProfileView from "./components/ProfileView";
import { getRoute } from "./utils/geo";
import { usePushNotifications } from "./hooks/usePushNotifications";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const DEFAULT_POSITION = [4.6097, -74.0817];

function LocationPicker({ position, setPosition }) {
  useMapEvents({ click(e) { setPosition([e.latlng.lat, e.latlng.lng]); } });
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, map.getZoom()); }, [position, map]);
  return position ? <Marker position={position} /> : null;
}

function formatPrice(v) {
  return Number(v || 0).toLocaleString("es-CO");
}

function formatDate(v) {
  return v ? new Date(v).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : "";
}

function getStatusLabel(s) {
  return { pending: "Buscando", accepted: "Aceptado", in_progress: "En progreso", completed: "Por calificar", rated: "Calificado", cancelled: "Cancelado", expired: "Expirado" }[s] || s;
}

function CountdownTimer({ expiresAt }) {
  const [remaining, setRemaining] = useState("");
  const [urgent, setUrgent] = useState(false);
  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) { setRemaining("Expirado"); setUrgent(true); return; }
      const m = Math.floor(diff / 60000), s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${String(s).padStart(2, "0")}`);
      setUrgent(diff < 120000);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return <span className={`countdown ${urgent ? "countdown--urgent" : ""}`}><Clock className="w-3.5 h-3.5" /> {remaining}</span>;
}

export default function ClientDashboard({ user }) {
  if (!user) return <div className="app-shell" style={{ justifyContent: "center", alignItems: "center" }}><Loader2 className="h-8 w-8 animate-spin text-[#ff7665]" /></div>;
  
  const navigate = useNavigate();
  const { subscribeToPush } = usePushNotifications();
  const { fetchOperation, fetchActiveOperation, fetchHistory, rateOperation, completeOperation, loadingById } = useOperations();

  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState(null);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [activeRequest, setActiveRequest] = useState(null);
  const [history, setHistory] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingTags, setRatingTags] = useState([]);
  const [activeTab, setActiveTab] = useState("home");
  const [sheetSnap, setSheetSnap] = useState(1);
  const [route, setRoute] = useState([]); // State for the real route
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  const activeCategory = getServiceCategory(activeRequest?.category);
  const activeKamellador = activeRequest?.kamellador;
  const canChat = ["accepted", "in_progress", "completed"].includes(activeRequest?.status);
  const canRate = activeRequest?.status === "completed";

  const refreshHistory = async () => { setHistory(await fetchHistory(user.id, "client")); };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => setPosition([p.coords.latitude, p.coords.longitude]),
        () => setPosition(DEFAULT_POSITION)
      );
    } else setPosition(DEFAULT_POSITION);
    (async () => {
      try {
        const active = await fetchActiveOperation(user.id, "client");
        if (active) setActiveRequest(active);
        await refreshHistory();
      } catch (err) {
        console.error("Error initializing ClientDashboard:", err);
      } finally {
        setLoading(false);
        // Solicitar notificaciones al cliente
        setTimeout(() => subscribeToPush(user.id), 2000);
      }
    })();
  }, [user.id]);

  // Realtime operation updates
  useEffect(() => {
    if (!activeRequest?.id) return;
    const channel = supabase.channel(`operation_${activeRequest.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "operations", filter: `id=eq.${activeRequest.id}` }, async (payload) => {
        if (["cancelled", "expired", "rated"].includes(payload.new.status)) {
          setActiveRequest(null); setChatOpen(false); setMessages([]); await refreshHistory(); return;
        }
        const updated = await fetchOperation(payload.new.id);
        if (updated) setActiveRequest(updated);
        await refreshHistory();
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [activeRequest?.id]);
 
  // Real routing between provider and client
  useEffect(() => {
    if (activeRequest && activeRequest.kamellador && (activeRequest.status === 'accepted' || activeRequest.status === 'in_progress')) {
      const { current_lat, current_lng } = activeRequest.kamellador;
      const { client_lat, client_lng } = activeRequest;
      
      if (current_lat && current_lng && client_lat && client_lng) {
        getRoute(current_lat, current_lng, client_lat, client_lng)
          .then(coords => setRoute(coords))
          .catch(err => console.error("Route error:", err));
      }
    } else {
      setRoute([]);
    }
  }, [activeRequest?.kamellador?.current_lat, activeRequest?.kamellador?.current_lng, activeRequest?.client_lat, activeRequest?.client_lng, activeRequest?.status]);


  // Chat messages background listener
  useEffect(() => {
    if (!activeRequest?.id) {
      setMessages([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    (async () => {
      setChatLoading(true);
      const { data } = await supabase.from("operation_messages").select("*").eq("operation_id", activeRequest.id).order("created_at", { ascending: true });
      if (data) setMessages(data);
      setChatLoading(false);
    })();

    const channel = supabase.channel(`msgs_${activeRequest.id}`)
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "operation_messages", 
        filter: `operation_id=eq.${activeRequest.id}` 
      }, (p) => {
        setMessages(prev => {
          if (prev.some(m => m.id === p.new.id)) return prev;
          // If message is from the other person and chat is closed, count as unread
          if (p.new.sender_id !== user.id && !chatOpen) {
            setUnreadCount(c => c + 1);
          }
          return [...prev, p.new];
        });
      }).subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeRequest?.id, chatOpen]);

  // Clear unread when chat opens
  useEffect(() => {
    if (chatOpen) setUnreadCount(0);
  }, [chatOpen]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!category || !description || !budget || !position) return alert("Completa todos los campos.");
    setLoading(true);
    const { data, error } = await supabase.from("operations").insert({
      client_id: user.id, category, description,
      proposed_price: Number(budget.replace(/[^0-9]/g, "")),
      client_lat: position[0], client_lng: position[1],
      status: "pending", expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    }).select(OPERATION_SELECT).single();
    if (error) alert("Error: " + error.message);
    else { setActiveRequest(data); await refreshHistory(); }
    setLoading(false);
  };

  const cancelRequest = async () => {
    if (!activeRequest) return;
    const { error } = await supabase.from("operations").update({ status: "cancelled" }).eq("id", activeRequest.id).eq("status", "pending");
    if (error) return alert("No pudimos cancelar: " + error.message);
    setActiveRequest(null); setCategory(""); setDescription(""); setBudget(""); await refreshHistory();
  };
  
  const handleComplete = async () => {
    try { 
      const upd = await completeOperation(activeRequest.id); 
      setActiveRequest(upd); 
      await refreshHistory(); 
    }
    catch (err) { alert(err.message); }
  };

  const handleRate = async (e) => {
    e.preventDefault();
    try { 
      await rateOperation(activeRequest.id, ratingValue, ratingComment, ratingTags); 
      setRatingOpen(false); 
      setRatingComment(""); 
      setRatingTags([]);
      setActiveRequest(null); 
      await refreshHistory(); 
    }
    catch (err) { alert(err.message); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const body = chatDraft.trim();
    if (!body || !activeRequest?.id) return;
    setChatDraft("");
    const { data, error } = await supabase.from("operation_messages").insert({ operation_id: activeRequest.id, sender_id: user.id, body }).select().single();
    if (error) { setChatDraft(body); return alert("Error: " + error.message); }
    setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data]);
  };

  if (loading) return <div className="app-shell" style={{ justifyContent: "center", alignItems: "center" }}><div className="h-8 w-8 border-4 border-[#ff7665] border-t-transparent rounded-full animate-spin" /></div>;

  // Determine sheet snap based on state
  const getSnapPoints = () => {
    if (activeRequest?.status === "pending") return [25, 40];
    if (activeRequest) return [30, 55, 80];
    if (category) return [40, 80];
    return [30, 55, 85];
  };
  const getInitialSnap = () => {
    if (activeRequest?.status === "pending") return 1;
    if (activeRequest) return 1;
    if (category) return 1;
    return 1;
  };

  // ── Tab content: Activity
  if (activeTab === "activity") {
    return (
      <div className="app-shell">
        <div className="view-container">
          <div className="view-container__content">
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", marginBottom: 16 }}>Actividad</h2>
            {history.length === 0 ? <p style={{ color: "#5f6a79", fontSize: "0.875rem" }}>Aún no tienes servicios en historial.</p> : history.map(op => {
              const rating = op.operation_ratings?.[0];
              return (
                <div key={op.id} className="history-item">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <p style={{ fontWeight: 700, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{op.description}</p>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "#ff7665", flexShrink: 0 }}>{getStatusLabel(op.status)}</span>
                  </div>
                  <p style={{ fontSize: 11, color: "#5f6a79", marginTop: 4 }}>{formatDate(op.updated_at)}</p>
                  {rating && <p style={{ fontSize: 12, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}><Star className="w-3 h-3" style={{ fill: "#f59e0b", color: "#f59e0b" }} /> {rating.rating}/5</p>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="top-bar">
          <div className="top-bar__left"><img src="/images/K-Editado.png" alt="K" className="top-bar__logo" /><span className="top-bar__title">Kamello</span></div>
          <div className="top-bar__right">
            <button onClick={() => supabase.auth.signOut().then(() => navigate("/"))} className="top-bar__btn" aria-label="Salir"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
        <BottomNav role="client" activeTab={activeTab} onTabChange={setActiveTab} unreadMessages={unreadCount} />
      </div>
    );
  }

  if (activeTab === "account") {
    return (
      <div className="app-shell">
        <div className="view-container">
          <div className="view-container__content">
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", marginBottom: 16 }}>Mi Cuenta</h2>
            <ProfileView user={user} onLogout={() => navigate("/")} />
          </div>
        </div>
        <div className="top-bar">
          <div className="top-bar__left"><img src="/images/K-Editado.png" alt="K" className="top-bar__logo" /><span className="top-bar__title">Kamello</span></div>
          <div className="top-bar__right">
            <button onClick={() => supabase.auth.signOut().then(() => navigate("/"))} className="top-bar__btn" aria-label="Salir"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
        <BottomNav role="client" activeTab={activeTab} onTabChange={setActiveTab} unreadMessages={unreadCount} />
      </div>
    );
  }

  // ── Main Home view
  return (
    <div className="app-shell">
      {/* Map background */}
      <div className="map-fullscreen">
        {position && (
          <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            {!activeRequest ? <LocationPicker position={position} setPosition={setPosition} /> : (
              <>
                {activeRequest.client_lat != null && (
                  <Marker position={[Number(activeRequest.client_lat), Number(activeRequest.client_lng)]} />
                )}
                {activeRequest.kamellador?.current_lat != null && (
                  <Marker 
                    position={[Number(activeRequest.kamellador.current_lat), Number(activeRequest.kamellador.current_lng)]}
                    icon={L.divIcon({
                      className: 'kamellador-marker',
                      html: `<div class="marker-kamellador">🛵</div>`,
                      iconSize: [30, 30]
                    })}
                  />
                )}
                {route.length > 0 ? (
                  <Polyline positions={route} color="#ff7665" weight={5} opacity={0.7} dashArray="1, 10" lineCap="round" />
                ) : (activeRequest.client_lat != null && activeRequest.kamellador?.current_lat != null) ? (
                   <Polyline 
                    positions={[
                      [Number(activeRequest.client_lat), Number(activeRequest.client_lng)],
                      [Number(activeRequest.kamellador.current_lat), Number(activeRequest.kamellador.current_lng)]
                    ]} 
                    color="#ff7665" 
                    weight={3} 
                    dashArray="5, 10" 
                  />
                ) : null}
              </>
            )}
          </MapContainer>
        )}
      </div>

      {/* Top bar */}
      <div className="top-bar">
        <div className="top-bar__left">
          <img src="/images/K-Editado.png" alt="K" className="top-bar__logo" />
          <span className="top-bar__title">Kamello</span>
        </div>
        <div className="top-bar__right">
          <button onClick={() => supabase.auth.signOut().then(() => navigate("/"))} className="top-bar__btn" aria-label="Salir"><LogOut className="w-4 h-4" /></button>
          <button onClick={() => setActiveTab("account")} className="top-bar__avatar">{user?.email?.[0]?.toUpperCase() || "U"}</button>
        </div>
      </div>

      {/* Map hint when no request */}
      {!activeRequest && (
        <div style={{ position: "absolute", top: 64, left: "50%", transform: "translateX(-50%)", zIndex: 700, background: "rgba(255,255,255,0.95)", padding: "8px 20px", borderRadius: 100, boxShadow: "0 2px 16px rgba(31,44,69,0.1)", display: "flex", alignItems: "center", gap: 8, pointerEvents: "none" }}>
          <MapPin className="w-4 h-4" style={{ color: "#ff7665" }} />
          <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>Toca para fijar dirección</span>
        </div>
      )}

      {/* Bottom Sheet */}
      <BottomSheet snapPoints={getSnapPoints()} initialSnap={getInitialSnap()}>
        {/* ── STATE: No active request ── */}
        {!activeRequest && !category && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: 4 }}>¿Qué necesitas hoy?</h2>
            <p style={{ color: "#5f6a79", fontSize: "0.8rem", marginBottom: 16 }}>Encuentra un experto en minutos.</p>
            <div className="cat-grid">
              {SERVICE_CATEGORIES.slice(0, 8).map(cat => (
                <button key={cat.id} className="cat-item" onClick={() => { setCategory(cat.id); }}>
                  <div className="cat-item__circle"><span className={cat.color}>{cat.icon}</span></div>
                  <span className="cat-item__label">{cat.shortName}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STATE: Category selected, fill details ── */}
        {!activeRequest && category && (
          <div className="animate-fade-in-up">
            <button onClick={() => setCategory("")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#5f6a79", fontSize: "0.8rem", fontWeight: 600, marginBottom: 12, padding: 0 }}>
              ← Cambiar categoría
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              {(() => { const c = getServiceCategory(category); return c ? <span className={c.color}>{c.icon}</span> : null; })()}
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>{getServiceCategory(category)?.shortName || category}</h3>
            </div>

            <form onSubmit={handleSubmitRequest} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", marginBottom: 6 }}>Describe el problema</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Tengo una fuga en el baño..." className="sheet-input" style={{ height: 80, resize: "none" }} required />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", marginBottom: 6 }}>Presupuesto (COP)</label>
                <div style={{ position: "relative" }}>
                  <CreditCard className="w-4 h-4" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#a4b1c6" }} />
                  <input type="text" value={budget} onChange={e => setBudget(e.target.value)} placeholder="50000" className="sheet-input" style={{ paddingLeft: 40, fontWeight: 700 }} required />
                </div>
              </div>
              <button type="submit" disabled={loading || !position} className="btn-primary" style={{ marginTop: 4 }}>
                <Search className="w-5 h-5" /> Buscar Kamellador
              </button>
              <p style={{ textAlign: "center", fontSize: 11, color: "#a4b1c6", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <Shield className="w-3.5 h-3.5" /> Expira automáticamente si nadie acepta.
              </p>
            </form>
          </div>
        )}

        {/* ── STATE: Pending ── */}
        {activeRequest?.status === "pending" && (
          <div className="animate-fade-in-up" style={{ textAlign: "center" }}>
            <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 16px" }}>
              <div className="pulse-ring" />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Search className="w-8 h-8" style={{ color: "#ff7665" }} />
              </div>
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 4 }}>Buscando experto...</h3>
            <p style={{ color: "#5f6a79", fontSize: "0.8rem", marginBottom: 8 }}>
              Notificando profesionales de <b>{activeCategory?.shortName || activeRequest.category}</b>
            </p>
            {activeRequest.expires_at && <CountdownTimer expiresAt={activeRequest.expires_at} />}
            <button onClick={cancelRequest} style={{ marginTop: 20, background: "none", border: "none", color: "#ff7665", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem" }}>
              Cancelar solicitud
            </button>
          </div>
        )}

        {/* ── STATE: Accepted / In Progress / Completed ── */}
        {activeRequest && ["accepted", "in_progress", "completed"].includes(activeRequest.status) && (
          <div className="animate-fade-in-up">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: "#00cba9" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>
                {activeRequest.status === "completed" ? "Trabajo finalizado" : "Kamellador encontrado"}
              </h3>
            </div>

            {/* Provider info */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, background: "#f8fafc", borderRadius: 16, padding: 14 }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: "50%", background: "#1f2c45", color: "white", 
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0, overflow: "hidden",
                border: activeKamellador?.is_premium ? "2px solid #ffd700" : "none",
                boxShadow: activeKamellador?.is_premium ? "0 0 10px rgba(255, 215, 0, 0.4)" : "none"
              }}>
                {activeKamellador?.avatar_url ? <img src={activeKamellador.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (activeKamellador?.full_name?.[0]?.toUpperCase() || "K")}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, margin: 0, fontSize: "0.95rem", color: activeKamellador?.is_premium ? "#d4af37" : "inherit" }}>
                  {activeKamellador?.full_name || "Tu Kamellador"}
                  {activeKamellador?.is_premium && <span style={{fontSize: "0.65rem", verticalAlign: "middle", marginLeft: 6, background: "#ffd700", color: "#1f2c45", padding: "2px 6px", borderRadius: 8, fontWeight: 900}}>PRO</span>}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#5f6a79" }}>
                  <Star className="w-3 h-3" style={{ fill: "#f59e0b", color: "#f59e0b" }} /> {activeKamellador?.rating_avg || 0} ({activeKamellador?.rating_count || 0})
                </div>
              </div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 16, padding: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "#5f6a79", margin: 0 }}>{activeRequest.description} · <b>${formatPrice(activeRequest.agreed_price || activeRequest.proposed_price)}</b></p>
            </div>

            {/* Security code (only while waiting for arrival) */}
            {activeRequest.status === "accepted" && (
              <div style={{ textAlign: "center", marginBottom: 16, background: "#f7f3f1", borderRadius: 16, padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#a4b1c6", marginBottom: 8 }}>Código de seguridad</p>
                <div className="code-display">
                  {String(activeRequest.service_code || "----").split("").map((d, i) => (
                    <div key={i} className="code-display__digit">{d}</div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: "#5f6a79", marginTop: 8 }}>Dáselo al Kamellador cuando llegue</p>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              {canChat && (
                <button onClick={() => setChatOpen(true)} className="btn-secondary" style={{ flex: 1, position: "relative" }}>
                  <MessageSquare className="w-5 h-5" /> Chat
                  {unreadCount > 0 && (
                    <span style={{ position: "absolute", top: -5, right: -5, background: "#ff4757", color: "white", fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}
              {activeRequest.status === "in_progress" && (
                <button onClick={handleComplete} disabled={loadingById[activeRequest.id]} className="btn-primary" style={{ flex: 1 }}>Finalizar</button>
              )}
              {canRate && <button onClick={() => setRatingOpen(true)} className="btn-primary" style={{ flex: 1 }}>Calificar</button>}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Bottom Nav */}
      <BottomNav role="client" activeTab={activeTab} onTabChange={setActiveTab} unreadMessages={unreadCount} />

      {/* Chat Screen */}
      {chatOpen && activeRequest && (
        <div className="chat-screen">
          <div className="chat-screen__header">
            <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4 }}><X className="w-5 h-5" /></button>
            <div className="chat-screen__avatar" style={{ border: activeKamellador?.is_premium ? "2px solid #ffd700" : "none" }}>
              {activeKamellador?.avatar_url ? <img src={activeKamellador.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (activeKamellador?.full_name?.[0]?.toUpperCase() || "K")}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 700, margin: 0, fontSize: "0.9rem", color: activeKamellador?.is_premium ? "#d4af37" : "inherit" }}>
                {activeKamellador?.full_name || "Kamellador"}
                {activeKamellador?.is_premium && <span style={{fontSize: "0.6rem", verticalAlign: "middle", marginLeft: 6, background: "#ffd700", color: "#1f2c45", padding: "2px 4px", borderRadius: 8, fontWeight: 900}}>PRO</span>}
              </p>
              <p style={{ fontSize: 10, color: "#00cba9", fontWeight: 800, textTransform: "uppercase", margin: 0 }}>{activeCategory?.shortName}</p>
            </div>
          </div>
          <div className="chat-screen__body">
            {chatLoading ? <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6a79" }}><Loader2 className="w-5 h-5 animate-spin" /></div>
              : messages.length === 0 ? <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6a79", fontSize: "0.875rem" }}>Aún no hay mensajes.</div>
              : messages.map(m => <div key={m.id} className={`chat-bubble ${m.sender_id === user.id ? "chat-bubble--mine" : "chat-bubble--theirs"}`}>{m.body}</div>)}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className="chat-screen__input">
            <input value={chatDraft} onChange={e => setChatDraft(e.target.value)} placeholder="Escribe un mensaje..." />
            <button type="submit" disabled={!chatDraft.trim()} aria-label="Enviar"><Send className="w-4 h-4" /></button>
          </form>
        </div>
      )}

      {/* Rating Modal */}
      {ratingOpen && (
        <div className="rating-modal">
          <form onSubmit={handleRate} className="rating-modal__content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", margin: 0 }}>Calificar servicio</h3>
              <button type="button" onClick={() => setRatingOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X className="w-5 h-5" /></button>
            </div>
            
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v} type="button" onClick={() => setRatingValue(v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <Star className="w-8 h-8" style={{ fill: v <= ratingValue ? "#f59e0b" : "none", color: v <= ratingValue ? "#f59e0b" : "#d8cec7" }} />
                </button>
              ))}
            </div>

            <p style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "#a4b1c6", textAlign: "center", marginBottom: 12 }}>¿Qué tal fue la experiencia?</p>
            <div className="tag-selector">
              {["Puntual", "Limpio", "Ordenado", "Amable", "Experto", "Rápido"].map(tag => (
                <button 
                  key={tag} 
                  type="button" 
                  className={`tag-chip ${ratingTags.includes(tag) ? 'tag-chip--selected' : ''}`}
                  onClick={() => {
                    setRatingTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            <textarea 
              value={ratingComment} 
              onChange={e => setRatingComment(e.target.value)} 
              placeholder="Deja un comentario opcional..." 
              className="sheet-input" 
              style={{ height: 80, resize: "none", marginBottom: 16 }} 
            />
            
            <button type="submit" disabled={loadingById[activeRequest?.id]} className="btn-primary">
              {loadingById[activeRequest?.id] ? "Guardando..." : "Enviar calificación"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
