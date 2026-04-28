import React from "react";
import { Home, Search, BarChart3, MessageSquare, Menu, ClipboardList, User, Zap } from "lucide-react";

const CLIENT_TABS = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "services", label: "Servicios", icon: Search },
  { id: "activity", label: "Actividad", icon: ClipboardList },
  { id: "account", label: "Cuenta", icon: User },
];

const PROVIDER_TABS = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "earnings", label: "Ganancias", icon: BarChart3 },
  { id: "premium", label: "Premium", icon: Zap },
  { id: "messages", label: "Mensajes", icon: MessageSquare },
  { id: "menu", label: "Menú", icon: Menu },
];

export default function BottomNav({ role, activeTab, onTabChange, unreadMessages = 0 }) {
  const tabs = role === "client" || role === "cliente" ? CLIENT_TABS : PROVIDER_TABS;

  return (
    <nav className="btm-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`btm-nav__tab ${isActive ? "btm-nav__tab--active" : ""}`}
            aria-label={tab.label}
          >
            <span className="btm-nav__icon-wrap">
              <Icon className="btm-nav__icon" strokeWidth={isActive ? 2.5 : 1.8} />
              {tab.id === "messages" && unreadMessages > 0 && (
                <span className="btm-nav__badge">{unreadMessages > 9 ? "9+" : unreadMessages}</span>
              )}
            </span>
            <span className="btm-nav__label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
