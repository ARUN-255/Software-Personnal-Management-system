export default function Topbar({
  title,
  subtitle,
  actions
}) {
  return <header className="page-heading">
    <div>
      <h1>
        {title}
      </h1>
      {subtitle && <p>
        {subtitle}
      </p>}
    </div>
    {actions && <div className="page-actions">
      {actions}
    </div>}
  </header>;
}
