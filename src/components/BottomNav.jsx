import React from "react";
import { Home, BarChart3, MessageSquare, Menu, ClipboardList, User, History, Newspaper } from "lucide-react";
import { useLanguage } from "../lib/i18n";

export default function BottomNav({ role, activeTab, onTabChange, unreadMessages = 0 }) {
  const { t } = useLanguage();

  const CLIENT_TABS = [
    { id: "home", label: t('nav_home'), icon: Home },
    { id: "feed", label: t('nav_feed'), icon: Newspaper },
    { id: "activity", label: t('nav_activity'), icon: ClipboardList },
    { id: "account", label: t('nav_account'), icon: User },
  ];

  const PROVIDER_TABS = [
    { id: "home", label: t('nav_home'), icon: Home },
    { id: "feed", label: t('nav_feed'), icon: Newspaper },
    { id: "opportunities", label: t('nav_opportunities'), icon: History },
    { id: "earnings", label: t('nav_earnings'), icon: BarChart3 },
    { id: "messages", label: t('nav_messages'), icon: MessageSquare },
    { id: "menu", label: t('nav_menu'), icon: Menu },
  ];

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
