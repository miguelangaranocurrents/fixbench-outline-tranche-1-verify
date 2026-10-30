import { test, expect } from "@playwright/test";
import { createDocument, sharedCollection } from "../support/api";

test.describe("Comments", () => {
  test("posts a comment with the Post button", async ({ page, request }) => {
    const collection = sharedCollection();
    const doc = await createDocument(request, {
      collectionId: collection.id,
      text: "Some text to discuss.",
    });

    await page.goto(doc.url);
    await page.getByRole("button", { name: "Comment", exact: true }).click();
    await page.locator('[data-empty-text="Add a comment…"]').click();
    await page.keyboard.type("Looks good to me");
    await page.getByRole("button", { name: "Post" }).click();

    await expect(page.getByRole("button", { name: "1 comment" })).toBeVisible();
  });

  test("posts a new comment with Ctrl+Enter", async ({ page, request }) => {
    const collection = sharedCollection();
    const doc = await createDocument(request, {
      collectionId: collection.id,
      text: "Draft proposal.",
    });

    await page.goto(doc.url);
    await page.getByRole("button", { name: "Comment", exact: true }).click();
    await page.locator('[data-empty-text="Add a comment…"]').click();
    await page.keyboard.type("Ship it");
    await page.keyboard.press("Control+Enter");

    await expect(page.getByRole("button", { name: "1 comment" })).toBeVisible();
  });

  test("keeps the comments sidebar closed after a reload", async ({ page, request }) => {
    const collection = sharedCollection();
    const doc = await createDocument(request, {
      collectionId: collection.id,
      text: "# Intro\n\nBody text.",
    });

    await page.goto(doc.url);
    const commentButton = page.getByRole("button", { name: "Comment", exact: true });
    await commentButton.click();
    await expect(page.locator('[data-empty-text="Add a comment…"]')).toBeVisible();

    await page.getByRole("button", { name: "Show contents" }).click();
    await commentButton.click();
    await expect(page.locator('[data-empty-text="Add a comment…"]')).toBeHidden();

    await page.reload();
    await expect(page.getByText("Body text.")).toBeVisible();
    await expect(commentButton).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator('[data-empty-text="Add a comment…"]')).toBeHidden();
  });
});
