import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => { errors.push(error.message); console.error('BROWSER_ERROR:', error.message); });
const base = 'http://127.0.0.1:5173';
const backend = 'http://127.0.0.1:8080/api';

async function login(username, password) {
  await page.goto(`${base}/login`);
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).waitFor();
}
async function navigate(name) {
  await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name, exact: true }).click();
}
async function api(path, body) {
  let options = {};
  if (body) {
    const csrf = await (await page.request.get(`${backend}/auth/csrf`)).json();
    options = { data: body, headers: { 'X-CSRF-TOKEN': csrf.token } };
  }
  const response = body ? await page.request.post(backend + path, options) : await page.request.get(backend + path);
  assert.equal(response.ok(), true, `${path}: ${response.status()} ${await response.text()}`);
  return response;
}
async function noOverflow() {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  assert.equal(overflow, false, 'Page must not overflow horizontally');
}
try {
  // HTTP starts before Spring's demo-data runner finishes. Wait for its account,
  // then sign out so the actual UI sign-in remains part of the test.
  let seeded = false;
  for (let attempt = 0; attempt < 20; attempt++) {
    const csrf = await (await page.request.get(`${backend}/auth/csrf`)).json();
    const response = await page.request.post(`${backend}/auth/login`, {
      data: { username: 'employee', password: 'Employee@123' },
      headers: { 'X-CSRF-TOKEN': csrf.token }
    });
    if (response.ok()) { seeded = true; break; }
    assert.equal(response.status(), 401, 'Unexpected account readiness response');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.equal(seeded, true, 'Demo account did not become ready');
  await api('/auth/logout', {});
  await login('employee', 'Employee@123');
  await navigate('Attendance');
  await page.getByRole('button', { name: 'Check in', exact: true }).click();
  await page.getByText('Checked in successfully', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Check out', exact: true }).click();
  await page.getByText('Checked out successfully', { exact: true }).waitFor();
  await navigate('Leave & requests');
  await page.getByRole('button', { name: 'New request', exact: true }).click();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await page.getByLabel('Start date', { exact: true }).fill(tomorrow);
  await page.getByLabel('End date', { exact: true }).fill(tomorrow);
  await page.getByLabel('Reason', { exact: true }).fill('Browser smoke test leave');
  await page.getByRole('button', { name: 'Submit request', exact: true }).click();
  await page.getByText('Request submitted for review', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();

  await login('admin', 'Admin@123');
  await navigate('Leave & requests');
  await page.getByRole('button', { name: 'Review request', exact: true }).click();
  await page.getByLabel('Review comment', { exact: true }).fill('Approved during browser test');
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await page.getByText('Request approved', { exact: true }).waitFor();
  const employees = await (await api('/admin/employees')).json();
  const employee = employees.content.find(e => e.employeeCode === 'EMP-001');
  const month = new Date().toISOString().slice(0, 7);
  await navigate('Payroll');
  await page.getByLabel('Choose employee', { exact: true }).selectOption(employee.id);
  await page.getByRole('button', { name: 'Add / update payroll', exact: true }).click();
  await page.getByLabel('Basic pay (₹)', { exact: true }).fill('30000');
  await page.getByLabel('Allowances (₹)', { exact: true }).fill('2000');
  await page.getByLabel('Deductions (₹)', { exact: true }).fill('1000');
  await page.getByLabel('Publish payslip for the employee').check();
  await page.getByRole('button', { name: 'Save payroll', exact: true }).click();
  await page.getByText('Payroll saved', { exact: true }).waitFor();
  const csv = await api(`/admin/reports/attendance.csv?month=${month}`);
  assert.match(await csv.text(), /EMP-001/);
  await page.getByRole('link', { name: 'Audit history', exact: true }).click();
  await page.getByRole('heading', { name: 'Audit history', exact: true }).waitFor();

  // Seed test-only people to exercise pagination beyond the first 12 records.
  const departments = await (await api('/admin/departments')).json();
  const designations = await (await api('/admin/designations')).json();
  for (let index = 2; index <= 14; index++) {
    await api('/admin/employees', { employeeCode: `EMP-${String(index).padStart(3, '0')}`, username: `test-employee-${index}`, temporaryPassword: 'Test-password-123', fullName: `Team Member ${index}`, email: `member${index}@example.com`, departmentId: departments[0].id, designationId: designations[0].id, joiningDate: `${month}-01` });
  }
  await navigate('Employees');
  await page.getByText('14 employees', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByText('Page 2 of 2', { exact: true }).waitFor();
  await page.getByLabel('Search employees', { exact: true }).fill('EMP-001');
  await page.getByText('1 employees', { exact: true }).waitFor();
  await page.getByRole('link', { name: `Open ${employee.fullName} profile` }).click();
  await page.getByRole('heading', { name: employee.fullName, exact: true }).waitFor();
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  await page.getByLabel('Phone', { exact: true }).fill('9000000000');
  await page.getByRole('button', { name: 'Save employee', exact: true }).click();
  await page.getByText('Employee details saved', { exact: true }).waitFor();
  await navigate('Dashboard');
  await page.getByRole('heading', { name: 'Attendance overview' }).waitFor();
  await noOverflow();
  console.log('UI_PREVIEW_DASHBOARD=' + (await page.screenshot({ type: 'jpeg', quality: 55 })).toString('base64'));
  await page.getByLabel('Interface language').selectOption('ta');
  await page.getByRole('heading', { name: 'முகப்பு', exact: true }).waitFor();
  assert.equal(await page.locator('.desktop-sidebar').evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(233, 248, 238)');
  await page.getByLabel('Interface language').selectOption('en');
  await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor();

  // Deterministic UI-only model response: no cloud credentials or live AI call in CI.
  await page.route('**/api/workspace/assistant/status', route => route.fulfill({ json: { configured: true } }));
  const conversations = [];
  await page.route('**/api/workspace/assistant', async route => {
    conversations.push(route.request().postDataJSON());
    await route.fulfill({ json: { answer: '**Attendance overview**\n\nThere is one recorded present day this month.\n\n- Present: 1\n- Absent: 0\n\nMissing entries are not automatically counted as absences.' } });
  });
  await navigate('AI assistant');
  await page.getByRole('heading', { name: 'What can I help you with?' }).waitFor();
  await page.evaluate(() => {
    const MockSpeechRecognition = class {
      start() {
        this.onstart?.();
        this.onresult?.({ results: [{ 0: { transcript: 'voice attendance question' } }] });
        this.onend?.();
      }
      stop() { this.onend?.(); }
      abort() { this.onend?.(); }
    };
    window.SpeechRecognition = MockSpeechRecognition;
    window.webkitSpeechRecognition = MockSpeechRecognition;
  });
  await page.getByRole('button', { name: 'Start voice input' }).click();
  await page.waitForFunction(() => document.querySelector('#chat-message')?.value === 'voice attendance question');
  assert.equal(await page.getByLabel('Message the assistant').inputValue(), 'voice attendance question');
  await page.getByLabel('Message the assistant').fill('');
  console.log('UI_PREVIEW_CHAT=' + (await page.screenshot({ type: 'jpeg', quality: 55 })).toString('base64'));
  await page.getByLabel('Message the assistant').fill('Summarize attendance this month.');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await page.getByRole('button', { name: 'Copy answer', exact: true }).waitFor();
  await page.getByLabel('Interface language').selectOption('ta');
  await page.getByRole('link', { name: 'AI உதவியாளர்', exact: true }).waitFor();
  await page.getByLabel('Message the assistant').fill('Explain the missing entries.');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.chat-message.assistant').length === 2);
  assert.equal(conversations[1].history.length, 2);
  assert.deepEqual(conversations[1].history.map(turn => turn.role), ['user', 'model']);
  assert.equal(conversations[1].language, 'ta');
  assert.equal(await page.locator('.answer-text strong').first().textContent(), 'Attendance overview');
  await page.getByLabel('Interface language').selectOption('en');
  await page.getByRole('button', { name: 'New chat', exact: true }).click();
  await page.getByRole('heading', { name: 'What can I help you with?' }).waitFor();

  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  console.log('UI_PREVIEW_MOBILE=' + (await page.screenshot({ type: 'jpeg', quality: 55 })).toString('base64'));
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Employees', exact: true }).click();
  await page.getByRole('heading', { name: 'Employees', exact: true }).waitFor();
  await noOverflow();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();

  await login('employee', 'Employee@123');
  await page.getByRole('navigation', { name: 'Account navigation' }).getByRole('link', { name: 'Notifications', exact: true }).click();
  await page.getByText('Your payslip for', { exact: false }).waitFor();
  await navigate('Payroll');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PDF', exact: true }).click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /payslip.*\.pdf$/);
  assert.equal(await download.failure(), null);
  await navigate('My documents');
  await page.getByRole('heading', { name: 'My documents', exact: true }).waitFor();
  await navigate('Reports');
  await page.getByText('Recorded attendance', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: desktop and mobile navigation, scrolling layout, pagination, employee editing, attendance, leave approval, payroll, notifications, PDF, safe markdown and multi-turn chat UI.');
} catch (error) {
  console.error('FAILED_PAGE:', page.url(), await page.locator('body').innerText());
  throw error;
} finally { await browser.close(); }
