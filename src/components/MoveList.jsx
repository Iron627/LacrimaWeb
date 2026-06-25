export function MoveList({ moves, latestPly = moves.length }) {
  const pairs = []
  for (let index = 0; index < moves.length; index += 2) {
    pairs.push({ number: index / 2 + 1, white: moves[index], black: moves[index + 1] })
  }

  return (
    <section className="panel move-list">
      <h2>Moves</h2>
      <ol>
        {pairs.map((pair) => (
          <li key={pair.number}>
            <span>{pair.number}.</span>
            <strong className={latestPly === pair.number * 2 - 1 ? 'latest-move' : ''}>{pair.white}</strong>
            <strong className={latestPly === pair.number * 2 ? 'latest-move' : ''}>{pair.black || ''}</strong>
          </li>
        ))}
      </ol>
    </section>
  )
}
