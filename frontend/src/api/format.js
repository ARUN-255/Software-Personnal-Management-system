export const today = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata'
}).format(new Date());
export const currentMonth = () => today().slice(0, 7);
export const money = value => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
}).format(value || 0);
export const clockTime = value => value ? value.slice(11, 16) : '—';
export const monthLabel = value => new Date(`${value}-01T12:00:00`).toLocaleDateString('en-IN', {
  month: 'long',
  year: 'numeric'
});
export const humanStatus = value => (value || 'Unknown').toLowerCase().replaceAll('_', ' ');
