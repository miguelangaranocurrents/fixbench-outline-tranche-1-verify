import { test, expect } from "@playwright/test";
import { sharedCollection } from "../support/api";

async function importMarkdown(page, collection, name: string, markdown: string) {
  await page.goto(collection.url);
  await page.locator('input[type="file"]').first().setInputFiles({
    name,
    mimeType: "text/markdown",
    buffer: Buffer.from(markdown),
  });
  await expect(page).toHaveURL(/\/doc\//, { timeout: 30_000 });
}

test.describe("Import", () => {
  test("imports a markdown file with headings and a bullet list", async ({ page, request }) => {
    const collection = sharedCollection();
    await importMarkdown(
      page,
      collection,
      "meeting-notes.md",
      "# Meeting notes\n\n## Attendees\n\n- Ada\n- Grace\n\n## Decisions\n\nShip on Friday."
    );

    const editor = page.locator(".ProseMirror").first();
    await expect(editor.getByRole("heading", { name: "Attendees" })).toBeVisible();
    await expect(editor.locator("ul li", { hasText: "Grace" })).toBeVisible();
    await expect(editor.getByText("Ship on Friday.")).toBeVisible();
  });

  test("imports a checklist next to other lists", async ({ page, request }) => {
    const collection = sharedCollection();
    await importMarkdown(
      page,
      collection,
      "release.md",
      [
        "## Before 1",
        "- B1 a",
        "- B1 b",
        "",
        "## Before 2",
        "- B2 a",
        "- B2 b",
        "",
        "## Tasks",
        "- [ ] task one",
        "- [x] task two",
        "",
        "## After 1",
        "- A1 a",
        "- A1 b",
        "",
        "## After 2",
        "- A2 a",
      ].join("\n")
    );

    const editor = page.locator(".ProseMirror").first();
    await expect(editor.getByText("task two")).toBeVisible();
    await expect(editor.locator('[role="checkbox"]')).toHaveCount(2);
    for (const item of ["B1 a", "B1 b", "B2 a", "B2 b", "A1 a", "A1 b", "A2 a"]) {
      await expect(editor.getByText(item, { exact: true })).toBeVisible();
    }
  });
});
