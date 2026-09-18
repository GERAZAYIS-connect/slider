import type { Presentation } from "../types";
import { buildPptxBlob } from "./pptxExport";

// ---------------------------------------------------------------------------
// Export Google Slides natif : OAuth via Google Identity Services (côté
// client), puis import/convertion du PPTX vers une présentation Google Slides
// directement dans le Drive de l'utilisateur.
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    google?: any;
  }
}

const SCOPES = "https://www.googleapis.com/auth/drive.file";

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Impossible de charger Google Identity Services."));
    document.head.appendChild(s);
  });
}

function requestToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp: any) => {
        if (resp.error) reject(new Error(resp.error_description || resp.error));
        else resolve(resp.access_token as string);
      },
    });
    client.requestAccessToken();
  });
}

function sanitizeName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, "").trim() || "presentation";
}

function buildMultipart(metadata: object, blob: Blob, boundary: string): Blob {
  const enc = new TextEncoder();
  const parts: BlobPart[] = [];
  parts.push(enc.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`));
  parts.push(enc.encode(JSON.stringify(metadata)));
  parts.push(enc.encode(`\r\n--${boundary}\r\nContent-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation\r\n\r\n`));
  parts.push(blob);
  parts.push(enc.encode(`\r\n--${boundary}--\r\n`));
  return new Blob(parts);
}

export interface GoogleSlidesResult {
  url: string;
  fileId: string;
}

export async function exportGoogleSlides(presentation: Presentation): Promise<GoogleSlidesResult> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) {
    throw new Error("VITE_GOOGLE_CLIENT_ID n'est pas configuré (voir .env).");
  }

  await loadGis();
  const token = await requestToken(clientId);
  const blob = await buildPptxBlob(presentation);
  const boundary = `slider_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const metadata = {
    name: sanitizeName(presentation.title),
    mimeType: "application/vnd.google-apps.presentation",
  };
  const body = buildMultipart(metadata, blob, boundary);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Échec de l'import Google Drive (${res.status}) : ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { id: string };
  return {
    fileId: data.id,
    url: `https://docs.google.com/presentation/d/${data.id}/edit`,
  };
}
