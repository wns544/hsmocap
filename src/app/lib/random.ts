export function shuffleArray<T>(items: T[]): T[] {
  const next = [...items];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [next[i], next[randomIndex]] = [next[randomIndex], next[i]];
  }

  return next;
}
