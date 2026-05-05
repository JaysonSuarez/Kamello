import React from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, X } from "lucide-react";

export default function OPSDocument({ operation, onAccept, onClose, readOnly = false, acceptedAt = null }) {
  const serviceName  = operation?.category || "Servicio";
  const kamelladorName = operation?.kamellador?.full_name || "el profesional";
  const clientName   = operation?.client?.full_name || "tú";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(31,44,69,0.7)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 32, maxWidth: 460, width: "100%",
          maxHeight: "90vh", overflowY: "auto", boxShadow: "0 40px 80px rgba(31,44,69,.25)",
        }}
      >
        {/* Header */}
        <div style={{ background: "#1f2c45", borderRadius: "32px 32px 0 0", padding: "28px 28px 20px", position: "relative" }}>
          {onClose && (
            <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,.1)", border: "none", borderRadius: 12, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}>
              <X className="w-5 h-5" />
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <div style={{ background: "#ff7665", borderRadius: 16, padding: 12 }}>
              <ShieldCheck className="w-7 h-7" color="white" />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,.6)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Kamello</p>
              <h2 style={{ color: "white", fontWeight: 900, fontSize: "1.2rem", margin: 0 }}>Orden de Prestación de Servicios</h2>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 16, padding: "12px 16px" }}>
            <p style={{ color: "rgba(255,255,255,.7)", fontSize: "0.75rem", margin: "0 0 2px" }}>Servicio solicitado</p>
            <p style={{ color: "white", fontWeight: 800, fontSize: "1rem", margin: 0 }}>{serviceName}</p>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: "0.8rem", margin: "4px 0 0" }}>con <strong style={{ color: "white" }}>{kamelladorName}</strong></p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Instrucciones de seguridad */}
          <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 20, padding: "16px 18px" }}>
            <p style={{ fontWeight: 800, color: "#15803d", fontSize: "0.85rem", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 className="w-4 h-4" /> Instrucciones de Seguridad
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                "Entrega el código de 4 dígitos SOLO cuando el profesional llegue físicamente a tu domicilio o lugar de trabajo.",
                "Verifica la identidad del profesional antes de iniciar cualquier trabajo.",
                "Nunca realices pagos anticipados fuera de la plataforma.",
              ].map((txt, i) => (
                <li key={i} style={{ color: "#166534", fontSize: "0.82rem", lineHeight: 1.5 }}>{txt}</li>
              ))}
            </ul>
          </div>

          {/* Deslinde legal */}
          <div style={{ background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 20, padding: "16px 18px" }}>
            <p style={{ fontWeight: 800, color: "#c2410c", fontSize: "0.85rem", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle className="w-4 h-4" /> Aviso Legal Importante
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ color: "#7c2d12", fontSize: "0.82rem", lineHeight: 1.6, margin: 0 }}>
                <strong>Kamello</strong> opera exclusivamente como <strong>plataforma tecnológica de conexión</strong> entre clientes y profesionales independientes. Kamello no es empleador, contratante, ni representante del Kamellador.
              </p>
              <p style={{ color: "#7c2d12", fontSize: "0.82rem", lineHeight: 1.6, margin: 0 }}>
                La <strong>responsabilidad total</strong> por la calidad, seguridad y resultado del servicio recae de manera exclusiva en el profesional contratado. Kamello no se hace responsable por daños materiales, personales, a terceros ni pérdidas económicas que puedan derivarse de la prestación del servicio.
              </p>
              <p style={{ color: "#7c2d12", fontSize: "0.82rem", lineHeight: 1.6, margin: 0 }}>
                Al aceptar, <strong>{clientName}</strong> confirma haber leído y comprendido estos términos y declara actuar bajo su propio criterio al contratar este servicio.
              </p>
            </div>
          </div>

          {/* CTA / Footer */}
          {!readOnly ? (
            <>
              <button
                onClick={onAccept}
                style={{
                  width: "100%", background: "#1f2c45", color: "white",
                  border: "none", borderRadius: 20, padding: "18px",
                  fontWeight: 800, fontSize: "1rem", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  transition: "background .2s",
                }}
                onMouseOver={e => e.currentTarget.style.background = "#ff7665"}
                onMouseOut={e => e.currentTarget.style.background = "#1f2c45"}
              >
                <CheckCircle2 className="w-5 h-5" />
                Entendido y Acepto — Ver mi Código PIN
              </button>

              <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#a4b1c6", margin: 0, lineHeight: 1.4 }}>
                Este documento queda registrado en nuestro sistema con fecha y hora de aceptación.
              </p>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "16px", background: "#f8fafc", borderRadius: 16, border: "1px dashed #cbd5e1" }}>
              <p style={{ fontWeight: 800, color: "#475569", margin: "0 0 4px" }}>Documento Aceptado</p>
              <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
                {acceptedAt ? new Date(acceptedAt).toLocaleString("es-CO") : "Fecha no registrada"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
