import fs from "node:fs";
import { request, type FullConfig } from "@playwright/test";

export const STORAGE_STATE = ".auth/admin.json";
export const API_KEY_FILE = ".auth/api-key.txt";
export const COLLECTION_FILE = ".auth/collection.json";

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL as string;
  fs.mkdirSync(".auth", { recursive: true });

  const context = await request.newContext({ baseURL });
  const res = await context.post("/api/installation.create", {
    data: {
      teamName: "Acme",
      userName: "Ada Admin",
      userEmail: "admin@example.com",
    },
    maxRedirects: 0,
  });
  if (res.status() >= 400) {
    throw new Error(`installation.create failed: ${res.status()} ${await res.text()}`);
  }

  // Mutating API calls made with the session cookie need the CSRF cookie.
  await context.get("/home");
  const state = await context.storageState();
  const csrf = state.cookies.find((c) => c.name === "csrfToken")?.value ?? "";

  const key = await context.post("/api/apiKeys.create", {
    data: { name: "e2e" },
    headers: { "x-csrf-token": csrf },
  });
  if (!key.ok()) {
    throw new Error(`apiKeys.create failed: ${key.status()} ${await key.text()}`);
  }
  const { data } = await key.json();
  fs.writeFileSync(API_KEY_FILE, data.value);

  // Most tests add their documents to one shared collection.
  const collection = await context.post("/api/collections.create", {
    data: { name: "Team space", permission: "read_write" },
    headers: { Authorization: `Bearer ${data.value}` },
  });
  if (!collection.ok()) {
    throw new Error(`collections.create failed: ${collection.status()} ${await collection.text()}`);
  }
  fs.writeFileSync(COLLECTION_FILE, JSON.stringify((await collection.json()).data));

  await context.storageState({ path: STORAGE_STATE });
  await context.dispose();
}

export default globalSetup;
