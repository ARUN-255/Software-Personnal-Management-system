export default function Modal({
  title,
  children,
  onClose
}) {
  return <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="modal">
      <header>
        <h2>
          {title}
        </h2>
        <button onClick={onClose}>×</button>
      </header>
      {children}
    </section>
  </div>;
}
