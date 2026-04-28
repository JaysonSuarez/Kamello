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
  Navigation, Send, Star, X, Lock, Power, Radio, Play, CreditCard, Zap, Check 
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
  const [offeringSvc, setOfferingSvc] = useState(null);
  const [counterPrice, setCounterPrice] = useState("");
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const isPremium = Boolean(profile?.is_premium);
  const profileCategory = getServiceCategory(profile?.specialty);

  const refreshHistory = async (pid = user?.id) => { if (pid) setHistory(await fetchHistory(pid, "kamellador")); };
  
  // Stats calculation
  const { totalEarnings, dailyEarnings } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return history.reduce((acc, op) => {
      if (!["completed", "rated"].includes(op.status)) return acc;
      const price = Number(op.agreed_price || op.proposed_price || 0);
      acc.totalEarnings += price;
      const opDate = new Date(op.updated_at);
      opDate.setHours(0, 0, 0, 0);
      if (opDate.getTime() === today.getTime()) acc.dailyEarnings += price;
      return acc;
    }, { totalEarnings: 0, dailyEarnings: 0 });
  }, [history]);

  // Init & Realtime Profile Sync
  useEffect(() => {
    let profileChannel;

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
        setTimeout(() => subscribeToPush(au.id), 2000);

        if (!localStorage.getItem("kamello_walkthrough_seen")) {
          setTimeout(() => setShowWalkthrough(true), 3000);
        }

        // Suscribirse a cambios en el propio perfil
        profileChannel = supabase.channel(`profile_sync_${au.id}`)
          .on("postgres_changes", { 
            event: "UPDATE", 
            schema: "public", 
            table: "profiles", 
            filter: `id=eq.${au.id}` 
          }, payload => {
            setProfile(payload.new);
          })
          .subscribe();

      } catch (err) {
        console.error("Error initializing ProviderDashboard:", err);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (profileChannel) supabase.removeChannel(profileChannel);
    };
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
    if (!activeOperation?.id) { setMessages([]); setUnreadCount(0); return; }
    (async () => {
      setChatLoading(true);
      const { data } = await supabase.from("operation_messages").select("*").eq("operation_id", activeOperation.id).order("created_at", { ascending: true });
      if (data) setMessages(data);
      setChatLoading(false);
    })();
    const channel = supabase.channel(`prov_msgs_${activeOperation.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "operation_messages", filter: `operation_id=eq.${activeOperation.id}` }, (p) => {
        setMessages(prev => {
          if (prev.some(m => m.id === p.new.id)) return prev;
          if (p.new.sender_id !== user.id && (!activeChat || activeChat.id !== activeOperation.id)) setUnreadCount(c => c + 1);
          return [...prev, p.new];
        });
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [activeOperation?.id, activeChat]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleAcceptService = async (service) => {
    try {
      const { data, error } = await supabase.rpc('accept_operation', { p_operation_id: service.id, p_kamellador_id: user.id });
      if (error) {
        if (error.message.includes('INSUFFICIENT_CREDITS')) return alert("No tienes suficientes OPS. Por favor recarga.");
        if (error.message.includes('OPERATION_NOT_PENDING')) return alert("Esta solicitud ya fue tomada o cancelada.");
        return alert("Error al aceptar el servicio.");
      }
      setProfile(prev => ({ ...prev, ops_credits: (prev?.ops_credits || 10) - 1 }));
      const active = await fetchActiveOperation(user.id, "kamellador");
      setActiveOperation({ ...active, client_lat: active.client_lat || DEFAULT_LOCATION[0] + 0.008, client_lng: active.client_lng || DEFAULT_LOCATION[1] + 0.005 });
      setNearbyServices([]); 
      await refreshHistory();
    } catch (err) { alert("Error inesperado al aceptar."); }
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

  // KYC Screen Logic
  if (profile && profile.verification_status !== 'verified') {
    return (
      <KYCVerification 
        user={user} 
        profile={profile} 
        onVerified={async () => {
          const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          if (data) setProfile(data);
        }} 
      />
    );
  }

  // --- REST OF THE RENDER LOGIC ---
  if (activeTab === "earnings") return <div className="app-shell">Ganancias</div>; 
  if (activeTab === "premium") return <div className="app-shell">Premium</div>;
  if (activeTab === "menu") return <div className="app-shell">Menú</div>;

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
                <Marker position={[Number(activeOperation.client_lat), Number(activeOperation.client_lng)]} />
                <Marker position={myLocation} icon={L.divIcon({ className: 'my-location-marker', html: `<div class="marker-self">🛵</div>`, iconSize: [30, 30] })} />
                <Polyline positions={route} color="#ff7665" weight={5} opacity={0.7} />
              </>
            ) : isOnline && nearbyServices.map(svc => (
              <Marker key={svc.id} position={[Number(svc.client_lat), Number(svc.client_lng)]} />
            ))}
          <ChangeMapView center={activeOperation?.client_lat ? [Number(activeOperation.client_lat), Number(activeOperation.client_lng)] : myLocation} />
        </MapContainer>
      </div>

      <div className="top-bar">
        <div className="top-bar__left"><img src="/images/K-Editado.png" alt="K" className="top-bar__logo" /><span className="top-bar__title">Kamello</span></div>
        <div className="top-bar__right">
          <button onClick={() => setIsOnline(!isOnline)} className={`btn-status ${isOnline ? 'online' : 'offline'}`}>{isOnline ? 'Online' : 'Offline'}</button>
          <button onClick={() => navigate("/dashboard")} className="top-bar__avatar">{user?.email?.[0]?.toUpperCase()}</button>
        </div>
      </div>

      <BottomSheet snapPoints={pts} initialSnap={init}>
        {isOnline ? (
          <div>Online Mode</div>
        ) : (
          <div>Offline Mode</div>
        )}
      </BottomSheet>

      <BottomNav role="kamellador" activeTab={activeTab} onTabChange={setActiveTab} unreadMessages={unreadCount} />
    </div>
  );
}
