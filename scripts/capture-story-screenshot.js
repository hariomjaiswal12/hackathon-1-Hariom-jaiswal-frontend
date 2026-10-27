import { chromium } from "playwright";

const BASE_URL = "http://localhost:5173";
const ARTIFACT_DIR = "C:/Users/HP/.gemini/antigravity-ide/brain/ce84ab7b-f6e7-4d8b-8d2f-9ff897221d15";

async function capture() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  const storyTop = await page.evaluate(() => {
    const el = document.getElementById("story");
    return el ? el.offsetTop : 0;
  });

  // 1. Initial State (Card 01 Orchard)
  await page.evaluate((top) => window.scrollTo(0, top), storyTop);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${ARTIFACT_DIR}/story_01_orchard.png` });
  console.log("Captured story_01_orchard.png");

  // 2. Mid State (Card 03 Press)
  const totalScroll = await page.evaluate(() => {
    const el = document.getElementById("story");
    return el ? el.offsetHeight - window.innerHeight : 1200;
  });
  await page.evaluate(({ top, scroll }) => window.scrollTo(0, top + scroll * 0.5), { top: storyTop, scroll: totalScroll });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${ARTIFACT_DIR}/story_03_press.png` });
  console.log("Captured story_03_press.png");

  // 3. Final State (Card 05 Table with generous breathing room)
  await page.evaluate(({ top, scroll }) => window.scrollTo(0, top + scroll), { top: storyTop, scroll: totalScroll });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${ARTIFACT_DIR}/story_05_table.png` });
  console.log("Captured story_05_table.png");

  await browser.close();
}

capture();
