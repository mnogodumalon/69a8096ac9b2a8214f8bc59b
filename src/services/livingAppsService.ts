// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS } from '@/types/app';
import type { Verkaeufer, Artikel, Kaeufer, Verkaeufe } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://ci04.ci.xist4c.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extrahiere die letzten 24 Hex-Zeichen mit Regex
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://ci04.ci.xist4c.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

export class LivingAppsService {
  // --- VERKAEUFER ---
  static async getVerkaeufer(): Promise<Verkaeufer[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.VERKAEUFER}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getVerkaeuferEntry(id: string): Promise<Verkaeufer | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.VERKAEUFER}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createVerkaeuferEntry(fields: Verkaeufer['fields']) {
    return callApi('POST', `/apps/${APP_IDS.VERKAEUFER}/records`, { fields });
  }
  static async updateVerkaeuferEntry(id: string, fields: Partial<Verkaeufer['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.VERKAEUFER}/records/${id}`, { fields });
  }
  static async deleteVerkaeuferEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.VERKAEUFER}/records/${id}`);
  }

  // --- ARTIKEL ---
  static async getArtikel(): Promise<Artikel[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.ARTIKEL}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getArtikelEntry(id: string): Promise<Artikel | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.ARTIKEL}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createArtikelEntry(fields: Artikel['fields']) {
    return callApi('POST', `/apps/${APP_IDS.ARTIKEL}/records`, { fields });
  }
  static async updateArtikelEntry(id: string, fields: Partial<Artikel['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.ARTIKEL}/records/${id}`, { fields });
  }
  static async deleteArtikelEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.ARTIKEL}/records/${id}`);
  }

  // --- KAEUFER ---
  static async getKaeufer(): Promise<Kaeufer[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.KAEUFER}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getKaeuferEntry(id: string): Promise<Kaeufer | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.KAEUFER}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createKaeuferEntry(fields: Kaeufer['fields']) {
    return callApi('POST', `/apps/${APP_IDS.KAEUFER}/records`, { fields });
  }
  static async updateKaeuferEntry(id: string, fields: Partial<Kaeufer['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.KAEUFER}/records/${id}`, { fields });
  }
  static async deleteKaeuferEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.KAEUFER}/records/${id}`);
  }

  // --- VERKAEUFE ---
  static async getVerkaeufe(): Promise<Verkaeufe[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.VERKAEUFE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getVerkaeufeEntry(id: string): Promise<Verkaeufe | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.VERKAEUFE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createVerkaeufeEntry(fields: Verkaeufe['fields']) {
    return callApi('POST', `/apps/${APP_IDS.VERKAEUFE}/records`, { fields });
  }
  static async updateVerkaeufeEntry(id: string, fields: Partial<Verkaeufe['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.VERKAEUFE}/records/${id}`, { fields });
  }
  static async deleteVerkaeufeEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.VERKAEUFE}/records/${id}`);
  }

}