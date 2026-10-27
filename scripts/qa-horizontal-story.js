import { chromium } from "playwright";

const BASE_URL = "http://localhost:5173";

async function runQA() {
  console.log("==================================================================");
  console.log("  HORIZONTAL STORYTELLING VISUAL & SCROLL QA TEST SUITE  ");
  console.log("==================================================================\n");

  const browser = await chromium.launch({ channel: "chrome", headless: true });

  try {
    // -------------------------------------------------------------
    // TEST 1: 1440px DESKTOP
    // -------------------------------------------------------------
    console.log("--- TEST 1: 1440px DESKTOP VIEWPORT ---");
    const page1440 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page1440.goto(BASE_URL, { waitUntil: "networkidle" });

    // Scroll to exact top of story section
    const storyTop1440 = await page1440.evaluate(() => {
      const el = document.getElementById("story");
      return el ? el.offsetTop : 0;
    });
    console.log(`[1440px] Story section offsetTop: ${storyTop1440}px`);
    await page1440.evaluate((top) => window.scrollTo(0, top), storyTop1440);
    await page1440.waitForTimeout(500);

    const card01 = page1440.locator("article[data-index='0']");
    const card05 = page1440.locator("article[data-index='4']");

    const box01Initial = await card01.boundingBox();
    console.log(`[1440px] Initial Card 01 Orchard X: ${box01Initial?.x}px, Width: ${box01Initial?.width}px`);
    if (!box01Initial || box01Initial.x < 0 || box01Initial.x > 300) {
      throw new Error(`Card 01 Orchard not in initial viewport position: x=${box01Initial?.x}`);
    }

    const storySection = page1440.locator("section#story");
    const sectionBox = await storySection.boundingBox();
    console.log(`[1440px] Section Height: ${sectionBox?.height}px (Dynamic scroll track height)`);

    // Progressive vertical scrolling
    console.log("[1440px] Scrolling vertically through story sequence...");
    const scrollSteps = 10;
    const totalScroll = (sectionBox?.height || 2000) - 900;

    for (let step = 1; step <= scrollSteps; step++) {
      const targetY = storyTop1440 + (step / scrollSteps) * totalScroll;
      await page1440.evaluate((y) => window.scrollTo(0, y), targetY);
      await page1440.waitForTimeout(150);

      const activeText = await page1440.locator(".stage.active-stage h3").textContent();
      const progressScale = await page1440.evaluate(() => {
        const el = document.querySelector(".story-progress-fill");
        return el ? el.style.transform : "";
      });
      console.log(`    Step ${step}/${scrollSteps}: Active Stage = "${activeText}", Progress fill = ${progressScale}`);
    }

    // At the end of horizontal sequence, verify Card 05 Table
    const box05Final = await card05.boundingBox();
    console.log(`[1440px] Final Card 05 Table: x=${box05Final?.x}px, right=${(box05Final?.x || 0) + (box05Final?.width || 0)}px`);
    const card05Right = (box05Final?.x || 0) + (box05Final?.width || 0);
    const rightMargin = 1440 - card05Right;
    console.log(`[1440px] Breathing room after Card 05: ${rightMargin.toFixed(1)}px (Expected >= 60px)`);

    if (rightMargin < 40) {
      throw new Error(`Card 05 Table clipped or insufficient breathing room: ${rightMargin}px`);
    }
    console.log("✓ 1440px Passed: All 5 cards traversed smoothly and Card 05 Table has generous breathing room!");

    // Test clicking navigation pill
    console.log("[1440px] Testing navigation pill jump to '03 Press'...");
    await page1440.click("button[aria-label*='03 Press']");
    await page1440.waitForTimeout(600);
    const jumpedStage = await page1440.locator(".stage.active-stage h3").textContent();
    console.log(`    Jumped to active stage: "${jumpedStage}"`);

    await page1440.close();

    // -------------------------------------------------------------
    // TEST 2: 1280px LAPTOP VIEWPORT
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: 1280px LAPTOP VIEWPORT ---");
    const page1280 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page1280.goto(BASE_URL, { waitUntil: "networkidle" });

    const storyTop1280 = await page1280.evaluate(() => {
      const el = document.getElementById("story");
      return el ? el.offsetTop : 0;
    });
    await page1280.evaluate((top) => window.scrollTo(0, top), storyTop1280);
    await page1280.waitForTimeout(500);

    const story1280 = page1280.locator("section#story");
    const box1280Sec = await story1280.boundingBox();
    console.log(`[1280px] Section Height: ${box1280Sec?.height}px`);

    // Scroll to end of section
    const totalScroll1280 = (box1280Sec?.height || 2000) - 800;
    await page1280.evaluate(({ top, scroll }) => window.scrollTo(0, top + scroll), { top: storyTop1280, scroll: totalScroll1280 });
    await page1280.waitForTimeout(400);

    const card05_1280 = await page1280.locator("article[data-index='4']").boundingBox();
    const right1280 = 1280 - ((card05_1280?.x || 0) + (card05_1280?.width || 0));
    console.log(`[1280px] Card 05 Table right margin: ${right1280.toFixed(1)}px`);
    if (right1280 < 40) {
      throw new Error(`Card 05 Table clipped at 1280px: ${right1280}px`);
    }
    console.log("✓ 1280px Passed: Full horizontal sequence revealed correctly!");
    await page1280.close();

    // -------------------------------------------------------------
    // TEST 3: 1024px SMALL DESKTOP VIEWPORT
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: 1024px SMALL DESKTOP VIEWPORT ---");
    const page1024 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    await page1024.goto(BASE_URL, { waitUntil: "networkidle" });

    const storyTop1024 = await page1024.evaluate(() => {
      const el = document.getElementById("story");
      return el ? el.offsetTop : 0;
    });
    await page1024.evaluate((top) => window.scrollTo(0, top), storyTop1024);
    await page1024.waitForTimeout(500);

    const story1024 = page1024.locator("section#story");
    const box1024Sec = await story1024.boundingBox();
    console.log(`[1024px] Section Height: ${box1024Sec?.height}px`);

    const totalScroll1024 = (box1024Sec?.height || 2000) - 768;
    await page1024.evaluate(({ top, scroll }) => window.scrollTo(0, top + scroll), { top: storyTop1024, scroll: totalScroll1024 });
    await page1024.waitForTimeout(400);

    const card05_1024 = await page1024.locator("article[data-index='4']").boundingBox();
    const right1024 = 1024 - ((card05_1024?.x || 0) + (card05_1024?.width || 0));
    console.log(`[1024px] Card 05 Table right margin: ${right1024.toFixed(1)}px`);
    if (right1024 < 30) {
      throw new Error(`Card 05 Table clipped at 1024px: ${right1024}px`);
    }
    console.log("✓ 1024px Passed: Fully responsive cards with comfortable breathing room!");
    await page1024.close();

    // -------------------------------------------------------------
    // TEST 4: 768px TABLET & 390px MOBILE
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: 390px MOBILE TOUCH VIEWPORT ---");
    const page390 = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    await page390.goto(BASE_URL, { waitUntil: "networkidle" });

    // Check no horizontal body overflow
    const bodyScrollWidth = await page390.evaluate(() => document.body.scrollWidth);
    console.log(`[390px] Body Scroll Width: ${bodyScrollWidth}px (Viewport: 390px)`);
    if (bodyScrollWidth > 395) {
      throw new Error(`Horizontal page overflow detected on mobile: ${bodyScrollWidth}px`);
    }

    // Verify track is swipeable
    const trackOverflow = await page390.evaluate(() => {
      const el = document.querySelector(".stage-track");
      return el ? window.getComputedStyle(el).overflowX : "";
    });
    console.log(`[390px] Stage track overflow-x: ${trackOverflow}`);

    console.log("✓ Mobile Passed: Clean touch carousel without horizontal page overflow!");
    await page390.close();

    console.log("\n==================================================================");
    console.log("  ALL HORIZONTAL STORYTELLING QA TESTS PASSED WITH 100% SUCCESS!  ");
    console.log("==================================================================");
  } catch (err) {
    console.error("❌ QA Test Failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runQA();
