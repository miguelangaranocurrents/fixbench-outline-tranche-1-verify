import { test, expect } from "@playwright/test";
import { createCollection, createDocument, gotoUntilVisible, uniqueName } from "../support/api";

test.describe("Collections", () => {
  test("creates a collection from the sidebar", async ({ page }) => {
    const name = uniqueName("Marketing");
    await page.goto("/home");
    await page.getByRole("button", { name: "New collection" }).click();
    const dialog = page.getByRole("dialog", { name: "Create a collection" });
    await dialog.getByRole("textbox").first().fill(name);
    await dialog.getByRole("button", { name: "Create" }).click();

    await expect(page).toHaveURL(/\/collection\//);
    await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  });

  test("shows a collection in the sidebar", async ({ page, request }) => {
    const collection = await createCollection(request, uniqueName("Design"));
    await gotoUntilVisible(page, "/home", page.getByRole("link", { name: collection.name, exact: true }));
  });

  test("opens a document from the collection page", async ({ page, request }) => {
    const collection = await createCollection(request);
    const doc = await createDocument(request, {
      collectionId: collection.id,
      title: uniqueName("Style guide"),
      text: "Use sentence case.",
    });

    const link = page.getByRole("main").getByRole("link", { name: new RegExp(doc.title) });
    await gotoUntilVisible(page, collection.url, link);
    await link.click();
    await expect(page.getByRole("textbox", { name: "Editor content" }).getByText("Use sentence case.")).toBeVisible();
  });
});
