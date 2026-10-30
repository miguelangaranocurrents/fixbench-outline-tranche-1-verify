import { test, expect } from "@playwright/test";
import { api, createDocument, sharedCollection, uniqueName } from "../support/api";

test.describe("Settings", () => {
  test("lists the admin on the users page", async ({ page }) => {
    await page.goto("/settings/users");
    await expect(page.getByRole("main").getByText("Ada Admin")).toBeVisible();
    await expect(page.getByRole("main").getByText("admin@example.com")).toBeVisible();
  });

  test("filters users by name", async ({ page }) => {
    await page.goto("/settings/users");
    await page.getByRole("main").getByRole("searchbox").fill("nobody-matches-this");
    await expect(page.getByText("No results")).toBeVisible();
  });

  test("lists a group", async ({ page, request }) => {
    const name = uniqueName("Engineering");
    await api(request, "groups.create", { name });

    await page.goto("/settings/groups");
    await expect(page.getByRole("main").getByText(name)).toBeVisible();
  });

  test("lists a shared document link", async ({ page, request }) => {
    const collection = sharedCollection();
    const doc = await createDocument(request, {
      collectionId: collection.id,
      title: uniqueName("Public FAQ"),
      text: "Answers.",
    });
    await api(request, "shares.create", { documentId: doc.id, published: true });

    await page.goto("/settings/shares");
    await expect(page.getByRole("main").getByText(doc.title)).toBeVisible();
  });

  test("shows the workspace details", async ({ page }) => {
    await page.goto("/settings/details");
    await expect(page.getByRole("heading", { name: "Details" })).toBeVisible();
  });
});
