import React from "react";
import { Search, Star, CheckCircle2, MessageSquare, XCircle, X, Send, Loader2 } from "lucide-react";
import CountdownTimer from "./CountdownTimer";

// Helper component for the view
export default function ActiveOperationView({ 
  activeRequest, activeCategory, activeKamellador, offers, 
  user, formatPrice, handleAcceptOffer, handleRejectOffer,
  setBargainingOfferId, bargainingOfferId, bargainPrice, setBargainPrice, handleBargainOffer,
  setActiveRequest, setShowExpiredView, cancelRequest,
  canChat, unreadCount, setChatOpen, handleComplete, loadingById, canRate, setRatingOpen
}) {
  return (
    <>
      {/* ── STATE: Pending (Searching / Negotiating) ── */}
      {activeRequest.status === "pending" && (
        <div className="animate-fade-in-up" style={{ textAlign: "center", padding: '20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ position: "relative", width: 80, height: 80 }}>
              <div className="pulse-ring" style={{ position: 'absolute', inset: 0 }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Search className="w-8 h-8" style={{ color: "#ff7665" }} />
              </div>
            </div>
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 4 }}>Buscando experto...</h3>
          <p style={{ color: "#5f6a79", fontSize: "0.8rem", marginBottom: 20 }}>
            Notificando profesionales de <b>{activeCategory?.shortName || activeRequest.category}</b>
          </p>

          {offers.length > 0 && (
            <div style={{ textAlign: "left", marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#a4b1c6", textTransform: "uppercase", marginBottom: 12 }}>{offers.length} Profesionales interesados:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {offers.map(offer => (
                  <div key={offer.id} style={{ background: "white", borderRadius: 16, padding: 12, border: "1px solid #efe7e2", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1f2c45", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, border: offer.kamellador?.is_premium ? "1px solid #ffd700" : "none" }}>
                        {offer.kamellador?.full_name?.[0] || "K"}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: offer.kamellador?.is_premium ? "#d4af37" : "inherit" }}>{offer.kamellador?.full_name}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Star className="w-3 h-3" style={{ fill: "#f59e0b", color: "#f59e0b" }} />
                            <span style={{ fontSize: 11, fontWeight: 800 }}>{offer.kamellador?.rating_avg || '0.0'}</span>
                          </div>
                          <span style={{ fontSize: 10, color: "#a4b1c6" }}>•</span>
                          <span style={{ fontSize: 11, color: "#5f6a79", fontWeight: 600 }}>{offer.kamellador?.services_count || 0} servicios</span>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 800, margin: "4px 0 0", color: "#ff7665" }}>
                          {offer.last_sender_id === user.id ? `Tu propuesta: $${formatPrice(offer.price)}` : `$${formatPrice(offer.price)}`}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {offer.last_sender_id !== user.id ? (
                          <>
                            <button onClick={() => handleAcceptOffer(offer)} className="btn-primary" style={{ padding: "6px 12px", fontSize: 12, borderRadius: 100, width: "auto" }}>Aceptar</button>
                            <button onClick={() => { setBargainingOfferId(offer.id); setBargainPrice(offer.price.toString()); }} className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12, borderRadius: 100, width: "auto" }}>Regatear</button>
                          </>
                        ) : (
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#a4b1c6', padding: '6px 12px' }}>Esperando respuesta...</div>
                        )}
                        <button onClick={() => handleRejectOffer(offer)} className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12, borderRadius: 100, width: "auto", background: '#fee2e2', color: '#ef4444', border: 'none' }}>Rechazar</button>
                      </div>
                      
                      {bargainingOfferId === offer.id && (
                        <div className="animate-fade-in" style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                          <input 
                            type="text" 
                            value={bargainPrice} 
                            onChange={e => setBargainPrice(e.target.value.replace(/[^0-9]/g, ""))} 
                            placeholder="¿Cuánto ofreces?"
                            style={{ flex: 1, padding: '8px 12px', borderRadius: 12, border: '1px solid #efe7e2', fontSize: 13 }}
                          />
                          <button onClick={() => handleBargainOffer(offer)} className="btn-primary" style={{ width: 'auto', padding: '0 16px', height: 38 }}>Enviar</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeRequest.expires_at && <CountdownTimer expiresAt={activeRequest.expires_at} onExpire={() => {
            setActiveRequest(null);
            setShowExpiredView(true);
          }} />}
          <div style={{ textAlign: 'center' }}>
            <button onClick={cancelRequest} style={{ background: "none", border: "none", color: "#a4b1c6", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", textDecoration: 'underline' }}>
              Cancelar solicitud
            </button>
          </div>
        </div>
      )}

      {/* ── STATE: Accepted / In Progress / Completed ── */}
      {["accepted", "in_progress", "completed"].includes(activeRequest.status) && (
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
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <Star className="w-3.5 h-3.5" style={{ fill: "#f59e0b", color: "#f59e0b" }} />
                  <span style={{ fontSize: 13, fontWeight: 800 }}>{activeKamellador?.rating_avg || '0.0'}</span>
                </div>
                <span style={{ fontSize: 10, color: "#a4b1c6" }}>•</span>
                <span style={{ fontSize: 13, color: "#5f6a79", fontWeight: 600 }}>{activeKamellador?.services_count || 0} servicios realizados</span>
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
              <button onClick={() => setChatOpen(true)} className="btn-secondary" style={{ flex: 1.5, position: "relative" }}>
                <MessageSquare className="w-5 h-5" /> Chat
                {unreadCount > 0 && (
                  <span style={{ position: "absolute", top: -5, right: -5, background: "#ff4757", color: "white", fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
            {activeRequest.status === "accepted" && (
              <button onClick={cancelRequest} className="btn-secondary" style={{ flex: 1, borderColor: '#ff4757', color: '#ff4757' }}>
                <XCircle className="w-5 h-5" /> Cancelar
              </button>
            )}
            {activeRequest.status === "in_progress" && (
              <button onClick={handleComplete} disabled={loadingById[activeRequest.id]} className="btn-primary" style={{ flex: 1 }}>Finalizar</button>
            )}
            {canRate && <button onClick={() => setRatingOpen(true)} className="btn-primary" style={{ flex: 1 }}>Calificar</button>}
          </div>
        </div>
      )}
    </>
  );
}
