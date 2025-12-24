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
  kategoria: 'A' | 'B' | 'C' | 'D';
  sikertelen_pontszam: number;
}

export interface PartnerStats {
  osszesPartner: number;
  aktívPartner: number;
  alvoPartner: number;
  atlagosSikerArany: number;
  osszesArajanlat: number;
  sikeresArajanlat: number;
  kategoriaEloszlas: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
}
