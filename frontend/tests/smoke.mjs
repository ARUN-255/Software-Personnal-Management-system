import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const base = 'http://127.0.0.1:5173';
const backend = 'http://127.0.0.1:8080/api';

async function login(username, password) {
  await page.goto(`${base}/login`);
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('link', { name: 'People workspace' }).waitFor();
  await page.getByRole('link', { name: 'People workspace' }).click();
  await page.getByText('Recorded attendance', { exact: true }).waitFor();
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
try {
  await login('employee', 'Employee@123');
  await page.getByRole('button', { name: 'Check in', exact: true }).click();
  await page.getByText('Checked in successfully', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Check out', exact: true }).click();
  await page.getByText('Checked out successfully', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Leave & corrections', exact: true }).click();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await page.getByLabel('Start date', { exact: true }).fill(tomorrow);
  await page.getByLabel('End date', { exact: true }).fill(tomorrow);
  await page.getByLabel('Reason', { exact: true }).fill('Browser smoke test leave');
  await page.getByRole('button', { name: 'Submit request', exact: true }).click();
  await page.getByText('Request submitted for review', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'AI assistant', exact: true }).click();
  await page.getByText('AI is not connected yet.', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();

  await login('admin', 'Admin@123');
  await page.getByRole('button', { name: 'Review requests', exact: true }).click();
  await page.getByLabel('Review comment', { exact: true }).fill('Approved during browser test');
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await page.getByText('Request approved', { exact: true }).waitFor();
  const employees = await (await api('/admin/employees')).json();
  const employee = employees.content.find(e => e.employeeCode === 'EMP-001');
  const month = new Date().toISOString().slice(0, 7);
  await api(`/admin/employees/${employee.id}/payroll`, { payPeriod: `${month}-01`, basicPay: 30000, allowances: 2000, deductions: 1000, publish: true });
  const csv = await api(`/admin/reports/attendance.csv?month=${month}`);
  assert.match(await csv.text(), /EMP-001/);
  await page.getByRole('button', { name: 'Audit history', exact: true }).click();
  await page.getByRole('heading', { name: 'Recent audit history' }).waitFor();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();

  await login('employee', 'Employee@123');
  await page.getByRole('button', { name: 'Notifications', exact: true }).click();
  await page.getByText('Your payslip for', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Payslips', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PDF', exact: true }).click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /payslip.*\.pdf$/);
  assert.equal(await download.failure(), null);
  assert.deepEqual(errors, []);
  console.log('PASS: real browser login, CSRF, clock-in/out, leave approval, notifications, CSV, audit screen and payslip download.');
} finally {
  await browser.close();
}
