import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
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
  await page.getByRole('navigation', { name: 'Main navigation', exact: true })
    .getByRole('link', { name, exact: true }).click();
}

async function api(path, body) {
  let options = {};
  if (body) {
    const csrf = await (await page.request.get(`${backend}/auth/csrf`)).json();
    options = { data: body, headers: { 'X-CSRF-TOKEN': csrf.token } };
  }
  const response = body
    ? await page.request.post(backend + path, options)
    : await page.request.get(backend + path);
  assert.equal(response.ok(), true, `${path}: ${response.status()} ${await response.text()}`);
  return response;
}

async function noOverflow() {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  assert.equal(overflow, false, 'Page must not overflow horizontally');
}

try {
  let seeded = false;
  for (let attempt = 0; attempt < 20; attempt++) {
    const csrf = await (await page.request.get(`${backend}/auth/csrf`)).json();
    const response = await page.request.post(`${backend}/auth/login`, {
      data: { username: 'employee', password: 'Employee@123' },
      headers: { 'X-CSRF-TOKEN': csrf.token }
    });
    if (response.ok()) { seeded = true; break; }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.equal(seeded, true, 'Demo account did not become ready');
  await api('/auth/logout', {});

  await login('employee', 'Employee@123');
  await page.getByRole('heading', { name: 'My dashboard', exact: true }).waitFor();
  await page.getByText('My details', { exact: true }).waitFor();
  await navigate('Attendance');
  await page.getByRole('button', { name: 'Check in', exact: true }).click();
  await page.getByText('Checked in successfully', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Check out', exact: true }).click();
  await page.getByText('Checked out successfully', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();

  await login('admin', 'Admin@123');
  await navigate('Employees');
  await page.getByRole('heading', { name: 'Employees', exact: true }).waitFor();
  const employees = await (await api('/admin/employees')).json();
  const employee = employees.content.find(item => item.employeeCode === 'EMP-001');
  await page.getByRole('link', { name: `Open ${employee.fullName} profile` }).click();
  await page.getByRole('heading', { name: employee.fullName, exact: true }).waitFor();
  await navigate('Dashboard');
  await page.getByRole('heading', { name: 'Quick actions', exact: true }).waitFor();
  await noOverflow();

  await page.getByLabel('Interface language').selectOption('ta');
  await page.getByRole('heading', { name: 'முகப்பு', exact: true }).waitFor();
  await page.getByLabel('Interface language').selectOption('en');

  await page.route('**/api/workspace/assistant/status', route =>
    route.fulfill({ json: { configured: true } }));
  await page.route('**/api/workspace/assistant', route =>
    route.fulfill({ json: { answer: '**Attendance overview**\n\nYou have one recorded present day.' } }));
  await navigate('AI assistant');
  await page.getByRole('heading', { name: 'What can I help you with?' }).waitFor();
  await page.getByLabel('Message the assistant').fill('Summarize my attendance.');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await page.getByRole('button', { name: 'Speak answer', exact: true }).waitFor();

  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Employees', exact: true }).click();
  await page.getByRole('heading', { name: 'Employees', exact: true }).waitFor();
  await noOverflow();

  assert.deepEqual(errors, []);
  console.log('PASS: login, employee profile, attendance, employee management, language, AI and responsive navigation.');
} finally {
  await browser.close();
}
