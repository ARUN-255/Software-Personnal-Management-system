import { AlertCircle, Inbox } from 'lucide-react';
export default function PageState({
  loading,
  error,
  retry,
  title = 'Nothing here yet',
  children
}) {
  if (loading) return <div className="page-state" role="status"><span className="spinner" />Loading…</div>;
  if (error) return <div className="page-state" role="alert">
    <AlertCircle />
    <h2>We couldn't load this page</h2>
    <p>
      {error}
    </p>
    {retry && <button className="btn secondary" onClick={retry}>Try again</button>}
  </div>;
  return <div className="page-state">
    <Inbox />
    <h2>
      {title}
    </h2>
    {children && <p>
      {children}
    </p>}
  </div>;
}
