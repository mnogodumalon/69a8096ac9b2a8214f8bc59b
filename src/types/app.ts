// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface Verkaeufer {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    verkaeufernummer?: string;
    vorname?: string;
    nachname?: string;
    telefon?: string;
    email?: string;
    registrierungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    notizen?: string;
  };
}

export interface Artikel {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    artikelnummer?: string;
    verkaeufer?: string; // applookup -> URL zu 'Verkaeufer' Record
    artikelname?: string;
    beschreibung?: string;
    kategorie?: 'moebel' | 'kleidung' | 'buecher' | 'elektronik' | 'spielzeug' | 'haushaltswaren' | 'dekoration' | 'schmuck' | 'sport_freizeit' | 'sonstiges';
    zustand?: 'neu' | 'wie_neu' | 'sehr_gut' | 'gut' | 'akzeptabel' | 'defekt';
    preis?: number;
    verfuegbar?: boolean;
    foto?: string;
  };
}

export interface Kaeufer {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    telefon?: string;
    email?: string;
    registrierungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface Verkaeufe {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    artikel?: string; // applookup -> URL zu 'Artikel' Record
    verkaufspreis?: number;
    verkaufsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    kaeufer?: string; // applookup -> URL zu 'Kaeufer' Record
    zahlungsmethode?: 'bargeld' | 'ec_karte' | 'kreditkarte' | 'paypal' | 'ueberweisung' | 'sonstiges';
    notizen?: string;
  };
}

export const APP_IDS = {
  VERKAEUFER: '69a8092b20ac86ce582be530',
  ARTIKEL: '69a8093d0a4bccc713ac989f',
  KAEUFER: '69a809430561a2e4c5582870',
  VERKAEUFE: '69a80947443cc7b45049f88c',
} as const;

// Helper Types for creating new records
export type CreateVerkaeufer = Verkaeufer['fields'];
export type CreateArtikel = Artikel['fields'];
export type CreateKaeufer = Kaeufer['fields'];
export type CreateVerkaeufe = Verkaeufe['fields'];