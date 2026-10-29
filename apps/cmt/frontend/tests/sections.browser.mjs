import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Playwright may be installed outside the workspace to keep application dependencies unchanged.
const modulePath = process.env.CMT_PLAYWRIGHT_MODULE || path.join(tmpdir(), "cmt-section-browser/node_modules/playwright/index.mjs");
const {chromium} = await import(pathToFileURL(modulePath).href);
const browser = await chromium.launch({headless: true, channel: "chrome"});
const base = process.env.CMT_BROWSER_URL || "http://localhost:3010/cmt";
const token = `fixture.${Buffer.from(JSON.stringify({uid: "section-browser-test", name: "Test instructor", roles: ["instructor"]})).toString("base64url")}.fixture`;
const sections = [{id: 101, section: "01"}, {id: 102, section: "02"}];
const archivedSections = new Set();
let status = "NOT_STARTED";
let dismissed = false;
let lastBlockRequest;
let lastSectionRequest;
let sharedBlock = false;
const removedBlocks = new Set();
const warning = () => ({
    id: 7, occurrence: 1, dismissedAt: dismissed ? "2026-10-14T12:00:00Z" : null,
    details: {
        kind: "completion", label: "Requirements workshop",
        message: "Section 02 has not completed Requirements workshop; section 01 has.",
        reviewCourseId: 102, reviewSessionNum: 1,
        sections: [{courseId: 101, section: "01", sessionNum: 1, week: 1, status: "COMPLETED"},
            {courseId: 102, section: "02", sessionNum: 1, week: 1, status: "NOT_STARTED"}]
    }
});
const context = await browser.newContext({viewport: {width: 1365, height: 950}});
await context.addCookies([{name: "cmt_id", value: token, url: "http://localhost:3010"}]);
await context.route("**/api/cmt/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const api = url.pathname.replace(/^.*\/api\/cmt\//, "");
    const courseId = api.includes("102") ? 102 : 101;
    const session = {id: courseId * 10, sessionNum: 1, courseId, date: "2026-10-14", canceled: false};
    let data;
    if (/^course\/\d+$/.test(api) && request.method() === "DELETE") {
        archivedSections.add(courseId);
        data = {success: true};
    } else if (/^course\/\d+\/sections$/.test(api) && request.method() === "GET") {
        data = {sections: sections.filter(item => !archivedSections.has(item.id))};
    } else if (/^course\/\d+\/section-sync\/\d+\/dismiss$/.test(api)) {
        dismissed = true;
        data = {success: true};
    } else if (/^course\/\d+\/section-sync$/.test(api)) {
        const activeSections = sections.filter(item => !archivedSections.has(item.id));
        const outOfSync = status === "COMPLETED" && activeSections.length > 1;
        data = {sections: activeSections, issues: outOfSync ? [warning()] : [], inSync: !outOfSync};
    } else if (/^course\/\d+\/sections$/.test(api) && request.method() === "POST") {
        lastSectionRequest = request.postDataJSON();
        data = {course: {...sections[1], id: 102}};
    } else if (/^course\/\d+$/.test(api)) {
        data = {course: {id: courseId, section: courseId === 101 ? "01" : "02", name: "Software Engineering", classId: "SWEN-261",
            color: "#0484c9", season: "Fall", year: 2026, days: "Mo, We", startDate: "2026-10-12", sessions: [session]},
        workflow: null, actionsWithContexts: []};
    } else if (/^session\/\d+$/.test(api)) {
        data = {sessions: [session], sessionMaterials: [{material: []}], sessionBlocks: [{blocks: removedBlocks.has(courseId) ? [] : [
            {id: 77, sharedKey: "workshop", name: "Requirements workshop", position: 0, sessionId: session.id, status: courseId === 101 ? status : "NOT_STARTED"}
        ]}]};
    } else if (api === "session/blocks" && request.method() === "POST") {
        lastBlockRequest = request.postDataJSON();
        data = {block: {id: 78, ...lastBlockRequest}};
    } else if (api === "session/blocks/77" && request.method() === "DELETE") {
        removedBlocks.add(102);
        data = {success: true};
    } else if (api === "session/blocks/77/share") {
        sharedBlock = true;
        data = {success: true};
    } else if (api === "session/blocks/77" && request.method() === "PATCH") {
        status = request.postDataJSON().status;
        data = {block: {id: 77, status}};
    } else if (api === "course") data = sections.filter(item => !archivedSections.has(item.id)).map(item => ({...item, active: true}));
    else if (api.startsWith("resources/")) data = [];
    else throw new Error(`Unexpected browser-test API request: ${request.method()} ${api}`);
    await route.fulfill({json: data, headers: {"Access-Control-Allow-Origin": "http://localhost:3010", "Access-Control-Allow-Credentials": "true"}});
});

const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => {if (message.type() === "error") console.error(message.text());});
try {
    await page.goto(`${base}/courses/101`);
    await page.getByLabel("Section", {exact: true}).waitFor();
    assert.equal(await page.getByLabel("Section", {exact: true}).inputValue(), "101");
    await page.getByRole("button", {name: "Add section", exact: true}).click();
    await page.getByLabel("Section number", {exact: true}).fill("02");
    await page.getByLabel("Progress", {exact: true}).selectOption("copy");
    await page.getByRole("button", {name: "Create section", exact: true}).click();
    await page.waitForURL("**/courses/102");
    assert.deepEqual(lastSectionRequest, {section: "02", progress: "copy"});
    await page.getByLabel("Section", {exact: true}).selectOption("101");
    await page.waitForURL("**/courses/101");
    await page.getByRole("button", {name: "Session 1 (No materials)", exact: false}).click();
    await page.getByRole("button", {name: "Copy Requirements workshop to other sections", exact: true}).click();
    assert.equal(sharedBlock, true);
    await page.getByRole("button", {name: "Add block", exact: true}).click();
    await page.getByLabel("Apply to sections").selectOption("all");
    await page.getByPlaceholder("e.g. Requirements workshop").fill("Shared lecture");
    await page.getByRole("dialog").getByRole("button", {name: "Add block", exact: true}).click();
    assert.equal(lastBlockRequest.applyToAll, true);
    await page.getByLabel("Requirements workshop status").selectOption("COMPLETED");
    const dialog = page.getByRole("dialog");
    await dialog.getByText("Section sync", {exact: true}).waitFor();
    assert.ok(await dialog.getByText("Section 02 has not completed Requirements workshop; section 01 has.").isVisible());
    await dialog.getByRole("button", {name: "Review affected session"}).click();
    await page.waitForURL("**/courses/102?session=1#sessions");
    await page.getByLabel("Requirements workshop status").waitFor({state: "visible"});
    assert.equal(dismissed, true);
    await page.reload();
    await page.getByLabel("Requirements workshop status").waitFor({state: "visible"});
    assert.equal(await page.getByRole("dialog").count(), 0);

    for (const viewport of [{width: 1365, height: 950}, {width: 390, height: 844}]) {
        await page.setViewportSize(viewport);
        await page.getByRole("button", {name: "Review differences"}).click();
        await page.waitForFunction(() => {
            const modal = document.querySelector(".modal.show");
            return modal && getComputedStyle(modal).opacity === "1" &&
                getComputedStyle(modal.querySelector(".modal-dialog")).transform === "none";
        });
        const box = await page.getByRole("dialog").boundingBox();
        assert.ok(box && box.x >= 0 && box.x + box.width <= viewport.width + 1);
        await page.screenshot({path: path.join(tmpdir(), `cmt-sections-${viewport.width}.png`), fullPage: false, animations: "disabled"});
        await page.getByRole("dialog").getByRole("button", {name: "Dismiss", exact: true}).click();
    }
    await page.getByRole("button", {name: "Remove Requirements workshop", exact: true}).click();
    await page.getByRole("dialog").getByRole("button", {name: "Keep block", exact: true}).click();
    await page.getByRole("dialog").waitFor({state: "hidden"});
    assert.equal(removedBlocks.size, 0);
    await page.getByRole("button", {name: "Remove Requirements workshop", exact: true}).click();
    await page.getByRole("dialog").getByRole("button", {name: "Remove block", exact: true}).click();
    await page.getByText("No blocks in this session.", {exact: true}).waitFor();
    assert.equal(removedBlocks.size, 1);
    assert.ok(removedBlocks.has(102));
    await page.locator("#root").getByRole("button", {name: "Remove section", exact: true}).click();
    await page.getByRole("dialog").getByRole("button", {name: "Keep section", exact: true}).click();
    await page.getByRole("dialog").waitFor({state: "hidden"});
    assert.equal(archivedSections.size, 0);
    await page.locator("#root").getByRole("button", {name: "Remove section", exact: true}).click();
    await page.getByRole("dialog").getByRole("button", {name: "Remove section", exact: true}).click();
    await page.waitForURL("**/courses/101");
    assert.ok(archivedSections.has(102));
    await page.waitForFunction(() => document.getElementById("related-section")?.options.length === 1);
    await page.locator("#root").getByRole("button", {name: "Remove section", exact: true}).click();
    await page.getByRole("dialog").getByRole("button", {name: "Remove section", exact: true}).click();
    await page.waitForURL("**/cmt/courses");
    assert.equal(archivedSections.size, 2);
    assert.deepEqual(errors, []);
    console.log("Section creation, shared blocks, sync warnings, desktop/mobile modals, block/section removal confirmation and cancellation, and last-section navigation passed.");
} catch (error) {
    await page.screenshot({path: path.join(tmpdir(), "cmt-sections-browser-failure.png"), fullPage: false});
    console.error({url: page.url(), errors, visiblePage: (await page.locator("body").innerText()).slice(0, 2500)});
    throw error;
} finally {
    await browser.close();
}
