import { test, expect, type Page } from "@playwright/test";
import { createDocument, sharedCollection, uniqueName } from "../support/api";

function longDocument(term: string) {
  const filler = Array.from(
    { length: 40 },
    (_, i) => `Paragraph ${i + 1} of the background section.`
  ).join("\n\n");
  return `## Overview\n\nThe ${term} rollout starts next week.\n\n${filler}\n\n## Appendix\n\nReference material lives here.`;
}

// Documents are indexed for search shortly after they are saved.
async function searchUntilFound(page: Page, term: string, title: string) {
  const result = page.getByRole("link", { name: new RegExp(title) });
  await expect(async () => {
    await page.goto(`/search?query=${term}`);
    await expect(result).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 30_000 });
  return result;
}

test.describe("Search", () => {
  test("finds a document by a word in its body", async ({ page, request }) => {
    const term = `kiwi${Date.now().toString(36)}`;
    const collection = sharedCollection();
    const title = uniqueName("Fruit notes");
    await createDocument(request, {
      collectionId: collection.id,
      title,
      text: `We should plant a ${term} tree.`,
    });

    await searchUntilFound(page, term, title);
  });

  test("shows no results for an unknown word", async ({ page }) => {
    await page.goto(`/search?query=zzqx${Date.now().toString(36)}`);
    await expect(page.getByText(/no documents found/i).first()).toBeVisible();
  });

  test("highlights the search term in a document opened from the results", async ({ page, request }) => {
    const term = `mango${Date.now().toString(36)}`;
    const collection = sharedCollection();
    const title = uniqueName("Harvest plan");
    await createDocument(request, {
      collectionId: collection.id,
      title,
      text: `The ${term} harvest is in June.`,
    });

    const result = await searchUntilFound(page, term, title);
    await result.click();
    await expect(page).toHaveURL(new RegExp(`q=${term}`));
    await expect(page.getByRole("button", { name: "Clear search highlight" })).toBeVisible();
  });

  test("table of contents jumps to a heading in a document opened from search", async ({ page, request }) => {
    const term = `papaya${Date.now().toString(36)}`;
    const collection = sharedCollection();
    const title = uniqueName("Rollout guide");
    await createDocument(request, {
      collectionId: collection.id,
      title,
      text: longDocument(term),
    });

    const result = await searchUntilFound(page, term, title);
    await result.click();
    await expect(page.getByText(`The ${term} rollout starts next week.`).first()).toBeVisible();

    await page.getByRole("button", { name: "Show contents" }).click();
    await page.getByRole("link", { name: "Appendix" }).click();

    await expect(page.getByRole("heading", { name: "Appendix" })).toBeInViewport();
    await page.waitForTimeout(1000);
    await expect(page.getByRole("heading", { name: "Appendix" })).toBeInViewport();
  });
});
