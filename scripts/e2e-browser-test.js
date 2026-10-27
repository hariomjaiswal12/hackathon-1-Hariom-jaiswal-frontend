import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const API_URL =
  process.env.VITE_API_BASE_URL ||
  process.env.API_URL ||
  "http://localhost:5000/api/v1";

async function runE2E() {
  console.log("==================================================================");
  console.log("  TXOTX OS & SIDERÍA ITURRIETA — FULL E2E BROWSER VERIFICATION  ");
  console.log("==================================================================\n");

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const networkLogs = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/v1")) {
      networkLogs.push({ method: req.method(), url: req.url() });
    }
  });

  const uniqueStamp = Date.now().toString().slice(-6);
  const testCustomer = {
    name: `Customer ${uniqueStamp}`,
    email: `e2e-cust-${uniqueStamp}@iturrieta.eus`,
    password: "Password123!",
    phone: "+34 685 11 22 33",
  };

  try {
    // -------------------------------------------------------------
    // PHASE 2: CUSTOMER AUTH FLOW
    // -------------------------------------------------------------
    console.log("--- PHASE 2: CUSTOMER AUTH FLOW ---");

    // Test 1: Registration
    console.log("[Test 1] Navigating to Home...");
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    console.log("[Test 1] Clicking 'Sign In' in Navbar...");
    await page.click("button:has-text('Sign In')");
    await page.waitForSelector("#auth-modal-title");

    console.log("[Test 1] Switching to 'Create Account' tab...");
    await page.click("button:has-text('Create Account')");

    console.log("[Test 1] Filling registration form...");
    await page.fill("input[placeholder='e.g. Amaia Agirre']", testCustomer.name);
    await page.fill("input[placeholder='name@example.com']", testCustomer.email);
    await page.fill("input[placeholder='+34 685 72 15 92']", testCustomer.phone);
    await page.fill("input[placeholder='••••••••']", testCustomer.password);

    const [registerRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/auth/register")),
      page.click("button[type='submit']:has-text('Create Customer Account')"),
    ]);

    console.log(`[Test 1] POST /auth/register status: ${registerRes.status()}`);
    const regJson = await registerRes.json();
    if (registerRes.status() !== 201 || !regJson.data?.token) {
      throw new Error("Registration failed to return 201 and token");
    }

    // Verify UI reflects logged in state
    await page.waitForSelector(`text=${testCustomer.name.split(" ")[0]}`);
    await page.waitForSelector("a:has-text('My Bookings')");
    const tokenInStorage = await page.evaluate(() => localStorage.getItem("txotx_token"));
    if (!tokenInStorage) throw new Error("Token was not saved in localStorage!");
    console.log("✓ Test 1 Passed: Customer Registration, token storage, and Navbar update verified.");

    // Test 2: Logout and Login
    console.log("\n[Test 2] Clicking 'Sign Out'...");
    await page.click("button:has-text('Sign Out')");
    await page.waitForSelector("button:has-text('Sign In')");

    const tokenAfterSignOut = await page.evaluate(() => localStorage.getItem("txotx_token"));
    if (tokenAfterSignOut) throw new Error("Token should be cleared after Sign Out!");

    console.log("[Test 2] Testing invalid credentials rejection...");
    await page.click("button:has-text('Sign In')");
    await page.fill("input[placeholder='name@example.com']", testCustomer.email);
    await page.fill("input[placeholder='••••••••']", "WrongPassword999!");

    const [invalidLoginRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/auth/login")),
      page.click("button[type='submit']:has-text('Sign In to Iturrieta')"),
    ]);
    console.log(`[Test 2] Invalid login status: ${invalidLoginRes.status()} (Expected 401)`);
    await page.waitForSelector("text=Invalid email or password");
    console.log("✓ Test 2 (Part A) Passed: Invalid credentials rejected with user error.");

    console.log("[Test 2] Logging in with correct credentials...");
    await page.fill("input[placeholder='••••••••']", testCustomer.password);
    const [validLoginRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/auth/login")),
      page.click("button[type='submit']:has-text('Sign In to Iturrieta')"),
    ]);
    console.log(`[Test 2] POST /auth/login status: ${validLoginRes.status()}`);
    await page.waitForSelector(`text=${testCustomer.name.split(" ")[0]}`);
    console.log("✓ Test 2 (Part B) Passed: Valid login succeeded and Navbar restored.");

    // Test 3: Session Persistence
    console.log("\n[Test 3] Refreshing page to test session persistence (/auth/me)...");
    const [meRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/auth/me")),
      page.reload({ waitUntil: "networkidle" }),
    ]);
    console.log(`[Test 3] GET /auth/me status: ${meRes.status()}`);
    await page.waitForSelector(`text=${testCustomer.name.split(" ")[0]}`);
    console.log("✓ Test 3 Passed: Session restored via GET /auth/me on browser reload.");

    // -------------------------------------------------------------
    // PHASE 3: REAL BOOKING FLOW
    // -------------------------------------------------------------
    console.log("\n--- PHASE 3: REAL BOOKING FLOW ---");

    console.log("[Phase 3] Scrolling to reservations section (#book)...");
    await page.goto(`${BASE_URL}/#book`, { waitUntil: "networkidle" });
    await page.waitForSelector("section#book");

    // Step 1: Date check
    console.log("[Phase 3 - Step 1] Selecting open date (2026-11-14 Saturday)...");
    const [effectiveSchedRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/schedules/effective/2026-11-14")),
      page.fill("input[name='date']", "2026-11-14"),
    ]);
    console.log(`[Phase 3 - Step 1] GET /schedules/effective/2026-11-14 status: ${effectiveSchedRes.status()}`);
    const schedData = await effectiveSchedRes.json();
    console.log(`    Schedule Open: ${!schedData.data.schedule.isClosed}, Day: ${schedData.data.schedule.dayOfWeek}`);
    await page.waitForSelector("text=Open on SATURDAY");

    console.log("[Phase 3 - Step 1] Clicking 'Check availability' to Step 2 (Time)...");
    await page.click("button[type='submit']:has-text('Check availability')");

    // Step 2: Time check
    console.log("[Phase 3 - Step 2] Checking dynamic service time slots...");
    await page.waitForSelector("div.time-grid");
    const slotCount = await page.locator("div.time-grid button").count();
    console.log(`    Rendered ${slotCount} time slots directly from service schedule.`);
    await page.click("button:has-text('13:30')");
    await page.click("button[type='submit']:has-text('Continue')");

    // Step 3: Guests
    console.log("[Phase 3 - Step 3] Selecting 4 guests...");
    await page.waitForSelector("div.guest-picker");
    await page.click("button[aria-label='More guests']"); // 3
    await page.click("button[aria-label='More guests']"); // 4
    await page.click("button[type='submit']:has-text('Continue')");

    // Step 4: Table recommendation
    console.log("[Phase 3 - Step 4] Awaiting GET /tables/recommendation...");
    const recomResponse = await page.waitForResponse((r) => r.url().includes("/tables/recommendation"));
    console.log(`[Phase 3 - Step 4] Recommendation status: ${recomResponse.status()}`);
    const recomJson = await recomResponse.json();
    const recomList = recomJson.data.recommendation?.recommendations || [];
    console.log(`    Received ${recomList.length} bookable tables from backend recommendation engine.`);

    await page.waitForSelector("text=Bookable Table(s) Matched");
    // Pick the first recommended table
    const topTable = recomList[0].table;
    console.log(`    Selecting top recommended table: ${topTable.tableNumber} (Cap: ${topTable.capacity}, Location: ${topTable.location})`);
    await page.click(`button:has-text('${topTable.tableNumber}')`);
    await page.click("button[type='submit']:has-text('Continue')");

    // Step 5: Confirm Booking
    console.log("[Phase 3 - Step 5] Reviewing booking details...");
    await page.waitForSelector("text=Signed in as");
    await page.fill("textarea[name='requests']", "E2E automated celebration feast");

    console.log("[Phase 3 - Step 5] Submitting POST /bookings...");
    const [bookingCreateRes] = await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/bookings")),
      page.click("button[type='submit']:has-text('Confirm Booking')"),
    ]);

    console.log(`[Phase 3 - Step 5] POST /bookings status: ${bookingCreateRes.status()}`);
    const bookingJson = await bookingCreateRes.json();
    const bookingRef = bookingJson.data?.booking?.bookingReference;
    if (!bookingRef || !bookingRef.startsWith("TX-")) {
      throw new Error(`Invalid booking reference returned: ${bookingRef}`);
    }
    console.log(`    Booking Reference Created: ${bookingRef}`);

    // Verify Confirmation Screen
    await page.waitForSelector("text=Booking confirmed");
    await page.waitForSelector(`text=${bookingRef}`);
    console.log("✓ Phase 3 Passed: Real end-to-end booking created successfully with live reference!");

    // -------------------------------------------------------------
    // PHASE 4: CUSTOMER DASHBOARD & CANCELLATION
    // -------------------------------------------------------------
    console.log("\n--- PHASE 4: CUSTOMER DASHBOARD & CANCELLATION ---");

    console.log("[Phase 4] Navigating to /dashboard...");
    const [dashboardBookingsRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/bookings")),
      page.click("a:has-text('View in My Bookings')"),
    ]);
    console.log(`[Phase 4] GET /bookings status: ${dashboardBookingsRes.status()}`);

    await page.waitForSelector(`text=${bookingRef}`);
    await page.waitForSelector("span:has-text('Confirmed')");
    console.log(`    Booking ${bookingRef} successfully rendered in customer dashboard.`);

    console.log(`[Phase 4] Clicking 'Cancel Reservation' for ${bookingRef}...`);
    await page.click("button:has-text('Cancel Reservation')");
    await page.waitForSelector("h3:has-text('Cancel Reservation')");
    await page.fill("textarea[placeholder='e.g. Change of plans']", "Testing customer cancel action");

    const [cancelRes] = await Promise.all([
      page.waitForResponse((r) => r.request().method() === "PATCH" && r.url().includes(`/bookings/${bookingRef}/cancel`)),
      page.click("button:has-text('Confirm Cancellation')"),
    ]);
    console.log(`[Phase 4] PATCH /bookings/${bookingRef}/cancel status: ${cancelRes.status()}`);

    // Verify UI reflects Cancelled badge
    await page.waitForSelector("span:has-text('Cancelled')");

    // Verify persistence on browser reload
    console.log("[Phase 4] Reloading page to verify cancelled persistence...");
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector(`text=${bookingRef}`);
    await page.waitForSelector("span:has-text('Cancelled')");
    console.log("✓ Phase 4 Passed: Booking cancelled via UI and persisted across page refresh!");

    // -------------------------------------------------------------
    // PHASE 5: RESCHEDULE FLOW
    // -------------------------------------------------------------
    console.log("\n--- PHASE 5: RESCHEDULE FLOW ---");

    console.log("[Phase 5] Creating a second booking to test rescheduling...");
    await page.goto(`${BASE_URL}/#book`, { waitUntil: "networkidle" });
    await page.fill("input[name='date']", "2026-11-21"); // next Saturday
    await page.waitForResponse((r) => r.url().includes("/schedules/effective/2026-11-21"));
    await page.click("button[type='submit']:has-text('Check availability')");

    await page.waitForSelector("div.time-grid");
    await page.click("button:has-text('13:00')");
    await page.click("button[type='submit']:has-text('Continue')");

    await page.waitForSelector("div.guest-picker");
    await page.click("button[type='submit']:has-text('Continue')");

    const secondRecomRes = await page.waitForResponse((r) => r.url().includes("/tables/recommendation"));
    await page.waitForSelector("text=Bookable Table(s) Matched");
    const secRecomJson = await secondRecomRes.json();
    const secTopTable = secRecomJson.data?.recommendation?.recommendations?.[0]?.table;
    if (secTopTable) {
      await page.click(`button:has-text('${secTopTable.tableNumber}')`);
    }
    await page.click("button[type='submit']:has-text('Continue')");

    await page.waitForSelector("text=Signed in as");
    const [secondBookingRes] = await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/bookings")),
      page.click("button[type='submit']:has-text('Confirm Booking')"),
    ]);
    const secondBookingJson = await secondBookingRes.json();
    const secondBookingRef = secondBookingJson.data?.booking?.bookingReference;
    console.log(`    Second Booking Created: ${secondBookingRef}`);

    await page.click("a:has-text('View in My Bookings')");
    await page.waitForSelector(`text=${secondBookingRef}`);

    console.log(`[Phase 5] Opening Reschedule modal for ${secondBookingRef}...`);
    // Click reschedule on the active booking
    const rescheduleButtons = page.locator("button:has-text('Reschedule')");
    await rescheduleButtons.first().click();
    await page.waitForSelector("h3:has-text('Reschedule Reservation')");

    console.log("[Phase 5] Selecting new time: 14:00...");
    await page.fill("input[type='time']", "14:00");
    await page.waitForTimeout(1000); // allow table recommendations to fetch

    const [reschedulePatchRes] = await Promise.all([
      page.waitForResponse((r) => r.request().method() === "PATCH" && r.url().includes(`/bookings/${secondBookingRef}/reschedule`)),
      page.click("button:has-text('Confirm Reschedule')"),
    ]);
    console.log(`[Phase 5] PATCH /bookings/${secondBookingRef}/reschedule status: ${reschedulePatchRes.status()}`);

    await page.waitForSelector("text=14:00");
    console.log("✓ Phase 5 Passed: Booking rescheduled and updated in UI!");

    // -------------------------------------------------------------
    // PHASE 6: WAITLIST FLOW
    // -------------------------------------------------------------
    console.log("\n--- PHASE 6: WAITLIST FLOW ---");

    console.log("[Phase 6] Submitting waitlist entry from Booking section...");
    await page.goto(`${BASE_URL}/#book`, { waitUntil: "networkidle" });
    await page.fill("input[name='date']", "2026-11-14");
    await page.waitForResponse((r) => r.url().includes("/schedules/effective/2026-11-14"));
    await page.click("button[type='submit']:has-text('Check availability')");

    await page.waitForSelector("div.time-grid");
    await page.click("button:has-text('13:30')");
    await page.click("button[type='submit']:has-text('Continue')");

    // Request large party to trigger waitlist or choose waitlist
    await page.waitForSelector("div.guest-picker");
    for (let i = 0; i < 6; i++) {
      await page.click("button[aria-label='More guests']");
    }
    await page.click("button[type='submit']:has-text('Continue')");

    // Click switch to waitlist button
    console.log("    Clicking 'Join Waiting List' button...");
    await page.click("button:has-text('Join Waiting List')");

    await page.waitForSelector("button[type='submit']:has-text('Join Waiting List')");
    const [waitlistPostRes] = await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/waitlist")),
      page.click("button[type='submit']:has-text('Join Waiting List')"),
    ]);
    console.log(`[Phase 6] POST /waitlist status: ${waitlistPostRes.status()}`);
    const wlJson = await waitlistPostRes.json();
    const wlRef = wlJson.data?.waitlist?.waitlistReference;
    console.log(`    Waitlist Reference Created: ${wlRef}`);

    await page.waitForSelector("text=Waitlist Joined");
    await page.click("a:has-text('Track on Dashboard')");

    // Check waitlist tab in dashboard
    await page.click("button:has-text('Waitlist Requests')");
    await page.waitForSelector(`text=${wlRef}`);
    await page.waitForSelector("span:has-text('Waiting')");
    console.log("✓ Phase 6 Passed: Waitlist entry created and displayed on Dashboard!");

    // -------------------------------------------------------------
    // PHASE 7: NOTIFICATIONS
    // -------------------------------------------------------------
    console.log("\n--- PHASE 7: NOTIFICATIONS ---");

    console.log("[Phase 7] Clicking 'Notifications' tab...");
    const [notifRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/notifications")),
      page.click("button:has-text('Notifications')"),
    ]);
    console.log(`[Phase 7] GET /notifications status: ${notifRes.status()}`);

    const notifCount = await page.locator("div.space-y-3 > div").count();
    console.log(`    Found ${notifCount} customer notifications.`);

    const markAllReadBtn = page.locator("button:has-text('Mark All Read')");
    if (await markAllReadBtn.isVisible()) {
      console.log("[Phase 7] Clicking 'Mark All Read'...");
      const [markAllRes] = await Promise.all([
        page.waitForResponse((r) => r.request().method() === "PATCH" && r.url().includes("/notifications/read-all")),
        markAllReadBtn.click(),
      ]);
      console.log(`[Phase 7] PATCH /notifications/read-all status: ${markAllRes.status()}`);
      console.log("✓ Phase 7 Passed: In-app notifications verified and marked read!");
    }

    // -------------------------------------------------------------
    // PHASE 8: STAFF OPERATIONS
    // -------------------------------------------------------------
    console.log("\n--- PHASE 8: STAFF OPERATIONS ---");

    console.log("[Phase 8] Signing out of customer account...");
    await page.click("button:has-text('Sign Out')");
    await page.waitForSelector("button:has-text('Sign In')");

    console.log("[Phase 8] Signing in as Staff member...");
    await page.click("button:has-text('Sign In')");
    await page.click("button:has-text('Staff Member')"); // quick fill pill
    const [staffLoginRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/auth/login")),
      page.click("button[type='submit']:has-text('Sign In to Iturrieta')"),
    ]);
    console.log(`[Phase 8] Staff login status: ${staffLoginRes.status()}`);

    await page.waitForSelector("a:has-text('Operations (STAFF)')");
    console.log("[Phase 8] Navigating to /operations...");
    const [floorRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/tables/floor/live")),
      page.click("a:has-text('Operations (STAFF)')"),
    ]);
    console.log(`[Phase 8] GET /tables/floor/live status: ${floorRes.status()}`);

    await page.waitForSelector("h3:has-text('Restaurant Floor Status')");
    console.log("    Live floor successfully rendered with real tables and operational states.");

    // Update table physical status
    console.log("[Phase 8] Updating table T01 physical status to CLEANING...");
    const statusSelect = page.locator("select").first();
    const [statusPatchRes] = await Promise.all([
      page.waitForResponse((r) => r.request().method() === "PATCH" && r.url().includes("/status")),
      statusSelect.selectOption("CLEANING"),
    ]);
    console.log(`[Phase 8] PATCH table status: ${statusPatchRes.status()}`);

    // Bookings Operations tab
    console.log("[Phase 8] Clicking 'Bookings Operations' tab...");
    const [staffBookingsRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/bookings")),
      page.click("button:has-text('Bookings Operations')"),
    ]);
    console.log(`[Phase 8] GET /bookings status: ${staffBookingsRes.status()}`);
    await page.waitForSelector("table");

    // Waitlist Queue tab
    console.log("[Phase 8] Clicking 'Waitlist Queue' tab...");
    const [staffWlRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/waitlist")),
      page.click("button:has-text('Waitlist Queue')"),
    ]);
    console.log(`[Phase 8] GET /waitlist status: ${staffWlRes.status()}`);
    await page.waitForSelector("table");

    console.log("✓ Phase 8 Passed: Staff operations, live floor, booking management, and waitlist verified!");

    console.log("\n==================================================================");
    console.log("  ALL END-TO-END BROWSER TESTS COMPLETED WITH 100% SUCCESS!  ");
    console.log("==================================================================");
  } catch (error) {
    console.error("\n❌ E2E Browser Test Failed:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2E();
