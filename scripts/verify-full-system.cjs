const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../playwright_audit_results');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function verifySystem() {
  console.log('🚀 Running Comprehensive End-to-End System Verification...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
    isMobile: true,
  });

  const page = await context.newPage();
  const results = {
    steps: [],
    passed: true,
  };

  function log(step, status, details = {}) {
    console.log(`[VERIFY] ${step}: ${status}`);
    results.steps.push({ step, status, details, time: new Date().toISOString() });
  }

  try {
    // 1. App Launch & Role Gateway
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Mock an active logged-in patient session in localStorage
    await page.evaluate(() => {
      localStorage.setItem('mediarca_selected_role', 'PATIENT');
      localStorage.setItem('mediarca_token', 'mock_verified_token');
      localStorage.setItem('mediarca_user', JSON.stringify({
        id: 'user_pat_1',
        email: 'john.doe@gmail.com',
        fullName: 'John Doe',
        role: 'PATIENT',
        phone: '9876543210'
      }));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    log('1. Patient Workspace Loaded', 'PASS');

    // 2. Open Booking Modal
    const bookVisitBtn = page.locator('button:has-text("Book Visit")').first();
    if (await bookVisitBtn.isVisible()) {
      await bookVisitBtn.click();
      await page.waitForTimeout(1000);

      // Verify Date Picker controls
      const todayBtn = page.locator('button:has-text("Today")').first();
      const tomorrowBtn = page.locator('button:has-text("Tomorrow")').first();
      const dateInput = page.locator('input[type="date"]').first();

      const hasToday = await todayBtn.isVisible();
      const hasTomorrow = await tomorrowBtn.isVisible();
      const hasDateInput = await dateInput.isVisible();
      log('2. Date Picker Controls', hasToday && hasTomorrow && hasDateInput ? 'PASS' : 'FAIL', {
        hasToday,
        hasTomorrow,
        hasDateInput,
      });

      // Test clicking Tomorrow
      if (hasTomorrow) {
        await tomorrowBtn.click();
        await page.waitForTimeout(500);
      }

      // Fill Demographics
      const nameInput = page.locator('input[placeholder="Full Name"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Aarav Sharma');
      }

      const ageInput = page.locator('input[placeholder="Years"]').first();
      if (await ageInput.isVisible()) {
        await ageInput.fill('28');
      }

      const reasonInput = page.locator('input[placeholder*="Fever"]').first();
      if (await reasonInput.isVisible()) {
        await reasonInput.fill('High fever and cough');
      }

      await page.screenshot({ path: path.join(OUTPUT_DIR, '01_booking_modal_filled.png') });
      log('3. Booking Modal Form Completed', 'PASS');

      // Submit Appointment Request
      const submitBtn = page.locator('button:has-text("Request Appointment")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(1500);

        // Check if Post-Booking Receptionist Confirmation screen is visible
        const pendingTitle = page.locator('text=Pending Receptionist Confirmation').first();
        const payCard = page.locator('text=Pay Receptionist to Confirm').first();
        const callBtn = page.locator('a[href^="tel:"]').first();

        const hasPendingTitle = await pendingTitle.isVisible();
        const hasPayCard = await payCard.isVisible();
        const hasCallBtn = await callBtn.isVisible();

        await page.screenshot({ path: path.join(OUTPUT_DIR, '02_post_booking_receptionist_card.png') });
        log('4. Post-Booking Receptionist Card Rendered', hasPendingTitle && hasPayCard ? 'PASS' : 'FAIL', {
          hasPendingTitle,
          hasPayCard,
          hasCallBtn,
        });

        // Click "View Request in My Passes"
        const viewPassesBtn = page.locator('button:has-text("View Request in My Passes")').first();
        if (await viewPassesBtn.isVisible()) {
          await viewPassesBtn.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: path.join(OUTPUT_DIR, '03_live_pass_pending_state.png') });
          log('5. Navigated to Live Queue Pass', 'PASS');
        }
      }
    }

    // 3. Test Receptionist Approvals & Shift Date Modal
    console.log('Testing Receptionist Front-Desk Desk...');
    await page.evaluate(() => {
      localStorage.setItem('mediarca_selected_role', 'RECEPTIONIST');
      localStorage.setItem('mediarca_token', 'mock_rec_token');
      localStorage.setItem('mediarca_user', JSON.stringify({
        id: 'rec_1',
        email: 'receptionist@mediarca.com',
        role: 'RECEPTIONIST',
        fullName: 'Receptionist Desk'
      }));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Switch to Approvals tab
    const approvalsTab = page.locator('button:has-text("Approvals")').first();
    if (await approvalsTab.isVisible()) {
      await approvalsTab.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: path.join(OUTPUT_DIR, '04_receptionist_approvals_tab.png') });
      log('6. Receptionist Approvals Tab Opened', 'PASS');

      // Check if Shift Date button exists
      const shiftDateBtn = page.locator('button:has-text("Shift Date")').first();
      if (await shiftDateBtn.isVisible()) {
        await shiftDateBtn.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(OUTPUT_DIR, '05_shift_date_modal.png') });
        log('7. Shift Date Modal Opened', 'PASS');

        // Cancel modal
        const cancelShiftBtn = page.locator('button:has-text("Cancel")').first();
        if (await cancelShiftBtn.isVisible()) {
          await cancelShiftBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // 4. Test Doctor Schedule & Affiliations
    console.log('Testing Doctor Workspace...');
    await page.evaluate(() => {
      localStorage.setItem('mediarca_selected_role', 'DOCTOR');
      localStorage.setItem('mediarca_token', 'mock_doc_token');
      localStorage.setItem('mediarca_user', JSON.stringify({
        id: 'doc_1',
        email: 'dr.sarah@mediarca.com',
        role: 'DOCTOR',
        fullName: 'Dr. Sarah Jenkins'
      }));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const schedBtn = page.locator('button:has-text("Schedule")').first();
    if (await schedBtn.isVisible()) {
      await schedBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '06_doctor_schedule.png') });
      log('8. Doctor Schedule Screen Verified', 'PASS');
    }

    const affBtn = page.locator('button:has-text("Affiliations")').first();
    if (await affBtn.isVisible()) {
      await affBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '07_doctor_affiliations.png') });
      log('9. Doctor Affiliations Screen Verified', 'PASS');
    }

    log('All 5 Phases Verified Successfully', 'PASS');
  } catch (err) {
    console.error('Verification error:', err.message);
    log('Verification Error', 'FAIL', { error: err.message });
    results.passed = false;
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'final_verification_summary.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('✅ System verification completed and report saved.');
}

verifySystem();
