import React from "react";
import { Search, CreditCard, Shield } from "lucide-react";
import { SERVICE_CATEGORIES, getServiceCategory } from "../../serviceCategories";

export default function RequestServiceForm({ 
  category, setCategory, description, setDescription, 
  budget, setBudget, minBudget, loading, position, 
  handleSubmitRequest, formatPrice 
}) {
  if (!category) {
    return (
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
    );
  }

  return (
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
            <input type="text" value={budget} onChange={e => setBudget(e.target.value.replace(/[^0-9]/g, ""))} placeholder={minBudget.toString()} className="sheet-input" style={{ paddingLeft: 40, fontWeight: 700 }} required />
          </div>
          <p style={{ fontSize: 11, color: "#a4b1c6", marginTop: 4, lineHeight: 1.3 }}>
            Mínimo calculado: <b>${formatPrice(minBudget)}</b> (tarifa base + recargos). Ofrece más si tienes urgencia.
          </p>
        </div>
        <button type="submit" disabled={loading || !position} className="btn-primary" style={{ marginTop: 4 }}>
          <Search className="w-5 h-5" /> Buscar Kamellador
        </button>
        <p style={{ textAlign: "center", fontSize: 11, color: "#a4b1c6", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <Shield className="w-3.5 h-3.5" /> Expira automáticamente si nadie acepta.
        </p>
      </form>
    </div>
  );
}
