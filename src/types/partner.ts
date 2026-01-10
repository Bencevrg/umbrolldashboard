export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Partner {
  partner: string;
  osszes_arajanlat: number;
  sikeres_arajanlatok: number;
  sikertelen_arajanlatok: number;
  sikeressegi_arany: number;
  legutobbi_sikeres_datum: string | null;
  legutobbi_arajanlat_datum: string | null;
  napok_a_legutobbi_arajanlat_ota: number;
  alvo: boolean;
  letrehozva: string;
  korrigalt_sikeressegi_arany: number;
  ertek_pontszam: number;
  kategoria: string;
  sikertelen_pontszam: number;
}

export interface TopPartner extends Partner {
  rank?: number;
}

export interface SleepingPartner extends Partner {
  days_threshold?: number;
}

export interface PartnerStats {
  osszesPartner: number;
  aktívPartner: number;
  alvoPartner: number;
  atlagosSikerArany: number;
  osszesArajanlat: number;
  sikeresArajanlat: number;
  kategoriaEloszlas: Record<string, number>;
}

export interface PartnerProductStat {
  partner2: string;
  termekkategoria: string;
  db: number;
}

export interface DashboardData {
  partners: Partner[];
  topBest: TopPartner[];
  topWorst: TopPartner[];
  sleeping: SleepingPartner[];
  partnerProductStats: PartnerProductStat[];
}
