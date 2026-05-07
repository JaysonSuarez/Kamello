import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Navigation, Send, Star, X, Lock, Power, Radio, Play, CreditCard, Zap, Check, Target, Clock 
} from "lucide-react";
import { getRoute, calculateDistance } from "./utils/geo";
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import FeedView from "./components/FeedView";

const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;
const DEFAULT_LOCATION = [4.6097, -74.0817];

function AppModal({ isOpen, title, message, onConfirm, onCancel, type = "confirm", icon: Icon = CheckCircle2, confirmText = "Aceptar", confirmColor = "#ff7665" }) {
  if (!isOpen) return null;
  return (
    <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(31,44,69,0.85)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="animate-scale-in" style={{ background: 'white', borderRadius: 40, padding: '40px 32px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ width: 80, height: 80, background: `${confirmColor}15`, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Icon className="w-10 h-10" style={{ color: confirmColor }} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#1f2c45', marginBottom: 12, fontWeight: 900 }}>{title}</h3>
        <p style={{ color: "#5f6a79", fontSize: "1rem", marginBottom: 32, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onConfirm} className="btn-primary" style={{ background: confirmColor, height: 56, borderRadius: 18 }}>{confirmText}</button>
          {type === "confirm" && (
            <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#a4b1c6', fontWeight: 700, padding: 12 }}>Cancelar</button>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [serviceDistance, setServiceDistance] = useState(5);
  const [nearbyServices, setNearbyServices] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [activeOperation, setActiveOperation] = useState(null);
  const [history, setHistory] = useState([]);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [route, setRoute] = useState([]);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [now, setNow] = useState(Date.now());
  const [securityCode, setSecurityCode] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [cancelledNotice, setCancelledNotice] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const messagesEndRef = useRef(null);
  const pinRefs = [useRef(), useRef(), useRef(), useRef()];
  const [offeringSvc, setOfferingSvc] = useState(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null); // { title, message, type, onConfirm }
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [pastOpportunities, setPastOpportunities] = useState([]);
  const showAlert = (title, message, type = 'info', onConfirm = null) => {
    setModal({ title, message, type, onConfirm });
  };
  const isPremium = true; // Boolean(profile?.is_premium);
  const profileCategory = getServiceCategory(profile?.specialty);

  const refreshHistory = async (pid = user?.id) => { if (pid) setHistory(await fetchHistory(pid, "kamellador")); };
  
  const fetchMyOffers = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("operation_offers").select("*").eq("kamellador_id", user.id);
    if (data) setMyOffers(data);
  }, [user?.id]);
  
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
    (async () => {
      try {
        const { data: { user: au } } = await supabase.auth.getUser();
        if (!au) { navigate("/login"); return; }
        setUser(au);

        const { data: pp, error: pError } = await supabase.from("profiles").select("*").eq("id", au.id).single();
        if (pError || !pp) {
          console.error("Profile fetch error:", pError);
          navigate("/onboarding", { replace: true });
          return;
        }
        
        setProfile(pp);
        setIsOnline(Boolean(pp.is_online));
        
        const active = await fetchActiveOperation(au.id, "kamellador");
        if (active) setActiveOperation({ ...active, client_lat: active.client_lat || DEFAULT_LOCATION[0] + 0.008, client_lng: active.client_lng || DEFAULT_LOCATION[1] + 0.005 });
        
        await refreshHistory(au.id);
        await fetchMyOffers();
        
        setTimeout(() => subscribeToPush(au.id), 2000);

        if (!localStorage.getItem("kamello_walkthrough_seen")) {
          setTimeout(() => setShowWalkthrough(true), 3000);
        }

        // --- Wompi Payment Processor ---
        const urlParams = new URLSearchParams(window.location.search);
        const transactionId = urlParams.get('id');
        const pack = urlParams.get('pack');
        
        if (transactionId && pack) {
          const { data, error } = await supabase.rpc('process_wompi_payment', {
            p_transaction_id: transactionId,
            p_user_id: au.id,
            p_pack: pack
          });
          
          if (!error) {
            showAlert("¡Pago Exitoso! 🎉", `Has recibido ${data.ops_added} OPS correctamente.`, "success");
            const { data: updatedProfile } = await supabase.from("profiles").select("*").eq("id", au.id).single();
            if (updatedProfile) setProfile(updatedProfile);
          } else if (!error.message.includes('TRANSACTION_ALREADY_PROCESSED')) {
            showAlert("Atención", "Hubo un problema verificando tu pago. Contacta a soporte.", "error");
          }
          // Clean URL to prevent re-processing
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        // -------------------------------

      } catch (err) {
        console.error("Error initializing ProviderDashboard:", err);
      } finally {
        setLoading(false);
      }
    })();

    return () => {};
  }, [navigate]);

  // Profile Realtime Sync
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel(`profile_sync_${user.id}`)
      .on("postgres_changes", { 
        event: "UPDATE", 
        schema: "public", 
        table: "profiles", 
        filter: `id=eq.${user.id}` 
      }, payload => {
        setProfile(payload.new);
        if (payload.new.is_online !== undefined) setIsOnline(Boolean(payload.new.is_online));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

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
    
    const [mainSpecialty, subspecialtiesStr] = profile.specialty.split('|');
    const mySubspecialties = subspecialtiesStr ? subspecialtiesStr.split(',') : [];
    
    const sc = getServiceCategory(mainSpecialty);
    const vals = Array.from(new Set([mainSpecialty, sc?.id, ...(sc?.aliases || [])].filter(Boolean)));
    const radius = 15; // profile?.is_premium ? 15 : 10;
    const fetch = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase.from("operations")
        .select(OPERATION_SELECT)
        .eq("status", "pending")
        .gt("expires_at", now)
        .in("category", vals)
        .order("created_at", { ascending: false });
      
      if (data) {
        let filtered = data;
        if (mySubspecialties.length > 0) {
          filtered = filtered.filter(op => mySubspecialties.some(sub => op.description?.startsWith(`[${sub}]`)));
        }
        
        if (myLocation[0]) {
          filtered = filtered.filter(op => {
            if (!op.client_lat || !op.client_lng) return true;
            const dist = calculateDistance(myLocation[0], myLocation[1], op.client_lat, op.client_lng);
            return dist <= radius;
          });
        }
        setNearbyServices(filtered);
      }
    };
    fetch();
    const channel = supabase.channel("public:operations")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "operations", filter: "status=eq.pending" }, p => {
        const rc = getServiceCategory(p.new.category);
        const isMatch = vals.includes(p.new.category) || rc?.id === sc?.id;
        
        let matchesSub = true;
        if (mySubspecialties.length > 0) {
          matchesSub = mySubspecialties.some(sub => p.new.description?.startsWith(`[${sub}]`));
        }
        
        if (isMatch && matchesSub) {
          setNearbyServices(prev => {
            if (prev.some(s => s.id === p.new.id)) return prev;
            return [p.new, ...prev];
          });
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "operations" }, async p => {
        // Always remove from visible lists if no longer pending
        if (p.new.status !== "pending") {
          setNearbyServices(prev => prev.filter(s => s.id !== p.new.id));
          setPastOpportunities(prev => prev.filter(s => s.id !== p.new.id));
        }

        // Assigned to me → activate as my job
        if (p.new.kamellador_id === user.id && p.new.status === 'accepted' && !activeOperation) {
          const upd = await fetchOperation(p.new.id);
          if (upd) {
            setActiveOperation({
              ...upd,
              client_lat: upd.client_lat || DEFAULT_LOCATION[0] + 0.008,
              client_lng: upd.client_lng || DEFAULT_LOCATION[1] + 0.005
            });
            setNearbyServices([]);
            await refreshHistory();
          }
        }

        // My active operation changed status
        if (activeOperation && p.new.id === activeOperation.id) {
          if (['cancelled', 'expired'].includes(p.new.status)) {
            setActiveOperation(null);
            setCancelledNotice(true);
            await refreshHistory();
          } else {
            const upd = await fetchOperation(p.new.id);
            if (upd) setActiveOperation(upd);
          }
        }
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [isOnline, user, profile?.specialty, activeOperation, myLocation]);

  // Fetch past opportunities
  useEffect(() => {
    if (!user || !profile?.specialty) return;
    const fetchPast = async () => {
      const [mainSpecialty, subspecialtiesStr] = profile.specialty.split('|');
      const mySubspecialties = subspecialtiesStr ? subspecialtiesStr.split(',') : [];
      const sc = getServiceCategory(mainSpecialty);
      const vals = Array.from(new Set([mainSpecialty, sc?.id, ...(sc?.aliases || [])].filter(Boolean)));
      const now = new Date().toISOString();
      
      const { data } = await supabase.from("operations")
        .select(OPERATION_SELECT)
        .in("status", ["pending", "expired"])
        .lt("expires_at", now)
        .in("category", vals)
        .order("created_at", { ascending: false })
        .limit(40);
        
      if (data) {
        let filtered = data;
        if (mySubspecialties.length > 0) {
          filtered = filtered.filter(op => mySubspecialties.some(sub => op.description?.startsWith(`[${sub}]`)));
        }
        setPastOpportunities(filtered.slice(0, 20));
      }
    };
    fetchPast();
  }, [user, profile?.specialty]);


  // Fetch and listen to MY offers (Postgres changes)
  useEffect(() => {
    if (!user) return;
    fetchMyOffers();

    const channel = supabase.channel("my_offers_changes")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "operation_offers", 
        filter: `kamellador_id=eq.${user.id}` 
      }, () => {
        fetchMyOffers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchMyOffers]);

  // Dynamic Negotiation Listeners (Broadcast)
  useEffect(() => {
    if (!user || myOffers.length === 0) return;

    const channels = myOffers.map(off => {
      const channel = supabase.channel(`negotiation_${off.operation_id}`)
        .on("broadcast", { event: "counter_offer" }, (p) => {
          // Update local state immediately for snappy UI
          setMyOffers(prev => prev.map(o => o.id === p.payload.offer_id ? { ...o, price: p.payload.new_price } : o));
        })
        .on("broadcast", { event: "offer_rejected" }, (p) => {
          setMyOffers(prev => prev.map(o => o.id === p.payload.offer_id ? { ...o, status: 'rejected' } : o));
          fetchMyOffers();
        })
        .subscribe();
      return channel;
    });

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [myOffers.map(o => o.id + '_' + o.price).join(','), user?.id, fetchMyOffers]);

  // Periodic cleanup and clock for tiered dispatch
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      setNearbyServices(prev => prev.filter(svc => {
        if (!svc.expires_at) return true;
        return new Date(svc.expires_at) > new Date();
      }));
    }, 1000); // Check every second for precision
    return () => clearInterval(timer);
  }, []);

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

  const handleAcceptService = async (service, negotiatedPrice = null) => {
    try {
      // If there was a negotiation, we use that price
      const priceToUse = negotiatedPrice || service.proposed_price;
      
      const { data, error } = await supabase.rpc('accept_operation', { 
        p_operation_id: service.id, 
        p_kamellador_id: user.id,
        p_price: priceToUse
      });
      if (error) {
        if (error.message.includes('INSUFFICIENT_CREDITS')) return alert("No tienes suficientes OPS. Por favor recarga.");
        if (error.message.includes('OPERATION_NOT_PENDING')) return alert("Esta solicitud ya fue tomada o cancelada.");
        return alert("Error al aceptar el servicio.");
      }
      // setProfile(prev => ({ ...prev, ops_credits: (prev?.ops_credits || 10) - 1 })); // REMOVED: Now charged at verification
      const active = await fetchActiveOperation(user.id, "kamellador");
      setActiveOperation({ ...active, client_lat: active.client_lat || DEFAULT_LOCATION[0] + 0.008, client_lng: active.client_lng || DEFAULT_LOCATION[1] + 0.005 });
      setNearbyServices([]); 
      await refreshHistory();
    } catch (err) { alert("Error inesperado al aceptar."); }
  };

  const handleSendOffer = async (e) => {
    e.preventDefault();
    if (!selectedService || !profile?.review_price) return;
    const finalPrice = profile.review_price;
    
    const existingOffer = myOffers.find(o => o.operation_id === selectedService.id);
    
    try {
      let error;
      if (existingOffer) {
        const { error: err } = await supabase.from("operation_offers")
          .update({ 
            price: finalPrice, 
            status: 'pending',
            last_sender_id: user.id
          })
          .eq("id", existingOffer.id);
        error = err;
      } else {
        const { error: err } = await supabase.from("operation_offers")
          .insert({
            operation_id: selectedService.id,
            kamellador_id: user.id,
            price: finalPrice,
            status: 'pending',
            last_sender_id: user.id
          });
        error = err;
      }
      if (error) throw error;
      
      setOfferOpen(false);
      setOfferPrice("");
      setSelectedService(null);

      // Broadcast to client
      const broadcastChannel = supabase.channel(`negotiation_${selectedService.id}`);
      broadcastChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await broadcastChannel.send({
            type: 'broadcast',
            event: 'new_offer',
            payload: { kamellador_id: user.id }
          });
          // Small delay before removing to ensure it's sent
          setTimeout(() => supabase.removeChannel(broadcastChannel), 2000);
        }
      });
    } catch (err) {
      alert("Error al enviar oferta: " + err.message);
    }
  };

  const handleRescueOpportunity = async (opp) => {
    try {
      // Opción A: Reactivar la operación y extender el tiempo
      const newExpiry = new Date(Date.now() + 20 * 60 * 1000).toISOString();
      const { error: opError } = await supabase.from("operations")
        .update({ status: 'pending', expires_at: newExpiry })
        .eq("id", opp.id);
      
      if (opError) throw opError;

      const { error } = await supabase.from("operation_offers")
        .insert({
          operation_id: opp.id,
          kamellador_id: user.id,
          price: opp.proposed_price,
          status: 'pending',
          last_sender_id: user.id,
          message: "Hola! Vi que tenías este servicio pendiente. ¿Aún lo necesitas?"
        });
      if (error) throw error;
      
      showAlert("¡Oportunidad rescatada!", "La solicitud se ha reactivado. El cliente recibirá una notificación y podrá ver tu oferta.");
      setPastOpportunities(prev => prev.filter(o => o.id !== opp.id));
      
      // Attempt to notify client via edge function
      supabase.functions.invoke("bright-responder", {
        body: {
          userId: opp.client_id,
          title: "¡Un experto está disponible! 🚀",
          body: `Un ${opp.category} Premium ha respondido a tu solicitud pasada.`,
          data: { url: "/" }
        }
      }).catch(e => console.error("Push error:", e));

    } catch (err) {
      alert("Error al rescatar oportunidad: " + err.message);
    }
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

  const handleVerifyCode = async () => {
    if (securityCode.length !== 4) return;
    setIsVerifyingCode(true);
    setPinError("");
    try {
      const data = await startOperation(activeOperation.id, securityCode);
      if (data) {
        setActiveOperation(data);
        setSecurityCode("");
        setToast(null);
      }
    } catch (err) {
      setToast(err.message || "Código incorrecto");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleFinishService = async () => {
    try {
      const { data, error } = await supabase.from("operations")
        .update({ status: 'completed' })
        .eq("id", activeOperation.id)
        .select(OPERATION_SELECT)
        .single();
      if (error) throw error;
      setActiveOperation(data);
      await refreshHistory();
    } catch (err) {
      showAlert("Error", "Error al finalizar servicio: " + err.message, "error");
    }
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
  const getSnap = () => {
    if (activeOperation) return { pts: [25, 50, 80], init: 1 };
    if (!isOnline) return { pts: [45, 70], init: 0 };
    if (nearbyServices.length > 0) return { pts: [30, 55, 80], init: 1 };
    return { pts: [25, 45], init: 0 };
  };
  const { pts, init } = getSnap();

  return (
    <div className="app-shell" style={{ background: '#f7f3f1' }}>
      {toast && (
        <div className="toast-container">
          <div className="toast">
            <X className="w-4 h-4" />
            {toast}
          </div>
        </div>
      )}
      {/* Top Bar - Ocultar si hay chat o detalle activo para evitar traslapes */}
      {!activeChat && activeTab === "home" && (
        <header className="top-bar">
          <div className="top-bar__left">
            <img src="/images/K-Editado.png" alt="Kamello" className="top-bar__logo" />
            <h1 className="top-bar__title">Kamello</h1>
          </div>
          <div className="top-bar__right">
            <button onClick={() => setIsOnline(!isOnline)} className="btn-secondary" style={{ height: 40, borderRadius: 20, padding: '0 20px', fontSize: '0.8rem', fontWeight: 800, color: isOnline ? '#ff7665' : '#00cba9' }}>
              {isOnline ? 'Desconectar' : 'Conectarse'}
            </button>
            <div className="top-bar__avatar" style={{ background: '#fff0ee', color: '#ff7665' }}>
              {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>
      )}

      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        {/* HOME: Mapa + BottomSheet */}
        {activeTab === "home" && (
          <>
            <div className="map-fullscreen">
              <MapContainer center={myLocation} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                
                {/* Radio de Alcance */}
                {isOnline && (
                  <Circle 
                    center={myLocation} 
                    radius={serviceDistance * 1000} 
                    pathOptions={{ color: '#ff7665', fillColor: '#ff7665', fillOpacity: 0.1, weight: 1 }} 
                  />
                )}

                {activeOperation ? (
                  <>
                    <Marker position={[Number(activeOperation.client_lat), Number(activeOperation.client_lng)]} />
                    <Marker position={myLocation} icon={L.divIcon({ className: 'my-location-marker', html: `<div class="marker-target">🎯</div>`, iconSize: [30, 30] })} />
                    <Polyline positions={route} color="#ff7665" weight={5} opacity={0.7} />
                  </>
                ) : (
                  <>
                    <Marker position={myLocation} icon={L.divIcon({ className: 'my-location-marker', html: `<div class="marker-target">🎯</div>`, iconSize: [30, 30] })} />
                    {isOnline && nearbyServices
                      .map(svc => (
                        <Marker key={svc.id} position={[Number(svc.client_lat), Number(svc.client_lng)]} />
                      ))}
                  </>
                )}
                <ChangeMapView center={myLocation} />
              </MapContainer>
              
              {/* Botón para Centrar (Target) */}
              <button 
                onClick={() => setMyLocation([...myLocation])} 
                style={{ position: 'absolute', right: 16, bottom: pts[init] === 80 ? '82%' : '48%', zIndex: 10, background: 'white', border: 'none', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'bottom 0.3s' }}
              >
                <Target className="w-6 h-6 text-[#1f2c45]" />
              </button>
            </div>

            <BottomSheet snapPoints={pts} initialSnap={init}>
              {isOnline ? (
                <div className="animate-fade-in">
                  {activeOperation ? (
                    <div className="status-card status-card--accepted" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span className="badge badge--success" style={{ background: activeOperation.status === 'in_progress' ? '#00cba9' : '#ff7665', color: 'white' }}>
                          {activeOperation.status === 'in_progress' ? 'TRABAJO EN PROGRESO' : 'EN CAMINO'}
                        </span>
                        <span style={{ fontWeight: 800, color: '#1f2c45', fontSize: '1.1rem' }}>${formatPrice(activeOperation.agreed_price || activeOperation.proposed_price)}</span>
                      </div>
                      
                      <div style={{ marginBottom: 16 }}>
                        <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800 }}>{activeOperation.category}</h3>
                        <p style={{ margin: 0, color: '#5f6a79', fontSize: '0.85rem', lineHeight: 1.4 }}>{activeOperation.description}</p>
                      </div>



                      {activeOperation.status === 'accepted' && (
                        <div style={{ background: '#f7f3f1', borderRadius: 20, padding: 16, marginBottom: 16, textAlign: 'center' }}>
                          <p style={{ margin: '0 0 10px', fontSize: '0.75rem', fontWeight: 800, color: '#a4b1c6', textTransform: 'uppercase' }}>Ingresa código de llegada</p>
                          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <input 
                              type="text" 
                              maxLength={4} 
                              value={securityCode}
                              onChange={e => setSecurityCode(e.target.value.replace(/[^0-9]/g, ""))}
                              placeholder="0000"
                              style={{ width: 140, textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: 900, border: '2px solid #efe7e2', borderRadius: 16, padding: '12px', outline: 'none' }}
                            />
                            <button 
                              onClick={handleVerifyCode}
                              disabled={securityCode.length !== 4 || isVerifyingCode}
                              className="btn-primary"
                              style={{ width: 'auto', padding: '0 24px', borderRadius: 16 }}
                            >
                              {isVerifyingCode ? '...' : 'OK'}
                            </button>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => { setActiveChat(activeOperation); setActiveTab('messages'); }} className="btn-secondary" style={{ flex: 1 }}>
                          <MessageSquare className="w-4 h-4" /> Chat
                        </button>
                        {activeOperation.status === 'in_progress' ? (
                          <div style={{ flex: 1.5, background: '#f7f3f1', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#5f6a79' }}>
                            <Loader2 className="w-3 h-3 animate-spin mr-2" />
                            Trabajo en curso
                          </div>
                        ) : (
                          <button disabled className="btn-primary" style={{ flex: 1.5, opacity: 0.5, background: '#a4b1c6' }}>
                            Esperando llegada
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="offline-hero" style={{ paddingBottom: 16 }}>
                        <h2 className="offline-hero__title">Buscando...</h2>
                        <p className="offline-hero__sub">Esperando solicitudes de {profile?.specialty || 'técnicos'} en tu zona.</p>
                      </div>

                      {/* Selector de Distancia Integrado */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px 20px', overflowX: 'auto' }}>
                        <span style={{ fontSize: '0.65rem', color: '#a4b1c6', fontWeight: 900, whiteSpace: 'nowrap' }}>RADIO:</span>
                        {[1, 2, 5, 10, 15].map(d => {
                          const isLocked = false; // (d === 10 || d === 15) && !profile?.subscription_plan;
                          const isSelected = serviceDistance === d;
                          return (
                            <button 
                              key={d}
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (isLocked) {
                                  setShowPremiumModal(true);
                                  return;
                                }
                                setServiceDistance(d); 
                              }}
                              style={{ 
                                padding: '6px 12px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 800,
                                background: isSelected ? '#1f2c45' : '#f7f3f1',
                                color: isSelected ? 'white' : (isLocked ? '#d1d5db' : '#5f6a79'),
                                border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s'
                              }}
                            >
                              {d}km
                              {isLocked && <Lock className="w-2.5 h-2.5" />}
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {nearbyServices
                          .map(svc => (
                            <div key={svc.id} className="req-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                              <div>
                                <h4 style={{ margin: 0, fontWeight: 800 }}>{svc.category}</h4>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#5f6a79', lineHeight: 1.4 }}>{svc.description?.substring(0, 80)}{svc.description?.length > 80 ? '...' : ''}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {(() => {
                                const myOffer = myOffers.find(o => o.operation_id === svc.id);
                                if (!myOffer) {
                                  return (
                                    <button 
                                      onClick={() => { setSelectedService(svc); setOfferPrice(""); setOfferOpen(true); }} 
                                      className="btn-primary" 
                                      style={{ flex: 1, padding: "12px", fontSize: "0.85rem", borderRadius: 12 }}
                                    >
                                      Enviar Oferta de Precio
                                    </button>
                                  );
                                }
                                if (myOffer.status === 'pending') {
                                  return (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      <div style={{ textAlign: 'center', background: '#f0fdf4', padding: '12px', borderRadius: 12, fontSize: '0.85rem', fontWeight: 700, color: '#16a34a', border: '1px solid #bbf7d0' }}>
                                        ✓ Oferta enviada: ${formatPrice(myOffer.price)} — Esperando respuesta del cliente
                                      </div>
                                    </div>
                                  );
                                }
                                if (myOffer.status === 'rejected') {
                                  return (
                                    <>
                                      <div style={{ flex: 1, textAlign: 'center', background: '#fee2e2', padding: '10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 700, color: '#ef4444' }}>
                                        Oferta rechazada (${formatPrice(myOffer.price)})
                                      </div>
                                      <button onClick={() => { setSelectedService(svc); setOfferPrice(""); setOfferOpen(true); }} className="btn-secondary" style={{ flex: 1, padding: "10px", fontSize: "0.8rem", borderRadius: 12 }}>Nueva Oferta</button>
                                    </>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        ))}
                        {nearbyServices.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                            <div className="pulse-ring" style={{ position: 'relative', margin: '0 auto 20px', top: 0, left: 0, transform: 'none' }}></div>
                            <p style={{ fontWeight: 700 }}>No hay solicitudes cercanas</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="offline-hero animate-fade-in" style={{ padding: 20 }}>
                  <h2 className="offline-hero__title">Estás Offline</h2>
                  <p className="offline-hero__sub">Conéctate para empezar a recibir solicitudes y ganar dinero hoy.</p>
                  <button onClick={() => setIsOnline(true)} className="cta-connect cta-connect--go">Conectarse Ahora</button>
                </div>
              )}
            </BottomSheet>
          </>
        )}



        {/* FEED */}
        {activeTab === "feed" && (
          <div style={{ height: '100%', overflowY: 'auto', paddingBottom: 80 }}>
            <FeedView user={user} role="kamellador" onOpenChat={null} />
          </div>
        )}

        {/* OPPORTUNITIES: Peticiones Perdidas */}
        {activeTab === "opportunities" && (
          <div className="view-container animate-fade-in" style={{ background: '#f7f3f1', color: '#1f2c45' }}>
            <div className="view-container__content">
              <div style={{ background: '#1f2c45', padding: '32px', color: 'white', borderRadius: '32px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px' }}>Oportunidades</h2>
                <p style={{ opacity: 0.8, fontSize: '0.9rem', margin: 0, lineHeight: 1.4 }}>
                  Rescata clientes que no fueron atendidos a tiempo.
                </p>
              </div>

              {!isPremium ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: 24 }}>
                  <div style={{ width: 64, height: 64, background: '#fff0ee', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#ff7665' }}>
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1f2c45', marginBottom: 8 }}>Función Premium</h3>
                  <p style={{ color: '#5f6a79', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.5 }}>
                    Actualiza a Premium para acceder a la bolsa de trabajo y contactar clientes de solicitudes pasadas.
                  </p>
                  <button onClick={() => setActiveTab('premium')} className="btn-primary" style={{ padding: '14px 24px', borderRadius: 16 }}>Ver Planes Premium</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pastOpportunities.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#a4b1c6' }}>
                      <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p style={{ fontWeight: 700 }}>No hay oportunidades pasadas en tu zona</p>
                    </div>
                  ) : (
                    pastOpportunities.map(opp => (
                      <div key={opp.id} className="req-card" style={{ opacity: 0.9 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <h4 style={{ margin: 0, fontWeight: 800 }}>{opp.category}</h4>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#a4b1c6' }}>
                              Solicitado el {new Date(opp.created_at).toLocaleDateString()} a las {new Date(opp.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                          <span style={{ fontWeight: 900, color: '#ff7665' }}>${formatPrice(opp.proposed_price)}</span>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                          <p style={{ fontSize: '0.85rem', color: '#5f6a79', margin: 0 }}>{opp.description}</p>
                        </div>
                        <button 
                          onClick={() => handleRescueOpportunity(opp)}
                          className="btn-primary" 
                          style={{ width: '100%', padding: "12px", fontSize: "0.9rem", borderRadius: 12 }}
                        >
                          Ofrecer mi disponibilidad
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EARNINGS: Vista de Ingresos */}
        {activeTab === "earnings" && (
          <div className="view-container animate-fade-in">
            <div className="view-container__content">
              <div style={{ background: '#1f2c45', padding: '32px', color: 'white', borderRadius: '32px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px' }}>Tus Ganancias</h2>
                <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7 }}>Hoy</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>${formatPrice(dailyEarnings)}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7 }}>Total</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>${formatPrice(totalEarnings)}</span>
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>Historial Reciente</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {history.filter(op => ["completed", "rated"].includes(op.status)).map(op => (
                  <div key={op.id} className="history-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: 800, margin: 0 }}>{op.category}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#a4b1c6' }}>{formatDate(op.updated_at)}</p>
                      </div>
                      <span style={{ fontWeight: 900, color: '#00cba9' }}>+${formatPrice(op.agreed_price || op.proposed_price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PREMIUM: Planes y OPS */}
        {activeTab === "premium" && (
          <div className="view-container animate-fade-in" style={{ background: '#f7f3f1', color: '#1f2c45' }}>
            <div className="view-container__content">
              
              {/* OPS Credits Summary */}
              <div style={{ background: '#1f2c45', padding: '32px', color: 'white', borderRadius: '32px', marginBottom: '32px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 16px', opacity: 0.8 }}>Tu Balance</h2>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#ff7665', lineHeight: 1 }}>{profile?.ops_credits ?? 10}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 8 }}>OPS Disponibles</div>
              </div>

              {/* Seccion 1: Packs OPS */}
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: 20 }}>Compra de OPS (Prepago)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
                <div style={{ background: 'white', borderRadius: 24, padding: 20, border: '1px solid #efe7e2' }}>
                  <div style={{ background: '#f7f3f1', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Zap className="w-5 h-5 text-[#ff7665]" />
                  </div>
                  <h4 style={{ margin: 0, fontWeight: 800 }}>Pack Básico</h4>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, margin: '4px 0' }}>$15.000</div>
                  <p style={{ fontSize: '0.75rem', color: '#00cba9', fontWeight: 800, margin: '0 0 12px' }}>5 OPS</p>
                  <button 
                    onClick={() => window.location.href = "https://checkout.wompi.co/l/9sDgew"}
                    className="btn-primary" 
                    style={{ padding: '10px', fontSize: '0.8rem' }}
                  >
                    Comprar
                  </button>
                </div>
                <div style={{ background: 'white', borderRadius: 24, padding: 20, border: '2px solid #ff7665' }}>
                  <div style={{ background: '#fff0ee', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Star className="w-5 h-5 text-[#ff7665]" />
                  </div>
                  <h4 style={{ margin: 0, fontWeight: 800 }}>Pack Pro</h4>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, margin: '4px 0' }}>$35.000</div>
                  <p style={{ fontSize: '0.75rem', color: '#00cba9', fontWeight: 800, margin: '0 0 12px' }}>15 OPS</p>
                  <button 
                    onClick={() => window.location.href = "https://checkout.wompi.co/l/TT69P0"}
                    className="btn-primary btn-primary--accent" 
                    style={{ padding: '10px', fontSize: '0.8rem' }}
                  >
                    Comprar
                  </button>
                </div>
              </div>

              {/* Seccion 2: Suscripciones Mensuales */}
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: 20 }}>Planes Mensuales (Ilimitado)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Plan PRO */}
                <div style={{ background: 'white', borderRadius: 28, padding: 24, border: '2px solid #ffd700' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem' }}>Plan PRO</h4>
                      <p style={{ margin: 0, color: '#5f6a79', fontSize: '0.8rem' }}>Acceso Prioritario</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>$49.000</div>
                      <span style={{ fontSize: '0.7rem', color: '#a4b1c6', fontWeight: 700 }}>/ MES</span>
                    </div>
                  </div>
                  <ul style={{ margin: '0 0 24px', padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <li style={{ fontSize: '0.8rem', fontWeight: 600 }}>🚀 100 Oportunidades</li>
                    <li style={{ fontSize: '0.8rem', fontWeight: 600 }}>📍 Radar 15km</li>
                    <li style={{ fontSize: '0.8rem', fontWeight: 600 }}>⚡ Primicia Total</li>
                    <li style={{ fontSize: '0.8rem', fontWeight: 600 }}>✨ Perfil Dorado</li>
                  </ul>
                  <button className="btn-primary" style={{ background: '#ffd700', color: '#1f2c45' }}>Activar Plan PRO</button>
                </div>

                {/* Plan ULTRA */}
                <div style={{ background: '#1f2c45', borderRadius: 28, padding: 24, color: 'white', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, background: '#ff7665', color: 'white', padding: '4px 20px', borderRadius: '0 0 0 20px', fontSize: '0.7rem', fontWeight: 900 }}>EL MÁS POTENTE</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem' }}>Plan ULTRA</h4>
                      <p style={{ margin: 0, opacity: 0.6, fontSize: '0.8rem' }}>Dominio Total</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ff7665' }}>$89.000</div>
                      <span style={{ fontSize: '0.7rem', opacity: 0.4, fontWeight: 700 }}>/ MES</span>
                    </div>
                  </div>
                  <ul style={{ margin: '0 0 24px', padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <li style={{ fontSize: '0.8rem', fontWeight: 600 }}>♾️ Conexiones Infinitas</li>
                    <li style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ff7665' }}>📍 Cobertura Total</li>
                    <li style={{ fontSize: '0.8rem', fontWeight: 600 }}>🔝 Posición VIP</li>
                    <li style={{ fontSize: '0.8rem', fontWeight: 600 }}>🔥 Mapa de Calor</li>
                  </ul>
                  <button className="btn-primary btn-primary--accent">Activar Plan ULTRA</button>
                </div>
              </div>
              <div style={{ height: 100 }} />
            </div>
          </div>
        )}

        {/* MESSAGES: Chat List & Active Chat */}
        {activeTab === "messages" && (
          <div className="view-container animate-fade-in" style={{ padding: 0 }}>
            {activeChat ? (
              <div className="chat-screen" style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'white', display: 'flex', flexDirection: 'column' }}>
                <div className="chat-screen__header" style={{ background: 'white', borderBottom: '1px solid #efe7e2', color: '#1f2c45', padding: '16px 20px', height: 80, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setActiveChat(null)} style={{ background: '#f7f3f1', border: 'none', width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f2c45' }}>
                    <X className="w-6 h-6" />
                  </button>
                  <div className="chat-screen__avatar" style={{ background: '#fff0ee', color: '#ff7665', fontWeight: 800, width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    {activeChat.client?.full_name?.[0] || 'C'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{activeChat.client?.full_name || 'Cliente Kamello'}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#a4b1c6', fontWeight: 700 }}>Servicio: {activeChat.category}</span>
                  </div>
                </div>
                <div className="chat-screen__body" style={{ flex: 1, background: '#f7f3f1', padding: '20px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                  {messages.map(m => (
                    <div key={m.id} className={`chat-bubble ${m.sender_id === user.id ? 'chat-bubble--mine' : 'chat-bubble--theirs'}`} style={{ 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      marginBottom: 4
                    }}>
                      {m.body}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={sendMessage} className="chat-screen__input" style={{ background: 'white', padding: '16px 20px', borderTop: '1px solid #efe7e2', display: 'flex', gap: 12 }}>
                  <input 
                    value={chatDraft} 
                    onChange={e => setChatDraft(e.target.value)} 
                    placeholder="Escribe un mensaje..." 
                    style={{ flex: 1, background: '#f7f3f1', border: 'none', borderRadius: 16, padding: '12px 16px', fontSize: '1rem' }}
                  />
                  <button type="submit" disabled={!chatDraft.trim()} style={{ background: '#ff7665', color: 'white', width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="view-container__content">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 24 }}>Mensajes</h2>
                {activeOperation ? (
                  <div onClick={() => setActiveChat(activeOperation)} className="req-card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f7f3f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageSquare className="w-6 h-6 text-[#ff7665]" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontWeight: 800 }}>Chat con Cliente</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#a4b1c6' }}>Servicio de {activeOperation.category}</p>
                    </div>
                    {unreadCount > 0 && <span className="btm-nav__badge" style={{ position: 'static' }}>{unreadCount}</span>}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
                    <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                    <p>No tienes chats activos</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MENU: Perfil y Ajustes */}
        {activeTab === "menu" && (
          <div className="view-container animate-fade-in">
            <div className="view-container__content">
              <ProfileView user={user} onLogout={() => navigate("/")} />
            </div>
          </div>
        )}
      </main>

      {!activeChat && <BottomNav role="kamellador" activeTab={activeTab} onTabChange={setActiveTab} unreadMessages={unreadCount} />}

      {/* Premium Upsell Modal (Global) */}
      {showPremiumModal && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(31,44,69,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="animate-scale-in" style={{ background: 'white', borderRadius: 40, padding: '40px 32px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 80, height: 80, background: '#fff0ee', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Zap className="w-10 h-10" style={{ color: '#ff7665' }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: '#1f2c45', marginBottom: 16 }}>¿Quieres más radio de trabajo?</h3>
            <p style={{ color: '#5f6a79', fontSize: '1rem', lineHeight: 1.6, marginBottom: 32 }}>
              ¡Adelante! Pásate al plan <b>PRO</b> o <b>ULTRA</b> y obtén todas las ventajas de un verdadero kamellador profesional.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                onClick={() => { setActiveTab('premium'); setShowPremiumModal(false); }} 
                className="btn-primary btn-primary--accent"
                style={{ py: 18, fontSize: '1.1rem' }}
              >
                Ver Planes Premium
              </button>
              <button 
                onClick={() => setShowPremiumModal(false)} 
                style={{ background: 'none', border: 'none', color: '#a4b1c6', fontWeight: 700, padding: 12, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Tal vez más tarde
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancelled Notice Modal */}
      {cancelledNotice && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(31,44,69,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="animate-scale-in" style={{ background: 'white', borderRadius: 40, padding: '40px 32px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 80, height: 80, background: '#fee2e2', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Clock className="w-10 h-10" style={{ color: '#ef4444' }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#1f2c45', marginBottom: 16 }}>Servicio Cancelado</h3>
            <p style={{ color: '#5f6a79', fontSize: '1rem', lineHeight: 1.6, marginBottom: 32 }}>
              Lastimosamente el cliente rechazó por algún motivo, no te preocupes <b>tu OPS está intacta</b>.
            </p>
            <button 
              onClick={() => setCancelledNotice(false)} 
              className="btn-primary"
              style={{ width: '100%', height: 56, borderRadius: 20 }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {offerOpen && (
        <div className="rating-modal">
          <div className="rating-modal__content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", margin: 0 }}>Enviar Propuesta</h3>
              <button type="button" onClick={() => setOfferOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X className="w-5 h-5" /></button>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <p style={{ color: '#5f6a79', fontSize: '0.95rem', margin: '0 0 8px' }}>Se enviará tu precio de revisión configurado:</p>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ff7665', margin: '16px 0' }}>${formatPrice(profile?.review_price)}</div>
              <div style={{ background: '#f7f3f1', borderRadius: 12, padding: '12px 14px', textAlign: 'left' }}>
                <p style={{ fontSize: "0.8rem", color: "#5f6a79", margin: "0 0 4px", fontWeight: 700 }}>Para la solicitud:</p>
                <p style={{ fontSize: "0.9rem", color: "#1f2c45", margin: 0 }}>{selectedService?.description || selectedService?.category}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={handleSendOffer} className="btn-primary" style={{ height: 60, borderRadius: 20, fontSize: '1.1rem' }}>
                Confirmar y Enviar
              </button>
              <button onClick={() => setOfferOpen(false)} className="btn-secondary" style={{ height: 56, borderRadius: 20 }}>
                Cancelar
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: 11, color: "#a4b1c6", marginTop: 12 }}>
              Al enviar una oferta no se descuentan OPS hasta que el cliente la acepte.
            </p>
          </div>
        </div>
      )}
      {/* App Modal */}
      <AppModal 
        isOpen={!!modal}
        title={modal?.title}
        message={modal?.message}
        type={modal?.type}
        onConfirm={() => {
          if (modal?.onConfirm) modal.onConfirm();
          setModal(null);
        }}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
