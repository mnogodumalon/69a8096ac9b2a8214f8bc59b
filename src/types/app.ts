// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Artikel {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    artikelnummer?: string;
    verkaeufer?: string; // applookup -> URL zu 'Verkaeufer' Record
    artikelname?: string;
    beschreibung?: string;
    kategorie?: LookupValue;
    zustand?: LookupValue;
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

export interface Verkaeufe {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    artikel?: string; // applookup -> URL zu 'Artikel' Record
    verkaufspreis?: number;
    verkaufsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    kaeufer?: string; // applookup -> URL zu 'Kaeufer' Record
    zahlungsmethode?: LookupValue;
    notizen?: string;
  };
}

export const APP_IDS = {
  ARTIKEL: '69a8093d0a4bccc713ac989f',
  KAEUFER: '69a809430561a2e4c5582870',
  VERKAEUFER: '69a8092b20ac86ce582be530',
  VERKAEUFE: '69a80947443cc7b45049f88c',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  artikel: {
    kategorie: [{ key: "moebel", label: "Möbel" }, { key: "kleidung", label: "Kleidung" }, { key: "buecher", label: "Bücher" }, { key: "elektronik", label: "Elektronik" }, { key: "spielzeug", label: "Spielzeug" }, { key: "haushaltswaren", label: "Haushaltswaren" }, { key: "dekoration", label: "Dekoration" }, { key: "schmuck", label: "Schmuck" }, { key: "sport_freizeit", label: "Sport & Freizeit" }, { key: "sonstiges", label: "Sonstiges" }],
    zustand: [{ key: "neu", label: "Neu" }, { key: "wie_neu", label: "Wie neu" }, { key: "sehr_gut", label: "Sehr gut" }, { key: "gut", label: "Gut" }, { key: "akzeptabel", label: "Akzeptabel" }, { key: "defekt", label: "Defekt" }],
  },
  verkaeufe: {
    zahlungsmethode: [{ key: "bargeld", label: "Bargeld" }, { key: "ec_karte", label: "EC-Karte" }, { key: "kreditkarte", label: "Kreditkarte" }, { key: "paypal", label: "PayPal" }, { key: "ueberweisung", label: "Überweisung" }, { key: "sonstiges", label: "Sonstiges" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'artikel': {
    'artikelnummer': 'string/text',
    'verkaeufer': 'applookup/select',
    'artikelname': 'string/text',
    'beschreibung': 'string/textarea',
    'kategorie': 'lookup/select',
    'zustand': 'lookup/select',
    'preis': 'number',
    'verfuegbar': 'bool',
    'foto': 'file',
  },
  'kaeufer': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'telefon': 'string/tel',
    'email': 'string/email',
    'registrierungsdatum': 'date/date',
  },
  'verkaeufer': {
    'verkaeufernummer': 'string/text',
    'vorname': 'string/text',
    'nachname': 'string/text',
    'telefon': 'string/tel',
    'email': 'string/email',
    'registrierungsdatum': 'date/date',
    'notizen': 'string/textarea',
  },
  'verkaeufe': {
    'artikel': 'applookup/select',
    'verkaufspreis': 'number',
    'verkaufsdatum': 'date/datetimeminute',
    'kaeufer': 'applookup/select',
    'zahlungsmethode': 'lookup/select',
    'notizen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateArtikel = StripLookup<Artikel['fields']>;
export type CreateKaeufer = StripLookup<Kaeufer['fields']>;
export type CreateVerkaeufer = StripLookup<Verkaeufer['fields']>;
export type CreateVerkaeufe = StripLookup<Verkaeufe['fields']>;