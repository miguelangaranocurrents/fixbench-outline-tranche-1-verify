import { test, expect } from "@playwright/test";
import { api, createCollection, createDocument, gotoUntilVisible, sharedCollection, uniqueName } from "../support/api";

test.describe("Documents", () => {
  test("shows a document's title and body", async ({ page, request }) => {
    const collection = sharedCollection();
    const doc = await createDocument(request, {
      collectionId: collection.id,
      title: uniqueName("Onboarding"),
      text: "## Day one\n\nMeet the team.",
    });

    await page.goto(doc.url);
    await expect(page.getByRole("heading", { name: "Day one" })).toBeVisible();
    await expect(page.getByText("Meet the team.")).toBeVisible();
  });

  test("keeps text typed into a document after a reload", async ({ page, request }) => {
    const collection = sharedCollection();
    const doc = await createDocument(request, {
      collectionId: collection.id,
      title: uniqueName("Scratchpad"),
      text: "First line.",
    });

    await page.goto(doc.url);
    await page.getByText("First line.").click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Second line.");
    await expect(page.getByText("Second line.")).toBeVisible();

    await expect
      .poll(async () => (await api(request, "documents.info", { id: doc.id })).text)
      .toContain("Second line.");
    await page.reload();
    await expect(page.getByText("Second line.")).toBeVisible();
  });

  test("lists a new document in its collection", async ({ page, request }) => {
    const collection = await createCollection(request);
    const doc = await createDocument(request, {
      collectionId: collection.id,
      title: uniqueName("Runbook"),
    });

    await gotoUntilVisible(
      page,
      collection.url,
      page.getByRole("main").getByRole("link", { name: new RegExp(doc.title) })
    );
  });

  test("stars a document from its menu", async ({ page, request }) => {
    const collection = sharedCollection();
    const doc = await createDocument(request, {
      collectionId: collection.id,
      title: uniqueName("Favourite"),
      text: "Star me.",
    });

    await page.goto(doc.url);
    await expect(page.getByText("Star me.")).toBeVisible();
    await page.getByRole("main").getByRole("button", { name: "Star", exact: true }).click();
    await expect(page.getByRole("main").getByRole("button", { name: "Unstar" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("main").getByRole("button", { name: "Unstar" })).toBeVisible();
  });

  test("deletes a document", async ({ page, request }) => {
    const collection = await createCollection(request);
    const doc = await createDocument(request, {
      collectionId: collection.id,
      title: uniqueName("Obsolete"),
      text: "Remove me.",
    });

    await api(request, "documents.delete", { id: doc.id });
    await gotoUntilVisible(page, collection.url, page.getByRole("heading", { name: collection.name, level: 1 }));
    await expect(page.getByRole("link", { name: new RegExp(doc.title) })).toHaveCount(0);
  });
});
