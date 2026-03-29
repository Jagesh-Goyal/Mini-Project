export default function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="card">
      {title ? <h3 className="mb-3 text-lg font-semibold">{title}</h3> : null}
      {children}
    </section>
  );
}
