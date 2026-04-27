import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { getServiceCategory } from "./serviceCategories";
import { OPERATION_SELECT, useOperations } from "./hooks/useOperations";
import { usePushNotifications } from "./hooks/usePushNotifications";
import BottomSheet from "./components/BottomSheet";
import BottomNav from "./components/BottomNav";
import ProfileView from "./components/ProfileView";
import KYCVerification from "./components/KYCVerification";
import { 
  Bell, CheckCircle2, History, Loader2, LogOut, MessageSquare, MapPin, 
  Navigation, Send, Star, X, Lock, Power, Radio, Play, CreditCard 
} from "lucide-react";
import { getRoute } from "./utils/geo";
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;
const DEFAULT_LOCATION = [4.6097, -74.0817];

function ChangeMapView({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}
function formatPrice(v) { return Number(v || 0).toLocaleString("es-CO"); }
function formatDate(v) { return v ? new Date(v).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : ""; }
function getStatusLabel(s) {
  return { pending: "Pendiente", accepted: "Aceptado", in_progress: "En progreso", completed: "Completado", rated: "Calificado", cancelled: "Cancelado", expired: "Expirado" }[s] || s;
}

export default function ProviderDashboard() {
  const { fetchOperation, fetchActiveOperation, fetchHistory, startOperation, completeOperation, loadingById } = useOperations();
  const { subscribeToPush } = usePushNotifications();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [myLocation, setMyLocation] = useState(DEFAULT_LOCATION);
  const [serviceRadius, setServiceRadius] = useState(5);
  const [nearbyServices, setNearbyServices] = useState([]);
  const [activeOperation, setActiveOperation] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [route, setRoute] = useState([]);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const messagesEndRef = useRef(null);
  const pinRefs = [useRef(), useRef(), useRef(), useRef()];
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const isPremium = user?.email === 'mieduvan@gmail.com' || profile?.is_premium;
  const profileCategory = getServiceCategory(profile?.specialty);

  const refreshHistory = async (pid = user?.id) => { if (pid) setHistory(await fetchHistory(pid, "kamellador")); };
 
  const { totalEarnings, dailyEarnings } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return history.reduce((acc, op) => {
      // Solo sumamos lo que está completado o calificado
      if (!["completed", "rated"].includes(op.status)) return acc;
      
      const price = Number(op.agreed_price || op.proposed_price || 0);
      acc.totalEarnings += price;
      
      const opDate = new Date(op.updated_at);
      opDate.setHours(0, 0, 0, 0);
      
      if (opDate.getTime() === today.getTime()) {
        acc.dailyEarnings += price;
      }
      
      return acc;
    }, { totalEarnings: 0, dailyEarnings: 0 });
  }, [history]);

  // Init
  useEffect(() => {
    (async () => {
      try {
        const { data: { user: au } } = await supabase.auth.getUser();
        if (!au) { navigate("/login"); return; }
        setUser(au);
        const { data: pp } = await supabase.from("profiles").select("*").eq("id", au.id).single();
        if (pp) { setProfile(pp); setIsOnline(Boolean(pp.is_online)); }
        const active = await fetchActiveOperation(au.id, "kamellador");
        if (active) setActiveOperation({ ...active, client_lat: active.client_lat || DEFAULT_LOCATION[0] + 0.008, client_lng: active.client_lng || DEFAULT_LOCATION[1] + 0.005 });
        await refreshHistory(au.id);
        
        // Solicitar notificaciones
        setTimeout(() => subscribeToPush(au.id), 2000);

        // Chequear si es la primera vez para mostrar el walkthrough
        if (!localStorage.getItem("kamello_walkthrough_seen")) {
          setTimeout(() => setShowWalkthrough(true), 3000);
        }
      } catch (err) {
        console.error("Error initializing ProviderDashboard:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // Geolocation & presence
  useEffect(() => {
    if (!user) return;
    if (!isOnline) { supabase.from("profiles").update({ is_online: false }).eq("id", user.id); return; }
    const updatePresence = async (lat, lng) => { await supabase.from("profiles").update({ is_online: true, current_lat: lat, current_lng: lng }).eq("id", user.id); };
    let watchId;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        p => { setMyLocation([p.coords.latitude, p.coords.longitude]); updatePresence(p.coords.latitude, p.coords.longitude); },
        () => updatePresence(myLocation[0], myLocation[1])
      );
    } else updatePresence(myLocation[0], myLocation[1]);
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [isOnline, user]);

  // Fetch pending services
  useEffect(() => {
    if (!isOnline || !user || !profile?.specialty || activeOperation) { setNearbyServices([]); return; }
    const sc = getServiceCategory(profile.specialty);
    const vals = Array.from(new Set([profile.specialty, sc?.id, ...(sc?.aliases || [])].filter(Boolean)));
    const fetch = async () => {
      const { data } = await supabase.from("operations").select(OPERATION_SELECT).eq("status", "pending").in("category", vals).order("created_at", { ascending: false });
      if (data) setNearbyServices(data);
    };
    fetch();
    const channel = supabase.channel("public:operations")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "operations", filter: "status=eq.pending" }, p => {
        const rc = getServiceCategory(p.new.category);
        if (vals.includes(p.new.category) || rc?.id === sc?.id) setNearbyServices(prev => [p.new, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "operations" }, p => {
        if (p.new.status !== "pending") setNearbyServices(prev => prev.filter(s => s.id !== p.new.id));
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [isOnline, user, profile?.specialty, activeOperation]);

  // Active operation realtime
  useEffect(() => {
    if (!activeOperation?.id) return;
    const channel = supabase.channel(`prov_op_${activeOperation.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "operations", filter: `id=eq.${activeOperation.id}` }, async p => {
        if (["completed", "rated", "cancelled", "expired"].includes(p.new.status)) {
          const upd = await fetchOperation(p.new.id);
          setActiveOperation(p.new.status === "completed" ? upd : null);
          setActiveChat(null); setMessages([]); await refreshHistory(); return;
        }
        const upd = await fetchOperation(p.new.id);
        if (upd) setActiveOperation(upd);
        await refreshHistory();
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [activeOperation?.id]);
 
  // Real routing
  useEffect(() => {
    if (activeOperation && (activeOperation.status === 'accepted' || activeOperation.status === 'in_progress')) {
      const { client_lat, client_lng } = activeOperation;
      if (client_lat && client_lng && myLocation[0]) {
        getRoute(myLocation[0], myLocation[1], client_lat, client_lng)
          .then(coords => setRoute(coords))
          .catch(err => console.error("Route error:", err));
      }
    } else {
      setRoute([]);
    }
  }, [activeOperation?.client_lat, activeOperation?.client_lng, activeOperation?.status, myLocation[0], myLocation[1]]);

  // Chat background listener
  useEffect(() => {
    if (!activeOperation?.id) {
      setMessages([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    (async () => {
      setChatLoading(true);
      const { data } = await supabase.from("operation_messages").select("*").eq("operation_id", activeOperation.id).order("created_at", { ascending: true });
      if (data) setMessages(data);
      setChatLoading(false);
    })();

    const channel = supabase.channel(`prov_msgs_${activeOperation.id}`)
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "operation_messages", 
        filter: `operation_id=eq.${activeOperation.id}` 
      }, (p) => {
        setMessages(prev => {
          if (prev.some(m => m.id === p.new.id)) return prev;
          // If message is from client and chat is closed, count as unread
          if (p.new.sender_id !== user.id && (!activeChat || activeChat.id !== activeOperation.id)) {
            setUnreadCount(c => c + 1);
          }
          return [...prev, p.new];
        });
      }).subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeOperation?.id, activeChat]);

  // Clear unread when chat opens for THIS operation
  useEffect(() => {
    if (activeChat && activeChat.id === activeOperation?.id) {
      setUnreadCount(0);
    }
  }, [activeChat, activeOperation?.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleAcceptService = async (service) => {
    try {
      const { data, error } = await supabase.rpc('accept_operation', {
        p_operation_id: service.id,
        p_kamellador_id: user.id
      });

      if (error) {
        if (error.message.includes('INSUFFICIENT_CREDITS')) return alert("No tienes suficientes OPS. Por favor recarga.");
        if (error.message.includes('OPERATION_NOT_PENDING')) return alert("Esta solicitud ya fue tomada o cancelada.");
        return alert("Error al aceptar el servicio.");
      }
      
      // La base de datos descontó el OPS, actualizamos el estado visual
      setProfile(prev => ({ ...prev, ops_credits: (prev?.ops_credits || 10) - 1 }));
      
      // Refetch full operation to get nested client details
      const active = await fetchActiveOperation(user.id, "kamellador");
      setActiveOperation({ ...active, client_lat: active.client_lat || DEFAULT_LOCATION[0] + 0.008, client_lng: active.client_lng || DEFAULT_LOCATION[1] + 0.005 });
      
      setNearbyServices([]); 
      await refreshHistory();
    } catch (err) {
      alert("Error inesperado al aceptar.");
    }
  };

  const handlePinChange = (value, index) => {
    const v = value.replace(/\D/g, "").slice(0, 1);
    const arr = pinInput.split("");
    while (arr.length < 4) arr.push("");
    arr[index] = v;
    setPinInput(arr.join(""));
    if (v && index < 3) pinRefs[index + 1].current?.focus();
  };

  const handleStart = async (e) => {
    if (e) e.preventDefault();
    if (pinInput.length < 4) { setPinError("Ingresa el código de 4 dígitos"); return; }
    try {
      setPinError("");
      const updated = await startOperation(activeOperation.id, pinInput);
      setActiveOperation(updated); setPinInput(""); await refreshHistory();
    } catch (err) { setPinError(err.message); }
  };


  const sendMessage = async (e) => {
    e.preventDefault();
    const body = chatDraft.trim();
    if (!body || !activeChat?.id || !user?.id) return;
    setChatDraft("");
    const { data, error } = await supabase.from("operation_messages").insert({ operation_id: activeChat.id, sender_id: user.id, body }).select().single();
    if (error) { setChatDraft(body); return alert("Error: " + error.message); }
    setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data]);
  };

  if (loading) return <div className="app-shell" style={{ justifyContent: "center", alignItems: "center" }}><Loader2 className="h-8 w-8 animate-spin text-[#ff7665]" /></div>;

  // Pantalla de KYC obligatoria
  if (profile && profile.verification_status !== 'verified' && profile.verification_status !== null) {
    return (
      <KYCVerification 
        user={user} 
        profile={profile} 
        onVerified={async () => {
          // Refetch profile
          const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          if (data) setProfile(data);
        }} 
      />
    );
  }

  // Tab: Earnings
  if (activeTab === "earnings") {
    const dailyGoal = 200000;
    const progress = Math.min((dailyEarnings / dailyGoal) * 100, 100);
    
    return (
      <div className="app-shell">
        <div className="view-container">
          <div className="view-container__content">
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", marginBottom: 16 }}>Ganancias</h2>
            
            <div className="earnings-widget">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
                <p style={{ fontSize: 12, opacity: 0.6, margin: 0, fontWeight: 700, textTransform: "uppercase" }}>Hoy</p>
                <span style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>Meta: ${formatPrice(dailyGoal)}</span>
              </div>
              <div className="earnings-widget__amount" style={{ marginBottom: 12 }}>
                ${formatPrice(dailyEarnings)}
              </div>
              <div className="earnings-widget__bar">
                <div className="earnings-widget__bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <p style={{ fontSize: 11, opacity: 0.5, marginTop: 10, textAlign: "right" }}>{progress.toFixed(0)}% de la meta</p>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 20, padding: 16, marginBottom: 20, border: "1px solid #efe7e2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#a4b1c6", textTransform: "uppercase", margin: 0 }}>Saldo Total</p>
                <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1f2c45", margin: 0 }}>${formatPrice(totalEarnings)}</p>
              </div>
              <div style={{ background: "#00cba9", color: "white", padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 800 }}>ACTIVO</div>
            </div>

            <div className="history-section">
              <p className="history-section__title">Historial de cobros</p>
              {history.length === 0 ? <p style={{ color: "#5f6a79", fontSize: "0.875rem" }}>Sin historial aún.</p> : history.map(op => {
                const r = op.operation_ratings?.[0];
                return (<div key={op.id} className="history-item">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <p style={{ fontWeight: 700, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{op.description}</p>
                    <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "#1f2c45" }}>${formatPrice(op.agreed_price || op.proposed_price)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <p style={{ fontSize: 11, color: "#5f6a79", margin: 0 }}>{formatDate(op.updated_at)}</p>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "#a4b1c6" }}>{getStatusLabel(op.status)}</span>
                  </div>
                </div>);
              })}
            </div>
          </div>
        </div>
        <div className="top-bar"><div className="top-bar__left"><img src="/images/K-Editado.png" alt="K" className="top-bar__logo" /><span className="top-bar__title">Kamello</span></div><div className="top-bar__right"><button onClick={() => supabase.auth.signOut().then(() => navigate("/"))} className="top-bar__btn"><LogOut className="w-4 h-4" /></button></div></div>
        <BottomNav role="kamellador" activeTab={activeTab} onTabChange={setActiveTab} unreadMessages={unreadCount} />
      </div>
    );
  }
  if (activeTab === "menu") {
    return (
      <div className="app-shell">
        <div className="view-container">
          <div className="view-container__content">
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", marginBottom: 16 }}>Mi Menú</h2>
            <ProfileView user={user} onLogout={() => navigate("/")} />
          </div>
        </div>
        <div className="top-bar"><div className="top-bar__left"><img src="/images/K-Editado.png" alt="K" className="top-bar__logo" /><span className="top-bar__title">Kamello</span></div><div className="top-bar__right"><button onClick={() => supabase.auth.signOut().then(() => navigate("/"))} className="top-bar__btn"><LogOut className="w-4 h-4" /></button></div></div>
        <BottomNav role="kamellador" activeTab={activeTab} onTabChange={setActiveTab} unreadMessages={unreadCount} />
      </div>
    );
  }

  // Snap points based on state
  const getSnap = () => {
    if (activeOperation) return { pts: [25, 50, 80], init: 1 };
    if (!isOnline) return { pts: [45, 70], init: 0 };
    if (nearbyServices.length > 0) return { pts: [30, 55, 80], init: 1 };
    return { pts: [25, 45], init: 0 };
  };
  const { pts, init } = getSnap();

  return (
    <div className="app-shell">
      {/* Map */}
      <div className="map-fullscreen">
        <MapContainer center={myLocation} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {activeOperation ? (
              <>
                {activeOperation.client_lat != null && (
                  <Marker position={[Number(activeOperation.client_lat), Number(activeOperation.client_lng)]} />
                )}
                <Marker position={myLocation} icon={L.divIcon({ className: 'my-location-marker', html: `<div class="marker-self">🛵</div>`, iconSize: [30, 30] })} />
                {route.length > 0 ? (
                  <Polyline positions={route} color="#ff7665" weight={5} opacity={0.7} dashArray="1, 10" lineCap="round" />
                ) : (activeOperation.client_lat != null && myLocation[0] != null) ? (
                  <Polyline positions={[myLocation, [Number(activeOperation.client_lat), Number(activeOperation.client_lng)]]} color="#ff7665" weight={3} dashArray="5, 10" />
                ) : null}
              </>
            ) : isOnline && nearbyServices.map(svc => (
              <Marker key={svc.id} position={[Number(svc.client_lat), Number(svc.client_lng)]} icon={L.divIcon({ className: 'nearby-service-marker', html: `<div class="marker-service">🛠️</div>`, iconSize: [24, 24] })} />
            ))}

          {/* User Location Marker */}
          {myLocation && (
            <>
              <Circle center={myLocation} radius={40} pathOptions={{ fillColor: "#3b82f6", color: "white", fillOpacity: 0.8, weight: 2 }} />
              <Circle center={myLocation} radius={100} pathOptions={{ fillColor: "#3b82f6", color: "#3b82f6", fillOpacity: 0.1, weight: 1 }} className="animate-pulse" />
            </>
          )}

          {!activeOperation && isOnline && <Circle center={myLocation} radius={serviceRadius * 1000} pathOptions={{ fillColor: "#00cba9", color: "#00cba9", fillOpacity: 0.03, weight: 1, dashArray: "5, 5" }} />}
          <ChangeMapView center={activeOperation?.client_lat ? [Number(activeOperation.client_lat), Number(activeOperation.client_lng)] : myLocation} />
        </MapContainer>
      </div>

      {/* Top bar */}
      <div className="top-bar">
        <div className="top-bar__left"><img src="/images/K-Editado.png" alt="K" className="top-bar__logo" /><span className="top-bar__title">Kamello</span></div>
        <div className="top-bar__right">
          <div className="ops-badge" style={{ background: "rgba(255,255,255,0.9)", padding: "4px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <CreditCard className="w-3.5 h-3.5" style={{ color: "#ff7665" }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: "#1f2c45" }}>{profile?.ops_credits ?? 10} OPS</span>
          </div>
          {isOnline && !activeOperation && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderRadius: 100, padding: "6px 14px", boxShadow: "0 2px 12px rgba(31,44,69,0.08)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00cba9" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1f2c45" }}>Online</span>
            </div>
          )}
          <button onClick={() => supabase.auth.signOut().then(() => navigate("/"))} className="top-bar__btn"><LogOut className="w-4 h-4" /></button>
          <button onClick={() => setActiveTab("menu")} className="top-bar__avatar">{user?.email?.[0]?.toUpperCase()}</button>
        </div>
      </div>

      {/* Offline overlay on map */}
      {!isOnline && !activeOperation && (
        <div style={{ position: "absolute", inset: 0, zIndex: 100, background: "rgba(247,243,241,0.5)", backdropFilter: "blur(2px)", pointerEvents: "none" }} />
      )}

      {/* Bottom Sheet */}
      <BottomSheet snapPoints={pts} initialSnap={init}>
        {/* ── OFFLINE ── */}
        {!isOnline && !activeOperation && (
          <div className="animate-fade-in-up">
            <div className="offline-hero">
              <h2 className="offline-hero__title">Estás desconectado</h2>
              <p className="offline-hero__sub">¿Todo listo para trabajar?</p>
            </div>
            <div className="earnings-widget">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><Star className="w-4 h-4" style={{ fill: "#f59e0b", color: "#f59e0b" }} /><span style={{ fontSize: "1.5rem", fontWeight: 800 }}>{profile?.rating_avg || "0.0"}</span></div>
              <p style={{ fontSize: 11, opacity: 0.5 }}>{profile?.rating_count || 0} calificaciones · {profileCategory?.shortName || profile?.specialty || "Sin especialidad"}</p>
            </div>
            <button onClick={() => setIsOnline(true)} className="cta-connect cta-connect--go">
              <Radio className="w-5 h-5" /> Conectarse
            </button>
          </div>
        )}

        {/* ── ONLINE, NO ACTIVE ── */}
        {isOnline && !activeOperation && (
          <div className="animate-fade-in-up">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00cba9", boxShadow: "0 0 0 4px rgba(0,203,169,0.15)" }} />
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Recibiendo solicitudes</span>
              <span style={{ fontSize: 12, color: "#5f6a79" }}>· {profileCategory?.shortName || profile?.specialty}</span>
            </div>

            {/* Radius Selector */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#a4b1c6", textTransform: "uppercase", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                Radio de trabajo: <span>{serviceRadius} km</span>
              </p>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {[1, 2, 5, 10, 15].map(r => {
                  const isLocked = (r >= 10) && !isPremium;
                  return (
                    <button
                      key={r}
                      onClick={() => !isLocked && setServiceRadius(r)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 700,
                        border: "1px solid",
                        borderColor: serviceRadius === r ? "#ff7665" : "#efe7e2",
                        background: serviceRadius === r ? "#fff0ee" : "white",
                        color: isLocked ? "#a4b1c6" : (serviceRadius === r ? "#ff7665" : "#5f6a79"),
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        whiteSpace: "nowrap",
                        cursor: isLocked ? "not-allowed" : "pointer",
                        opacity: isLocked ? 0.7 : 1
                      }}
                    >
                      {r} km {isLocked && <Lock className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
              {!isPremium && (
                <p style={{ fontSize: 10, color: "#ff7665", marginTop: 6, fontWeight: 600 }}>
                  🌟 Hazte Premium para ampliar tu alcance a 15km
                </p>
              )}
            </div>

            {nearbyServices.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <Bell className="w-10 h-10" style={{ color: "#a4b1c6", margin: "0 auto 12px" }} />
                <p style={{ fontWeight: 700, color: "#5f6a79", fontSize: "0.875rem" }}>Sin solicitudes nuevas</p>
                <p style={{ fontSize: 12, color: "#a4b1c6" }}>Te notificaremos cuando llegue una.</p>
              </div>
            ) : nearbyServices.map(svc => {
              const dist = svc.client_lat && myLocation[0] ? (Math.sqrt(Math.pow(svc.client_lat - myLocation[0], 2) + Math.pow(svc.client_lng - myLocation[1], 2)) * 111).toFixed(1) : "?";
              return (
                <div key={svc.id} className="req-notify animate-fade-in-up">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: "0.95rem", margin: "0 0 4px" }}>{svc.description}</p>
                      <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>{dist} km · {getServiceCategory(svc.category)?.shortName || svc.category}</p>
                    </div>
                    <span style={{ background: "#00cba9", color: "white", fontWeight: 800, fontSize: "0.9rem", padding: "4px 12px", borderRadius: 100 }}>${formatPrice(svc.proposed_price)}</span>
                  </div>
                  <button onClick={() => handleAcceptService(svc)} className="btn-primary btn-primary--accent" style={{ borderRadius: 100 }}>Aceptar solicitud</button>
                </div>
              );
            })}

            <button onClick={() => setIsOnline(false)} className="cta-connect cta-connect--stop" style={{ marginTop: 12 }}>Desconectarse</button>
          </div>
        )}

        {/* ── ACTIVE: ACCEPTED (needs PIN) ── */}
        {activeOperation?.status === "accepted" && (
          <div className="animate-fade-in-up">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: "#00cba9" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>Solicitud aceptada</h3>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 16, padding: 14, marginBottom: 16 }}>
              <p style={{ fontWeight: 700, margin: "0 0 4px" }}>{activeOperation.client?.full_name || "Cliente"}</p>
              <p style={{ fontSize: 13, color: "#5f6a79", margin: 0 }}>{activeOperation.description} · ${formatPrice(activeOperation.agreed_price || activeOperation.proposed_price)}</p>
            </div>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Lock className="w-6 h-6" style={{ color: "#ff7665", margin: "0 auto 8px" }} />
              <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>Código de servicio</p>
              <p style={{ fontSize: 12, color: "#5f6a79", marginBottom: 12 }}>Pídele al cliente el código de 4 dígitos</p>
              <form onSubmit={handleStart}>
                <div className="pin-row">
                  {[0, 1, 2, 3].map(i => (
                    <input key={i} ref={pinRefs[i]} type="text" inputMode="numeric" maxLength="1" className="pin-cell"
                      value={pinInput[i] || ""} onChange={e => handlePinChange(e.target.value, i)}
                      onKeyDown={e => { if (e.key === "Backspace" && !pinInput[i] && i > 0) pinRefs[i - 1].current?.focus(); }}
                    />
                  ))}
                </div>
                {pinError && <p style={{ color: "#ef4444", fontSize: 13, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>{pinError}</p>}
                <button type="submit" disabled={loadingById[activeOperation.id] || pinInput.length < 4} className="btn-primary">
                  <Play className="w-5 h-5" /> {loadingById[activeOperation.id] ? "Validando..." : "Iniciar trabajo"}
                </button>
              </form>
            </div>
            <button onClick={() => setActiveChat(activeOperation)} className="btn-secondary" style={{ marginTop: 8, position: "relative" }}>
              <MessageSquare className="w-5 h-5" /> Chat con cliente
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: -5, right: -5, background: "#ff4757", color: "white", fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* ── ACTIVE: IN PROGRESS ── */}
        {activeOperation?.status === "in_progress" && (
          <div className="animate-fade-in-up">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Navigation className="w-5 h-5 animate-pulse" style={{ color: "#ff7665" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>En progreso</h3>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 16, padding: 14, marginBottom: 16 }}>
              <p style={{ fontWeight: 700, margin: "0 0 4px" }}>{activeOperation.client?.full_name || "Cliente"}</p>
              <p style={{ fontSize: 13, color: "#5f6a79", margin: 0 }}>{activeOperation.description}</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setActiveChat(activeOperation)} className="btn-secondary" style={{ flex: 1, position: "relative" }}>
                <MessageSquare className="w-5 h-5" /> Chat
                {unreadCount > 0 && (
                  <span style={{ position: "absolute", top: -5, right: -5, background: "#ff4757", color: "white", fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: 12, color: "#5f6a79", marginTop: 12, fontWeight: 600 }}>
              El cliente finalizará la orden cuando el trabajo termine.
            </p>
          </div>
        )}

        {/* ── ACTIVE: COMPLETED (waiting for rating) ── */}
        {activeOperation?.status === "completed" && (
          <div className="animate-fade-in-up" style={{ textAlign: "center" }}>
            <CheckCircle2 className="w-12 h-12" style={{ color: "#00cba9", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 4 }}>Trabajo finalizado</h3>
            <p style={{ color: "#5f6a79", fontSize: "0.85rem" }}>Esperando calificación del cliente.</p>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setActiveChat(activeOperation)} className="btn-secondary" style={{ flex: 1, position: "relative" }}>
                <MessageSquare className="w-5 h-5" /> Chat
                {unreadCount > 0 && (
                  <span style={{ position: "absolute", top: -5, right: -5, background: "#ff4757", color: "white", fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              <button onClick={() => setActiveOperation(null)} className="btn-primary" style={{ flex: 1 }}>Listo para otro</button>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomNav role="kamellador" activeTab={activeTab} onTabChange={setActiveTab} unreadMessages={unreadCount} />

      {/* Walkthrough Modal */}
      {showWalkthrough && (
        <div className="modal-overlay" style={{ zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="animate-fade-in-up" style={{ background: "white", borderRadius: 24, padding: 24, maxWidth: 340, width: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, background: "linear-gradient(135deg, #ff7665, #ff4757)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              {walkthroughStep === 0 && <Radio className="w-8 h-8 text-white" />}
              {walkthroughStep === 1 && <MapPin className="w-8 h-8 text-white" />}
              {walkthroughStep === 2 && <CreditCard className="w-8 h-8 text-white" />}
              {walkthroughStep === 3 && <CheckCircle2 className="w-8 h-8 text-white" />}
            </div>
            
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: 12, color: "#1a1f26" }}>
              {walkthroughStep === 0 && "¡Bienvenido, Kamellador!"}
              {walkthroughStep === 1 && "Encuentra Clientes"}
              {walkthroughStep === 2 && "Tus Créditos (OPS)"}
              {walkthroughStep === 3 && "¡Todo listo!"}
            </h2>
            
            <p style={{ color: "#5f6a79", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: 24 }}>
              {walkthroughStep === 0 && "Estamos felices de tenerte. Activa el botón de arriba para empezar a recibir ofertas de trabajo cerca de ti."}
              {walkthroughStep === 1 && "Verás puntos en el mapa. Tócalos para ver los detalles del trabajo, el presupuesto y la descripción."}
              {walkthroughStep === 2 && "Cada vez que aceptes un trabajo se consumirá 1 OPS. Te hemos regalado 10 para que empieces a kamellar."}
              {walkthroughStep === 3 && "Recuerda pedirle el código de 4 dígitos al cliente para iniciar el trabajo. ¡Mucha suerte!"}
            </p>

            <button 
              onClick={() => {
                if (walkthroughStep < 3) {
                  setWalkthroughStep(s => s + 1);
                } else {
                  setShowWalkthrough(false);
                  localStorage.setItem("kamello_walkthrough_seen", "true");
                }
              }} 
              className="btn-primary" 
              style={{ width: "100%" }}
            >
              {walkthroughStep < 3 ? "Siguiente" : "¡Empezar a Kamellar!"}
            </button>
          </div>
        </div>
      )}

      {/* Chat Screen */}
      {activeChat && (
        <div className="chat-screen">
          <div className="chat-screen__header">
            <button onClick={() => setActiveChat(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4 }}><X className="w-5 h-5" /></button>
            <div className="chat-screen__avatar">{activeChat.client?.full_name?.[0]?.toUpperCase() || "C"}</div>
            <div><p style={{ fontWeight: 700, margin: 0, fontSize: "0.9rem" }}>{activeChat.client?.full_name || "Cliente"}</p><p style={{ fontSize: 10, color: "#00cba9", fontWeight: 800, margin: 0 }}>CLIENTE</p></div>
          </div>
          <div className="chat-screen__body">
            {chatLoading ? <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6a79" }}>Cargando...</div>
              : messages.length === 0 ? <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6a79", fontSize: "0.875rem" }}>Aún no hay mensajes.</div>
              : messages.map(m => <div key={m.id} className={`chat-bubble ${m.sender_id === user.id ? "chat-bubble--mine" : "chat-bubble--theirs"}`}>{m.body}</div>)}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className="chat-screen__input">
            <input value={chatDraft} onChange={e => setChatDraft(e.target.value)} placeholder="Escribe..." />
            <button type="submit" disabled={!chatDraft.trim()}><Send className="w-4 h-4" /></button>
          </form>
        </div>
      )}
    </div>
  );
}
