import React from "react";
import {
  AirVent,
  Camera,
  Droplets,
  Hammer,
  Laptop,
  Paintbrush,
  ShieldAlert,
  Smartphone,
  WashingMachine,
  Wrench,
  Zap,
  MonitorPlay
} from "lucide-react";

export const SERVICE_CATEGORIES = [
  {
    id: "Linea blanca",
    name: "Línea Blanca",
    shortName: "Línea Blanca",
    description: "Neveras, lavadoras y aires acondicionados.",
    icon: <WashingMachine className="w-6 h-6" />,
    color: "text-cyan-600",
    bg: "bg-cyan-50 border-cyan-200",
    chip: "bg-cyan-100 text-cyan-700",
    basePrice: 40000,
    subcategories: ["Nevera", "Lavadora", "AC", "Otro"],
    group: "Para el Hogar"
  },
  {
    id: "Hardware y Moviles",
    aliases: ["Hardware", "Moviles", "PC", "Celular"],
    name: "PC y Móvil",
    shortName: "PC & Móvil",
    description: "Computadores y celulares.",
    icon: <Laptop className="w-6 h-6" />,
    color: "text-indigo-600",
    bg: "bg-indigo-50 border-indigo-200",
    chip: "bg-indigo-100 text-indigo-700",
    basePrice: 35000,
    subcategories: ["PC", "Móvil"],
    group: "Tecnología"
  },
  {
    id: "Electricista",
    name: "Electricidad",
    shortName: "Electricidad",
    description: "Instalaciones, fallas eléctricas y tableros.",
    icon: <Zap className="w-6 h-6" />,
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-200",
    chip: "bg-amber-100 text-amber-700",
    basePrice: 35000,
    group: "Para el Hogar"
  },
  {
    id: "Fontanero",
    name: "Plomería",
    shortName: "Plomería",
    description: "Fugas, tuberías y sanitarios.",
    icon: <Droplets className="w-6 h-6" />,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200",
    chip: "bg-blue-100 text-blue-700",
    basePrice: 35000,
    group: "Para el Hogar"
  },
  {
    id: "Albanil",
    aliases: ["Albañil", "Albañilería"],
    name: "Albañilería",
    shortName: "Albañilería",
    description: "Reparaciones locativas y acabados.",
    icon: <Hammer className="w-6 h-6" />,
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-200",
    chip: "bg-orange-100 text-orange-700",
    basePrice: 30000,
    group: "Para el Hogar"
  },
  {
    id: "Pintor",
    name: "Pintura",
    shortName: "Pintura",
    description: "Pintura interior y exterior.",
    icon: <Paintbrush className="w-6 h-6" />,
    color: "text-purple-500",
    bg: "bg-purple-50 border-purple-200",
    chip: "bg-purple-100 text-purple-700",
    basePrice: 30000,
    group: "Para el Hogar"
  },
  {
    id: "Redes y Creacion de Contenido",
    name: "Redes y Creación de Contenido",
    shortName: "Redes",
    description: "Gestión de redes y contenido.",
    icon: <MonitorPlay className="w-6 h-6" />,
    color: "text-pink-600",
    bg: "bg-pink-50 border-pink-200",
    chip: "bg-pink-100 text-pink-700",
    basePrice: 40000,
    group: "Servicios Digitales"
  },
];

export function getServiceCategory(categoryId) {
  return SERVICE_CATEGORIES.find(
    (category) => category.id === categoryId || category.aliases?.includes(categoryId)
  );
}

