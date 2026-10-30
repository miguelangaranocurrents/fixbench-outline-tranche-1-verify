import fs from "node:fs";
import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";

const API_KEY_FILE = ".auth/api-key.txt";

/** Calls an Outline API method as the admin and returns its `data`. */
export async function api<T = any>(
  request: APIRequestContext,
  method: string,
  body: Record<string, unknown> = {}
): Promise<T> {
  const token = fs.readFileSync(API_KEY_FILE, "utf8").trim();
  const res = await request.post(`/api/${method}`, {
    data: body,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`${method} failed: ${res.status()} ${await res.text()}`);
  }
  return (await res.json()).data as T;
}

export function uniqueName(prefix: string) {
  return `${prefix} ${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

/** The collection created by the global setup, shared by most tests. */
export function sharedCollection(): { id: string; name: string; url: string } {
  return JSON.parse(fs.readFileSync(".auth/collection.json", "utf8"));
}

export async function createCollection(request: APIRequestContext, name = uniqueName("Collection")) {
  return api(request, "collections.create", { name, permission: "read_write" });
}

export async function createDocument(
  request: APIRequestContext,
  opts: { collectionId: string; title?: string; text?: string; publish?: boolean }
) {
  return api(request, "documents.create", {
    collectionId: opts.collectionId,
    title: opts.title ?? uniqueName("Doc"),
    text: opts.text ?? "",
    publish: opts.publish ?? true,
  });
}

/**
 * Opens a page until the locator shows up. Access to a new collection is cached
 * for a few seconds, so its content can be missing from the first load.
 */
export async function gotoUntilVisible(page: Page, url: string, locator: Locator) {
  await expect(async () => {
    await page.goto(url);
    await expect(locator).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 30_000 });
}
