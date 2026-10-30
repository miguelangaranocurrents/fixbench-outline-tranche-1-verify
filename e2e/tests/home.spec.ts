import { test, expect } from "@playwright/test";
import { api, createDocument, sharedCollection, uniqueName } from "../support/api";

// Clicks the centre of a card with the mouse, holding the button for `holdMs`.
async function clickCard(page, card, holdMs = 0) {
  await expect(card).toBeVisible();
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  if (holdMs) {
    await page.waitForTimeout(holdMs);
  }
  await page.mouse.up();
}

function pinnedCard(page, title: string) {
  return page
    .getByRole("main")
    .getByRole("link")
    .filter({ has: page.getByRole("heading", { name: title, level: 3 }) });
}

test.describe("Home", () => {
  test("lists a recently viewed document", async ({ page, request }) => {
    const collection = sharedCollection();
    const doc = await createDocument(request, {
      collectionId: collection.id,
      title: uniqueName("Weekly sync"),
      text: "Agenda",
    });

    const viewed = page.waitForResponse("**/api/views.create");
    await page.goto(doc.url);
    await expect(page.getByText("Agenda")).toBeVisible();
    await viewed;
    await page.goto("/home");
    await expect(page.getByRole("link", { name: new RegExp(doc.title) }).first()).toBeVisible();
  });

  test("opens a pinned document with a quick click", async ({ page, request }) => {
    const collection = sharedCollection();
    const doc = await createDocument(request, {
      collectionId: collection.id,
      title: uniqueName("Pinned handbook"),
      text: "Welcome to the team.",
    });
    await api(request, "pins.create", { documentId: doc.id });

    await page.goto("/home");
    await clickCard(page, pinnedCard(page, doc.title));
    await expect(page).toHaveURL(new RegExp(doc.urlId));
    await expect(page.getByText("Welcome to the team.").first()).toBeVisible();
  });

  test("opens a pinned document when the click is held briefly", async ({ page, request }) => {
    const collection = sharedCollection();
    const doc = await createDocument(request, {
      collectionId: collection.id,
      title: uniqueName("Pinned roadmap"),
      text: "Quarterly goals.",
    });
    await api(request, "pins.create", { documentId: doc.id });

    await page.goto("/home");
    await clickCard(page, pinnedCard(page, doc.title), 250);

    await expect(page).toHaveURL(new RegExp(doc.urlId));
    await expect(page.getByText("Quarterly goals.").first()).toBeVisible();
  });

  test("unpins a document from home", async ({ page, request }) => {
    const collection = sharedCollection();
    const doc = await createDocument(request, {
      collectionId: collection.id,
      title: uniqueName("Pinned FAQ"),
      text: "Questions.",
    });
    await api(request, "pins.create", { documentId: doc.id });

    await page.goto("/home");
    const card = pinnedCard(page, doc.title);
    await card.hover();
    await card.getByRole("button", { name: "Unpin" }).click();
    await expect(card).toBeHidden();
  });
});
