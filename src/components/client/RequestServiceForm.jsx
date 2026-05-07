import React from "react";
import { Search, Shield } from "lucide-react";
import { SERVICE_CATEGORIES, getServiceCategory } from "../../serviceCategories";

export default function RequestServiceForm({ 
  category, setCategory, 
  subcategory, setSubcategory,
  description, setDescription, 
  loading, position, 
  handleSubmitRequest
}) {
  if (!category) {
    return (
      <div className="animate-fade-in-up">
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: 4 }}>¿Qué necesitas hoy?</h2>
        <p style={{ color: "#5f6a79", fontSize: "0.8rem", marginBottom: 16 }}>Encuentra un experto en minutos.</p>
        {(() => {
          const grouped = SERVICE_CATEGORIES.reduce((acc, cat) => {
            const group = cat.group || "Otros";
            if (!acc[group]) acc[group] = [];
            acc[group].push(cat);
            return acc;
          }, {});

          return Object.entries(grouped).map(([groupName, cats]) => (
            <div key={groupName} style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1f2c45", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                {groupName}
                <div style={{ flex: 1, height: "1px", background: "#efe7e2" }} />
              </h3>
              <div className="cat-grid">
                {cats.map(cat => (
                  <button key={cat.id} className="cat-item" onClick={() => { setCategory(cat.id); }}>
                    <div className="cat-item__circle"><span className={cat.color}>{cat.icon}</span></div>
                    <span className="cat-item__label">{cat.shortName}</span>
                  </button>
                ))}
              </div>
            </div>
          ));
        })()}
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <button onClick={() => { setCategory(""); setSubcategory(""); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#5f6a79", fontSize: "0.8rem", fontWeight: 600, marginBottom: 12, padding: 0 }}>
        ← Cambiar categoría
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        {(() => { const c = getServiceCategory(category); return c ? <span className={c.color}>{c.icon}</span> : null; })()}
        <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>{getServiceCategory(category)?.shortName || category}</h3>
      </div>

      <form onSubmit={handleSubmitRequest} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {(() => {
          const cat = getServiceCategory(category);
          if (!cat?.subcategories) return null;
          return (
            <div>
              <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", marginBottom: 10 }}>¿Qué tipo de reparación es?</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                {cat.subcategories.map(sub => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubcategory(sub)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 12,
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      border: "2px solid",
                      borderColor: subcategory === sub ? "#1f2c45" : "#efe7e2",
                      background: subcategory === sub ? "#1f2c45" : "white",
                      color: subcategory === sub ? "white" : "#1f2c45",
                      transition: "all 0.2s"
                    }}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        <div>
          <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", marginBottom: 6 }}>Describe lo que necesitas</label>
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Ej: Tengo una fuga en el baño cerca al lavamanos..." 
            className="sheet-input" 
            style={{ height: 90, resize: "none" }} 
            required 
          />
          <p style={{ fontSize: 11, color: "#a4b1c6", marginTop: 4, lineHeight: 1.4 }}>
            Los Kamelladores recibirán tu solicitud y te enviarán sus precios. Tú eliges.
          </p>
        </div>
        <button type="submit" disabled={loading || !position} className="btn-primary" style={{ marginTop: 4 }}>
          <Search className="w-5 h-5" /> Buscar Kamellador
        </button>
        <p style={{ textAlign: "center", fontSize: 11, color: "#a4b1c6", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <Shield className="w-3.5 h-3.5" /> Expira automáticamente si nadie ofrece.
        </p>
      </form>
    </div>
  );
}
