const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../playwright_audit_results');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runAudit() {
  console.log('🚀 Starting Comprehensive Playwright Audit...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 }, // Modern mobile viewport (e.g. Pixel 7 / iPhone 15 Pro)
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const auditLog = [];
  function log(msg) {
    console.log(`[AUDIT] ${msg}`);
    auditLog.push(msg);
  }

  try {
    // 1. App Launch & Role Gateway
    log('Step 1: Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_role_gateway.png') });
    log('Captured Role Gateway Screen screenshot');

    // 2. Select Patient Role
    log('Step 2: Selecting Patient role...');
    const patientBtn = page.locator('text=Patient').first();
    if (await patientBtn.isVisible()) {
      await patientBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_patient_explore.png') });
      log('Entered Patient Explore screen');
    }

    // 3. Inspect Doctor Details & Booking Modal
    log('Step 3: Clicking on first Doctor card / Book Visit button...');
    const bookVisitBtn = page.locator('button:has-text("Book Visit")').first();
    if (await bookVisitBtn.isVisible()) {
      await bookVisitBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_booking_modal_initial.png') });
      log('Captured Initial Booking Modal');

      // Check for Date picker inside Booking Modal
      const dateInput = page.locator('input[type="date"]');
      const hasDateInput = await dateInput.isVisible();
      log(`Booking Modal Date Input exists: ${hasDateInput}`);

      // Check for Shift buttons inside Booking Modal
      const shiftButtons = page.locator('text=Shift');
      const shiftCount = await shiftButtons.count();
      log(`Booking Modal Shift elements count: ${shiftCount}`);

      // Check for Clinic selector inside Booking Modal
      const clinicSelect = page.locator('text=Clinic');
      const hasClinic = await clinicSelect.count();
      log(`Booking Modal Clinic elements count: ${hasClinic}`);

      // Close modal
      const closeBtn = page.locator('button[aria-label="Close"], button:has(svg.lucide-x)').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // 4. Test 1-Click Demo Login as Doctor
    log('Step 4: Testing 1-Click Demo Doctor switch...');
    await page.evaluate(() => {
      localStorage.setItem('mediarca_selected_role', 'DOCTOR');
      localStorage.setItem('mediarca_token', 'mock_jwt_token_doctor');
      localStorage.setItem('mediarca_user', JSON.stringify({
        id: 'doc_1',
        email: 'dr.sarah@mediarca.com',
        role: 'DOCTOR',
        fullName: 'Dr. Sarah Jenkins'
      }));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_doctor_console.png') });
    log('Captured Doctor Console screen');

    // Doctor Schedule Tab
    const scheduleTab = page.locator('button:has-text("Schedule")').first();
    if (await scheduleTab.isVisible()) {
      await scheduleTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_doctor_schedule.png') });
      log('Captured Doctor Schedule screen');
    }

    // Doctor Affiliations Tab
    const affTab = page.locator('button:has-text("Affiliations")').first();
    if (await affTab.isVisible()) {
      await affTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_doctor_affiliations.png') });
      log('Captured Doctor Affiliations screen');
    }

    // 5. Test 1-Click Demo Login as Receptionist
    log('Step 5: Testing Receptionist desk...');
    await page.evaluate(() => {
      localStorage.setItem('mediarca_selected_role', 'RECEPTIONIST');
      localStorage.setItem('mediarca_token', 'mock_jwt_token_receptionist');
      localStorage.setItem('mediarca_user', JSON.stringify({
        id: 'rec_1',
        email: 'receptionist@mediarca.com',
        role: 'RECEPTIONIST',
        fullName: 'Clara Oswald'
      }));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_receptionist_desk.png') });
    log('Captured Receptionist Desk screen');

    // Receptionist Pending Approvals Tab
    const pendingTab = page.locator('button:has-text("Approvals")').first();
    if (await pendingTab.isVisible()) {
      await pendingTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_receptionist_pending_approvals.png') });
      log('Captured Receptionist Pending Approvals screen');
    }

    log('✅ Playwright audit finished successfully!');
  } catch (err) {
    log(`❌ Playwright audit error: ${err.message}`);
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'audit_report.json'),
    JSON.stringify(auditLog, null, 2)
  );
  console.log('Result written to playwright_audit_results/audit_report.json');
}

runAudit();
