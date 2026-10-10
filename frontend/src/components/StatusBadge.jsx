import { humanStatus } from '../api/format';
export default function StatusBadge({
  value
}) {
  const positive = ['ACTIVE', 'PRESENT', 'PUBLISHED', 'APPROVED'].includes(value);
  const negative = ['INACTIVE', 'ABSENT', 'REJECTED'].includes(value);
  return <span className={`badge ${positive ? 'positive' : negative ? 'negative' : 'neutral'}`}>
    <span />
    {humanStatus(value)}
  </span>;
}
