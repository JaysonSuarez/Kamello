import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import {
  CheckCircle2, Clock, CreditCard, Loader2, LogOut, MapPin,
  MessageSquare, Navigation, Phone, Search, Send, Shield, Star, X, XCircle, Zap
} from "lucide-react";
import { getServiceCategory } from "./serviceCategories";
import { OPERATION_SELECT, useOperations } from "./hooks/useOperations";
import BottomSheet from "./components/BottomSheet";
import BottomNav from "./components/BottomNav";
import ProfileView from "./components/ProfileView";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { getRoute } from "./utils/geo";
import FeedView from "./components/FeedView";
import OPSDocument from "./components/OPSDocument";

// Modular Components
import MapView from "./components/client/MapView";
import RequestServiceForm from "./components/client/RequestServiceForm";
import ActiveOperationView from "./components/client/ActiveOperationView";

const DEFAULT_POSITION = [4.6097, -74.0817];

function formatPrice(v) {
  return Number(v || 0).toLocaleString("es-CO");
}

function formatDate(v) {
  return v ? new Date(v).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : "";
}

function getStatusLabel(s) {
  return { pending: "Buscando", accepted: "Aceptado", in_progress: "En progreso", completed: "Por calificar", rated: "Calificado", cancelled: "Cancelado", expired: "Expirado" }[s] || s;
}

export default function ClientDashboard({ user }) {
  if (!user) return <div className="app-shell" style={{ justifyContent: "center", alignItems: "center" }}><Loader2 className="h-8 w-8 animate-spin text-[#ff7665]" /></div>;
  
  const navigate = useNavigate();
  const { subscribeToPush } = usePushNotifications();
  const { fetchOperation, fetchActiveOperation, fetchHistory, rateOperation, completeOperation, loadingById } = useOperations();

  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState(null);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
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
  const [offers, setOffers] = useState([]);
  const [activeTab, setActiveTab] = useState("home");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLocationFixed, setIsLocationFixed] = useState(false);
  const [showExpiredView, setShowExpiredView] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bargainingOfferId, setBargainingOfferId] = useState(null);
  const [bargainPrice, setBargainPrice] = useState("");
  const [route, setRoute] = useState([]);
  const [showOPSDoc, setShowOPSDoc] = useState(false);
  const [pendingOPSOperation, setPendingOPSOperation] = useState(null);
  const [selectedHistoryOp, setSelectedHistoryOp] = useState(null);
  const [showPricePrompt, setShowPricePrompt] = useState(false);
  const [agreedPriceInput, setAgreedPriceInput] = useState("");
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
        setTimeout(() => subscribeToPush(user.id), 2000);
      }
    })();
  }, [user.id]);

  useEffect(() => {
    if (!activeRequest?.id) return;
    const channel = supabase.channel(`operation_${activeRequest.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "operations", filter: `id=eq.${activeRequest.id}` }, async (payload) => {
        if (payload.new.status === "expired") {
          setShowExpiredView(true);
          setActiveRequest(null); setChatOpen(false); setMessages([]); await refreshHistory(); return;
        }
        if (["cancelled", "rated"].includes(payload.new.status)) {
          setActiveRequest(null); setChatOpen(false); setMessages([]); await refreshHistory(); return;
        }
        const updated = await fetchOperation(payload.new.id);
        if (updated) setActiveRequest(updated);
        await refreshHistory();
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [activeRequest?.id]);
  
  // Listen for reactivated operations (Option A)
  useEffect(() => {
    if (!user?.id || activeRequest) return;
    
    const channel = supabase.channel(`client_ops_rescue_${user.id}`)
      .on("postgres_changes", { 
        event: "UPDATE", 
        schema: "public", 
        table: "operations", 
        filter: `client_id=eq.${user.id}` 
      }, async (payload) => {
        if (payload.new.status === "pending" && !activeRequest) {
          const updated = await fetchOperation(payload.new.id);
          if (updated) {
            setActiveRequest(updated);
            setShowExpiredView(false);
          }
        }
      })
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [user?.id, activeRequest, fetchOperation]);

  useEffect(() => {
    if (!activeRequest?.id) {
      setMessages([]);
      setUnreadCount(0);
      return;
    }
    (async () => {
      setChatLoading(true);
      const { data } = await supabase.from("operation_messages").select("*").eq("operation_id", activeRequest.id).order("created_at", { ascending: true });
      if (data) setMessages(data);
      setChatLoading(false);
    })();
    const channel = supabase.channel(`msgs_${activeRequest.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "operation_messages", filter: `operation_id=eq.${activeRequest.id}` }, (p) => {
        setMessages(prev => {
          if (prev.some(m => m.id === p.new.id)) return prev;
          if (p.new.sender_id !== user.id && !chatOpen) setUnreadCount(c => c + 1);
          return [...prev, p.new];
        });
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [activeRequest?.id, chatOpen]);

  useEffect(() => {
    if (activeRequest?.status !== "pending") {
      setOffers([]);
      return;
    }
    const fetchOffers = async () => {
      const { data } = await supabase.from("operation_offers")
        .select("*, kamellador:profiles(*)")
        .eq("operation_id", activeRequest.id)
        .neq("status", "rejected")
        .order("created_at", { ascending: false });
      if (data) setOffers(data);
    };
    fetchOffers();
    const channel = supabase.channel(`negotiation_${activeRequest.id}`)
      .on("broadcast", { event: "new_offer" }, () => fetchOffers())
      .on("postgres_changes", { event: "*", schema: "public", table: "operation_offers", filter: `operation_id=eq.${activeRequest.id}` }, () => fetchOffers())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [activeRequest?.id, activeRequest?.status]);

  useEffect(() => { if (chatOpen) setUnreadCount(0); }, [chatOpen]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Real-time routing for client
  useEffect(() => {
    if (activeRequest && (activeRequest.status === 'accepted' || activeRequest.status === 'in_progress')) {
      const clientLat = activeRequest.client_lat;
      const clientLng = activeRequest.client_lng;
      const kLat = activeRequest.kamellador?.current_lat;
      const kLng = activeRequest.kamellador?.current_lng;

      if (clientLat && clientLng && kLat && kLng) {
        getRoute(kLat, kLng, clientLat, clientLng)
          .then(coords => setRoute(coords))
          .catch(err => console.error("Client Route Error:", err));
      }
    } else {
      setRoute([]);
    }
  }, [activeRequest?.status, activeRequest?.kamellador?.current_lat, activeRequest?.kamellador?.current_lng]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!category || !description || !position) return alert("Completa todos los campos.");
    setLoading(true);
    const finalDescription = subcategory ? `[${subcategory}] ${description}` : description;
    const { data, error } = await supabase.from("operations").insert({
      client_id: user.id, category, description: finalDescription,
      proposed_price: 0,
      client_lat: position[0], client_lng: position[1],
      status: "pending", expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }).select(OPERATION_SELECT).single();
    if (error) alert("Error: " + error.message);
    else { 
      setActiveRequest(data); 
      await refreshHistory(); 

      // Send Push Notification to Online Kamelladors
      try {
        const { data: kamelladors } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "kamellador")
          .eq("is_online", true);

        if (kamelladors && kamelladors.length > 0) {
          kamelladors.forEach(k => {
            supabase.functions.invoke("bright-responder", {
              body: {
                userId: k.id,
                title: "Nueva Solicitud 🚀",
                body: `Alguien necesita: ${category}. Sé el primero en ofertar.`,
                data: { url: "/" }
              }
            });
          });
        }
      } catch (err) {
        console.error("Error sending push to kamelladors", err);
      }
    }
    setLoading(false);
  };

  const handleFeedRequest = async (post) => {
    setLoading(true);
    try {
      // 1. Crear la operación directa vinculada al kamellador del post
      const { data: op, error: opError } = await supabase.from("operations").insert({
        client_id: user.id,
        kamellador_id: post.kamellador_id,
        category: post.service_name,
        description: `Solicitud desde el Feed: ${(post.bio || "").substring(0, 100)}...`,
        proposed_price: 0, 
        client_lat: position?.[0] || 0,
        client_lng: position?.[1] || 0,
        status: "pending",
      }).select(OPERATION_SELECT).single();

      if (opError) throw opError;

      // 2. Enviar mensaje predefinido
      const predefMessage = `¡Hola! 👋 Vi tu anuncio de *${post.service_name}* en el Feed y me interesa contratarte. ¿Podemos hablar sobre los detalles?`;
      await supabase.from("operation_messages").insert({
        operation_id: op.id,
        sender_id: user.id,
        body: predefMessage
      });

      // 3. Notificar al Kamellador
      supabase.functions.invoke("bright-responder", {
        body: {
          userId: post.kamellador_id,
          title: "¡Alguien quiere contratarte! 🎉",
          body: `Han solicitado tus servicios desde tu anuncio en el Feed. Entra para chatear.`,
          data: { url: "/" }
        }
      }).catch(console.error);

      // 4. Actualizar estado y redirigir al flujo de negociación
      setActiveRequest(op);
      setChatOpen(true);
      setActiveTab("inicio");
      await refreshHistory();
    } catch (err) {
      alert("Error al solicitar servicio: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offer) => {
    setLoading(true);
    try {
      await supabase.from("operation_offers").update({ status: "accepted" }).eq("id", offer.id);
      const { data, error } = await supabase.from("operations").update({ 
        kamellador_id: offer.kamellador_id, 
        agreed_price: offer.price,
        status: 'accepted'
      }).eq("id", activeRequest.id).select(OPERATION_SELECT).single();
      if (error) throw error;
      setActiveRequest(data);
      await refreshHistory();
      // Mostrar el documento de OPS antes del PIN
      setPendingOPSOperation(data);
      setShowOPSDoc(true);
    } finally { setLoading(false); }
  };

  const handleRejectOffer = async (offer) => {
    try {
      await supabase.from("operation_offers").update({ status: "rejected" }).eq("id", offer.id);
      const broadcastChannel = supabase.channel(`negotiation_${activeRequest.id}`);
      broadcastChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await broadcastChannel.send({ type: 'broadcast', event: 'offer_rejected', payload: { offer_id: offer.id } });
        }
      });
      setOffers(prev => prev.filter(o => o.id !== offer.id));
    } catch (err) { console.error("Error al rechazar oferta:", err); }
  };

  const handleBargainOffer = async (offer) => {
    if (!bargainPrice) return;
    const finalPrice = Number(bargainPrice.replace(/[^0-9]/g, ""));
    try {
      const { error } = await supabase.from("operation_offers").update({ price: finalPrice, last_sender_id: user.id }).eq("id", offer.id);
      if (error) throw error;
      setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, price: finalPrice } : o));
      const broadcastChannel = supabase.channel(`negotiation_${activeRequest.id}`);
      broadcastChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await broadcastChannel.send({ type: 'broadcast', event: 'counter_offer', payload: { offer_id: offer.id, new_price: finalPrice } });
        }
      });
      setBargainingOfferId(null);
      setBargainPrice("");
    } catch (err) { console.error("Error al regatear:", err); }
  };

  const confirmCancel = async () => {
    if (!activeRequest) return;
    try {
      const { error } = await supabase.from("operations").update({ status: "cancelled" }).eq("id", activeRequest.id);
      if (error) throw error;
      setShowCancelModal(false);
      setActiveRequest(null); setCategory(""); setSubcategory(""); setDescription(""); await refreshHistory();
    } catch (err) { alert("Error al cancelar: " + err.message); }
  };
  
  const handleComplete = async () => {
    try { const upd = await completeOperation(activeRequest.id); setActiveRequest(upd); await refreshHistory(); }
    catch (err) { alert(err.message); }
  };

  const handleRate = async (e) => {
    e.preventDefault();
    try { 
      await rateOperation(activeRequest.id, ratingValue, ratingComment, ratingTags); 
      setRatingOpen(false); setRatingComment(""); setRatingTags([]); setActiveRequest(null); await refreshHistory(); 
    } catch (err) { alert(err.message); }
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

  const getSnapPoints = () => {
    if (activeRequest?.status === "pending") return [25, 40];
    if (activeRequest) return [30, 55, 80];
    if (category) return [40, 80];
    return [30, 55, 85];
  };

  if (activeTab === "feed") {
    return (
      <div className="app-shell">
        <div style={{ paddingBottom: 80, overflowY: "auto", height: "100%" }}>
          <FeedView user={user} role="client" onOpenChat={handleFeedRequest} />
        </div>
        <BottomNav role="client" activeTab={activeTab} onTabChange={setActiveTab} unreadMessages={unreadCount} />
      </div>
    );
  }

  if (activeTab === "activity") {
    return (
      <div className="app-shell">
        <div className="view-container">
          <div className="view-container__content">
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", marginBottom: 16 }}>Actividad</h2>
            {history.length === 0 ? <p style={{ color: "#5f6a79", fontSize: "0.875rem" }}>Aún no tienes servicios en historial.</p> : history.map(op => (
              <div key={op.id} className="history-item" onClick={() => setSelectedHistoryOp(op)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{op.description || op.category}</p>
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "#ff7665", flexShrink: 0 }}>{getStatusLabel(op.status)}</span>
                </div>
                <p style={{ fontSize: 11, color: "#5f6a79", marginTop: 4 }}>{formatDate(op.updated_at)}</p>
                {op.operation_ratings?.[0] && <p style={{ fontSize: 12, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}><Star className="w-3 h-3" style={{ fill: "#f59e0b", color: "#f59e0b" }} /> {op.operation_ratings[0].rating}/5</p>}
                {op.ops_accepted_at && <p style={{ fontSize: 11, color: "#16a34a", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><Shield className="w-3 h-3" /> Documento OPS firmado</p>}
              </div>
            ))}
          </div>
        </div>
        <div className="top-bar">
          <div className="top-bar__left"><img src="/images/K-Editado.png" alt="K" className="top-bar__logo" /><span className="top-bar__title">Kamello</span></div>
          <div className="top-bar__right"><button onClick={() => supabase.auth.signOut().then(() => navigate("/"))} className="top-bar__btn"><LogOut className="w-4 h-4" /></button></div>
        </div>
        <BottomNav role="client" activeTab={activeTab} onTabChange={setActiveTab} unreadMessages={unreadCount} />
        
        {/* Modal de detalle de historial */}
        {selectedHistoryOp && selectedHistoryOp.ops_accepted_at && (
          <OPSDocument
            operation={selectedHistoryOp}
            readOnly={true}
            acceptedAt={selectedHistoryOp.ops_accepted_at}
            onClose={() => setSelectedHistoryOp(null)}
          />
        )}
        {selectedHistoryOp && !selectedHistoryOp.ops_accepted_at && (
          <div className="animate-fade-in" style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(31,44,69,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "white", borderRadius: 24, padding: "24px", width: "100%", maxWidth: 360 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900 }}>Detalle del Servicio</h3>
                <button onClick={() => setSelectedHistoryOp(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X className="w-5 h-5 text-[#a4b1c6]" /></button>
              </div>
              <p style={{ fontWeight: 800, margin: "0 0 8px" }}>{selectedHistoryOp.category}</p>
              <p style={{ color: "#5f6a79", margin: "0 0 16px", fontSize: "0.9rem" }}>{selectedHistoryOp.description}</p>
              <p style={{ fontSize: "0.85rem", color: "#a4b1c6" }}>Estado: {getStatusLabel(selectedHistoryOp.status)}</p>
              <p style={{ fontSize: "0.85rem", color: "#a4b1c6" }}>Sin documento OPS firmado (Servicio antiguo o cancelado).</p>
            </div>
          </div>
        )}
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
          <div className="top-bar__right"><button onClick={() => supabase.auth.signOut().then(() => navigate("/"))} className="top-bar__btn"><LogOut className="w-4 h-4" /></button></div>
        </div>
        <BottomNav role="client" activeTab={activeTab} onTabChange={setActiveTab} unreadMessages={unreadCount} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <MapView position={position} setPosition={setPosition} isLocationFixed={isLocationFixed} activeRequest={activeRequest} route={route} />
      
      <div className="top-bar">
        <div className="top-bar__left"><img src="/images/K-Editado.png" alt="K" className="top-bar__logo" /><span className="top-bar__title">Kamello</span></div>
        <div className="top-bar__right">
          <button onClick={() => supabase.auth.signOut().then(() => navigate("/"))} className="top-bar__btn"><LogOut className="w-4 h-4" /></button>
          <button onClick={() => setActiveTab("account")} className="top-bar__avatar">{user?.email?.[0]?.toUpperCase() || "U"}</button>
        </div>
      </div>

      {!activeRequest && (
        <div style={{ position: "absolute", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 700, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, pointerEvents: "none", width: '100%' }}>
          <div style={{ background: "rgba(255,255,255,0.95)", padding: "10px 24px", borderRadius: 100, boxShadow: "0 4px 20px rgba(31,44,69,0.12)", display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
            <MapPin className={`w-5 h-5 ${isLocationFixed ? 'text-[#00cba9]' : 'text-[#ff7665]'}`} />
            <span style={{ fontSize: "0.9rem", fontWeight: 800 }}>{isLocationFixed ? "Ubicación fijada" : "Toca el mapa para fijar dirección"}</span>
            {isLocationFixed && <button onClick={() => setIsLocationFixed(false)} style={{ background: '#f7f3f1', border: 'none', padding: '4px 12px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 800, color: '#ff7665', cursor: 'pointer' }}>Cambiar</button>}
          </div>
          {!isLocationFixed && position && <button onClick={() => setIsLocationFixed(true)} className="animate-bounce" style={{ background: '#1f2c45', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 100, fontSize: '0.9rem', fontWeight: 800, boxShadow: '0 8px 24px rgba(31,44,69,0.25)', pointerEvents: 'auto', cursor: 'pointer' }}>Fijar esta ubicación</button>}
        </div>
      )}

      <BottomSheet snapPoints={getSnapPoints()} initialSnap={1}>
        {!activeRequest ? (
          <RequestServiceForm 
            category={category} setCategory={setCategory} 
            subcategory={subcategory} setSubcategory={setSubcategory}
            description={description} setDescription={setDescription} 
            loading={loading} position={position} 
            handleSubmitRequest={handleSubmitRequest}
          />
        ) : (
          <ActiveOperationView 
            activeRequest={activeRequest} activeCategory={activeCategory} activeKamellador={activeKamellador} offers={offers} 
            user={user} formatPrice={formatPrice} handleAcceptOffer={handleAcceptOffer} handleRejectOffer={handleRejectOffer}
            setBargainingOfferId={setBargainingOfferId} bargainingOfferId={bargainingOfferId} bargainPrice={bargainPrice} setBargainPrice={setBargainPrice} handleBargainOffer={handleBargainOffer}
            setActiveRequest={setActiveRequest} setShowExpiredView={setShowExpiredView} cancelRequest={() => setShowCancelModal(true)}
            canChat={canChat} unreadCount={unreadCount} setChatOpen={setChatOpen} handleComplete={handleComplete} loadingById={loadingById} canRate={canRate} setRatingOpen={setRatingOpen}
          />
        )}
      </BottomSheet>

      <BottomNav role="client" activeTab={activeTab} onTabChange={setActiveTab} unreadMessages={unreadCount} />

      {/* OPS Document — se muestra al aceptar una oferta, antes del PIN */}
      {showOPSDoc && pendingOPSOperation && (
        <OPSDocument
          operation={pendingOPSOperation}
          buttonText="ACEPTAR Y CONTRATAR"
          onAccept={async () => {
            setLoading(true);
            try {
              const now = new Date().toISOString();
              const finalPrice = pendingOPSOperation.agreed_price || pendingOPSOperation.proposed_price || 0;
              
              // 1. Marcar la fecha de OPS y el precio
              const updates = { ops_accepted_at: now, agreed_price: finalPrice };
              await supabase.from("operations").update(updates).eq("id", pendingOPSOperation.id);
              
              // 2. Consolidar la operación: Pasa a 'accepted', genera PIN y descuenta OPS al Kamellador
              const { data: opData, error: opError } = await supabase.rpc("accept_operation", {
                p_operation_id: pendingOPSOperation.id,
                p_kamellador_id: pendingOPSOperation.kamellador_id,
                p_price: finalPrice
              });

              if (opError) {
                if (opError.message.includes('INSUFFICIENT_CREDITS')) {
                  throw new Error("El Kamellador no tiene suficientes OPS para recibir este trabajo.");
                }
                throw opError;
              }

              // 3. Notificar al Kamellador
              supabase.functions.invoke("bright-responder", {
                body: {
                  userId: pendingOPSOperation.kamellador_id,
                  title: "¡Servicio Confirmado! 🎉",
                  body: "El cliente ha aceptado la oferta y la OPS. Tienes un nuevo trabajo asignado.",
                  data: { url: "/" }
                }
              }).catch(console.error);

              // 4. Obtener la operación actualizada con todos los joins (para ubicación y datos del kamellador)
              const { data: fullOp } = await supabase
                .from("operations")
                .select(OPERATION_SELECT)
                .eq("id", pendingOPSOperation.id)
                .single();

              setActiveRequest(fullOp || { ...pendingOPSOperation, ...updates, status: 'accepted', service_code: opData?.service_code });
              setShowOPSDoc(false);
              setPendingOPSOperation(null);
              setChatOpen(false);
              await refreshHistory();
            } catch (err) {
              alert("Error al confirmar el servicio: " + err.message);
            } finally {
              setLoading(false);
            }
          }}
          onClose={() => { setShowOPSDoc(false); setPendingOPSOperation(null); }}
        />
      )}

      {/* Overlays / Modals */}
      {showExpiredView && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(31,44,69,0.85)', backdropFilter: 'blur(10px)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="animate-scale-in" style={{ background: 'white', borderRadius: 40, padding: '40px 32px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, background: '#fee2e2', borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><Clock className="w-10 h-10 text-[#ef4444]" /></div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 900, marginBottom: 12 }}>¿NADA AÚN?</h3>
            <p style={{ color: "#5f6a79", marginBottom: 32 }}>Parece que nadie ha aceptado. <b>Aumenta tu tarifa</b> para atraer expertos de inmediato.</p>
            <button onClick={async () => { setShowExpiredView(false); handleSubmitRequest({ preventDefault: () => {} }); }} className="btn-primary" style={{ height: 60, borderRadius: 20 }}>Reintentar Solicitud</button>
            <button onClick={() => setShowExpiredView(false)} style={{ marginTop: 12, background: 'none', border: 'none', color: '#a4b1c6', fontWeight: 700 }}>Cancelar por ahora</button>
          </div>
        </div>
      )}

      {chatOpen && activeRequest && (
        <div className="chat-screen">
          <div className="chat-screen__header">
            <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: "white" }}><X className="w-5 h-5" /></button>
            <div className="chat-screen__avatar" style={{ border: activeKamellador?.is_premium ? "2px solid #ffd700" : "none" }}>{activeKamellador?.avatar_url ? <img src={activeKamellador.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "K"}</div>
            <div style={{ flex: 1 }}><p style={{ fontWeight: 700, margin: 0, color: activeKamellador?.is_premium ? "#d4af37" : "inherit" }}>{activeKamellador?.full_name}</p><p style={{ fontSize: 10, color: "#00cba9", fontWeight: 800, margin: 0 }}>{activeCategory?.shortName}</p></div>
            
            {activeRequest.status === 'pending' && !activeRequest.ops_accepted_at && activeRequest.kamellador_id && (
              <button 
                onClick={() => {
                  setAgreedPriceInput("");
                  setShowPricePrompt(true);
                }}
                style={{ background: '#ff7665', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 800 }}
              >
                GENERAR OPS
              </button>
            )}
          </div>
          <div className="chat-screen__body">
            {chatLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : messages.map(m => <div key={m.id} className={`chat-bubble ${m.sender_id === user.id ? "chat-bubble--mine" : "chat-bubble--theirs"}`}>{m.body}</div>)}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className="chat-screen__input">
            <input value={chatDraft} onChange={e => setChatDraft(e.target.value)} placeholder="Mensaje..." />
            <button type="submit" disabled={!chatDraft.trim()}><Send className="w-4 h-4" /></button>
          </form>
        </div>
      )}

      {ratingOpen && (
        <div className="rating-modal">
          <form onSubmit={handleRate} className="rating-modal__content">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><h3>Calificar</h3><button type="button" onClick={() => setRatingOpen(false)}><X className="w-5 h-5" /></button></div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>{[1, 2, 3, 4, 5].map(v => <button key={v} type="button" onClick={() => setRatingValue(v)}><Star className="w-8 h-8" style={{ fill: v <= ratingValue ? "#f59e0b" : "none", color: v <= ratingValue ? "#f59e0b" : "#d8cec7" }} /></button>)}</div>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, justifyContent: "center" }}>
              {["Puntualidad", "Calidad", "Rapidez", "Buen Trato", "Limpieza", "Honestidad"].map(tag => {
                const isSelected = ratingTags.includes(tag);
                return (
                  <button 
                    key={tag} 
                    type="button" 
                    onClick={() => setRatingTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
                    style={{ 
                      padding: "6px 14px", borderRadius: 100, fontSize: 11, fontWeight: 800,
                      background: isSelected ? "#1f2c45" : "#f7f3f1",
                      color: isSelected ? "white" : "#5f6a79",
                      border: "none", transition: "all 0.2s"
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} placeholder="¿Algo más que quieras decir? (Opcional)" className="sheet-input" style={{ height: 80, marginBottom: 16 }} />
            <button type="submit" disabled={loadingById[activeRequest?.id]} className="btn-primary">{loadingById[activeRequest?.id] ? "Guardando..." : "Enviar Calificación"}</button>
          </form>
        </div>
      )}

      {showCancelModal && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(31,44,69,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="animate-scale-in" style={{ background: 'white', borderRadius: 40, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <XCircle className="w-12 h-12 mx-auto text-[#ef4444] mb-4" />
            <h3>¿Seguro?</h3>
            <p>{activeRequest?.status === 'accepted' ? "El técnico ya está en camino." : "¿Deseas cancelar?"}</p>
            <button onClick={confirmCancel} className="btn-primary" style={{ background: '#ef4444', marginBottom: 12 }}>Sí, Cancelar</button>
            <button onClick={() => setShowCancelModal(false)} style={{ color: '#a4b1c6', fontWeight: 700 }}>Mantener</button>
          </div>
        </div>
      )}
      {showPricePrompt && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(31,44,69,0.7)', backdropFilter: 'blur(8px)', zIndex: 30000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="animate-scale-in" style={{ background: 'white', borderRadius: 32, padding: '32px 28px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 40px 80px rgba(31,44,69,0.25)' }}>
            <div style={{ width: 64, height: 64, background: '#f0fdf4', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Zap className="w-8 h-8" style={{ color: "#16a34a" }} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 8, color: '#1f2c45' }}>¿Precio Acordado?</h3>
            <p style={{ color: "#5f6a79", fontSize: '0.9rem', marginBottom: 24 }}>Ingresa el monto final que negociaste con el profesional para generar la OPS.</p>
            
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#1f2c45' }}>$</span>
              <input 
                autoFocus
                type="text" 
                value={agreedPriceInput}
                onChange={e => setAgreedPriceInput(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="00.000"
                style={{ width: '100%', padding: '16px 16px 16px 32px', borderRadius: 16, border: '2px solid #efe7e2', fontSize: '1.25rem', fontWeight: 800, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowPricePrompt(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button 
                onClick={() => {
                  const price = Number(agreedPriceInput);
                  if (!price || price < 5000) return alert("Ingresa un precio válido (mínimo $5.000)");
                  setPendingOPSOperation({ ...activeRequest, agreed_price: price });
                  setShowPricePrompt(false);
                  setShowOPSDoc(true);
                }} 
                className="btn-primary" 
                style={{ flex: 1.5 }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
