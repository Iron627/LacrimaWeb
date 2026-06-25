export function UciConsole({ lines }) {
  return (
    <section className="panel uci-console">
      <h2>UCI</h2>
      <pre>
        {lines.length ? lines.slice(-80).join('\n') : 'Lacrima output will appear here.'}
      </pre>
    </section>
  )
}
