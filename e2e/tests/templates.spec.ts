import { test, expect } from "@playwright/test";
import { api, uniqueName } from "../support/api";

function paragraph(text: string) {
  return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] };
}

async function createTemplate(request, title: string, text: string) {
  return api(request, "templates.create", { title, data: paragraph(text), publish: true });
}

test.describe("Templates", () => {
  test("lists workspace templates in settings", async ({ page, request }) => {
    const title = uniqueName("Bug report");
    await createTemplate(request, title, "Steps to reproduce");

    await page.goto("/settings/templates");
    await expect(page.getByText(title)).toBeVisible();
  });

  test("opens a template from settings", async ({ page, request }) => {
    const title = uniqueName("Retro");
    await createTemplate(request, title, "What went well?");

    await page.goto("/settings/templates");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: title }).click();
    await expect(page).toHaveURL(/\/settings\/templates\/.+/);
    await expect(page.getByText("What went well?")).toBeVisible();
  });
});
