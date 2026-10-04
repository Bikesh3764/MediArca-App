const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../playwright_audit_results');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function deepCompare() {
  console.log('🚀 Running Deep Web vs Mobile Parity Audit via Playwright...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  const webContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const mobileContext = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
    isMobile: true,
  });

  const webPage = await webContext.newPage();
  const mobilePage = await mobileContext.newPage();

  const findings = {
    webPagesFound: [],
    mobileScreensAudited: [],
    featureGaps: [],
    screenshots: [],
  };

  try {
    // ---- 1. WEB APP DISCOVERY ----
    console.log('--- Auditing Web on http://localhost:5174 ---');
    await webPage.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 15000 }).catch(e => console.log('Web home load note:', e.message));
    await webPage.screenshot({ path: path.join(OUTPUT_DIR, 'web_01_home.png') });
    findings.screenshots.push('web_01_home.png');

    // Check Web Routes & Links
    const webLinks = await webPage.evaluate(() => {
      return Array.from(document.querySelectorAll('a, button')).map(el => ({
        tag: el.tagName,
        text: el.innerText.trim(),
        href: el.getAttribute('href') || ''
      })).filter(l => l.text.length > 0 && l.text.length < 50);
    });
    console.log(`Found ${webLinks.length} interactive elements on Web home.`);

    // Inspect Web Explore / Doctor listing
    console.log('Navigating to Web Doctors...');
    const doctorsLink = webPage.locator('text=Find Doctors, a[href*="doctor"], button:has-text("Doctor")').first();
    if (await doctorsLink.isVisible()) {
      await doctorsLink.click().catch(() => {});
      await webPage.waitForTimeout(1000);
      await webPage.screenshot({ path: path.join(OUTPUT_DIR, 'web_02_doctors_list.png') });
      findings.screenshots.push('web_02_doctors_list.png');
    }

    // Inspect Web Booking Modal / Page
    console.log('Attempting Web Book Appointment...');
    const bookBtn = webPage.locator('button:has-text("Book Appointment"), a:has-text("Book"), button:has-text("Book Visit")').first();
    if (await bookBtn.isVisible()) {
      await bookBtn.click().catch(() => {});
      await webPage.waitForTimeout(1000);
      await webPage.screenshot({ path: path.join(OUTPUT_DIR, 'web_03_booking_interface.png') });
      findings.screenshots.push('web_03_booking_interface.png');

      // Check fields in Web Booking
      const webBookingFields = await webPage.evaluate(() => {
        return {
          hasDateSelector: !!document.querySelector('input[type="date"], [data-testid*="date"], button:has-text("Today")'),
          dateQuickButtons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => ['Today', 'Tomorrow', 'Select Date'].some(d => t.includes(d))),
          shiftsFound: Array.from(document.querySelectorAll('*')).map(el => el.innerText).filter(t => t && (t.includes('Morning') || t.includes('Evening') || t.includes('Shift'))).slice(0, 5),
          clinicOptions: Array.from(document.querySelectorAll('select, [role="combobox"], [data-testid*="clinic"]')).map(el => el.innerText.slice(0, 100)),
          hasTokenPreview: Array.from(document.querySelectorAll('*')).some(el => el.innerText && el.innerText.includes('Estimated Token')),
          hasReceptionistPaymentNotice: Array.from(document.querySelectorAll('*')).some(el => el.innerText && (el.innerText.includes('Pay Receptionist') || el.innerText.includes('Counter') || el.innerText.includes('Confirm & Issue'))),
        };
      });
      console.log('Web Booking Interface Audit:', JSON.stringify(webBookingFields, null, 2));
      findings.webBookingFields = webBookingFields;
    }

    // Inspect Web Receptionist Dashboard
    console.log('Navigating to Web Receptionist Dashboard directly...');
    await webPage.goto('http://localhost:5174/receptionist', { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
    await webPage.waitForTimeout(1000);
    await webPage.screenshot({ path: path.join(OUTPUT_DIR, 'web_04_receptionist_desk.png') });
    findings.screenshots.push('web_04_receptionist_desk.png');

    const webReceptionistAudit = await webPage.evaluate(() => {
      return {
        title: document.title,
        heading: document.querySelector('h1, h2')?.innerText,
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean).slice(0, 15),
        hasIssueTokenBtn: Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Confirm & Issue') || b.innerText.includes('Issue Token')),
        hasWalkInBooking: Array.from(document.querySelectorAll('*')).some(el => el.innerText && el.innerText.includes('Walk-in Token')),
      };
    });
    console.log('Web Receptionist Audit:', JSON.stringify(webReceptionistAudit, null, 2));
    findings.webReceptionistAudit = webReceptionistAudit;

    // Inspect Web Doctor Dashboard
    console.log('Navigating to Web Doctor Dashboard directly...');
    await webPage.goto('http://localhost:5174/doctor', { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
    await webPage.waitForTimeout(1000);
    await webPage.screenshot({ path: path.join(OUTPUT_DIR, 'web_05_doctor_console.png') });
    findings.screenshots.push('web_05_doctor_console.png');

    // ---- 2. MOBILE APP AUDIT (http://localhost:5173) ----
    console.log('--- Auditing Mobile App on http://localhost:5173 ---');
    await mobilePage.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, 'mobile_01_gateway.png') });
    findings.screenshots.push('mobile_01_gateway.png');

    // Patient Role & Booking Modal
    const patBtn = mobilePage.locator('text=Patient').first();
    if (await patBtn.isVisible()) {
      await patBtn.click();
      await mobilePage.waitForTimeout(1000);
      await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, 'mobile_02_explore.png') });
      findings.screenshots.push('mobile_02_explore.png');

      const bookVisitBtn = mobilePage.locator('button:has-text("Book Visit")').first();
      if (await bookVisitBtn.isVisible()) {
        await bookVisitBtn.click();
        await mobilePage.waitForTimeout(1000);
        await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, 'mobile_03_booking_modal.png') });
        findings.screenshots.push('mobile_03_booking_modal.png');

        const mobileBookingAudit = await mobilePage.evaluate(() => {
          return {
            hasDateInput: !!document.querySelector('input[type="date"]'),
            dateButtons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => ['Today', 'Tomorrow'].includes(t)),
            shiftsFound: Array.from(document.querySelectorAll('button, div')).map(el => el.innerText).filter(t => t && (t.includes('Morning') || t.includes('Evening') || t.includes('Shift'))).slice(0, 5),
            clinicSelectorExists: Array.from(document.querySelectorAll('select, [data-testid*="clinic"], button')).some(el => el.innerText && el.innerText.includes('Clinic')),
            hasQueuePreview: Array.from(document.querySelectorAll('*')).some(el => el.innerText && el.innerText.includes('Estimated Token')),
          };
        });
        console.log('Mobile Booking Audit:', JSON.stringify(mobileBookingAudit, null, 2));
        findings.mobileBookingAudit = mobileBookingAudit;
      }
    }

    // Mobile Receptionist Screen
    console.log('Inspecting Mobile Receptionist...');
    await mobilePage.evaluate(() => {
      localStorage.setItem('mediarca_selected_role', 'RECEPTIONIST');
      localStorage.setItem('mediarca_token', 'mock_token_rec');
      localStorage.setItem('mediarca_user', JSON.stringify({
        id: 'rec_1',
        email: 'receptionist@mediarca.com',
        role: 'RECEPTIONIST',
        fullName: 'Receptionist Desk'
      }));
    });
    await mobilePage.reload({ waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, 'mobile_04_receptionist.png') });
    findings.screenshots.push('mobile_04_receptionist.png');

    const mobileReceptionistAudit = await mobilePage.evaluate(() => {
      return {
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean).slice(0, 15),
        hasConfirmFeeButton: Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Confirm & Issue Token') || b.innerText.includes('₹')),
        tabs: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => ['Walk-In', 'Queue', 'Approvals', 'Cabin'].some(x => t.includes(x))),
      };
    });
    console.log('Mobile Receptionist Audit:', JSON.stringify(mobileReceptionistAudit, null, 2));
    findings.mobileReceptionistAudit = mobileReceptionistAudit;

  } catch (err) {
    console.error('Audit encountered error:', err.message);
    findings.error = err.message;
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'playwright_comparison_report.json'), JSON.stringify(findings, null, 2));
  console.log('✅ Deep comparison completed and saved to playwright_comparison_report.json');
}

deepCompare();
