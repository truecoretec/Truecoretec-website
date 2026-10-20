import { createContext, useContext } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";

const SiteContext = createContext({ settings: null });

const fetcher = (url) => api.get(url).then((r) => r.data);

export function SiteProvider({ children }) {
  const { data } = useSWR("/settings", fetcher, { revalidateOnFocus: false });
  return <SiteContext.Provider value={{ settings: data || null }}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);

export function whatsappLink(settings, extra) {
  const number = (settings?.whatsapp_number || "").replace(/[^0-9]/g, "");
  if (!number) return null;
  const message = [settings?.whatsapp_message || "", extra || ""].filter(Boolean).join(" ");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
