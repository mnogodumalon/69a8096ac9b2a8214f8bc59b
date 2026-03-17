import type { Artikel, Verkaeufe } from './app';

export type EnrichedArtikel = Artikel & {
  verkaeuferName: string;
};

export type EnrichedVerkaeufe = Verkaeufe & {
  artikelName: string;
  kaeuferName: string;
};
