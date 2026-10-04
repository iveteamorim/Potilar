function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatListingDateLabel(createdAt?: string, updatedAt?: string, now = new Date()) {
  const dates = [updatedAt, createdAt]
    .map((value) => (value ? new Date(value) : null))
    .filter((date): date is Date => Boolean(date && !Number.isNaN(date.getTime())))
    .sort((left, right) => right.getTime() - left.getTime());

  const date = dates[0];
  if (!date) return null;

  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (days <= 0) return 'Atualizado hoje';
  if (days === 1) return 'Atualizado há 1 dia';
  if (days < 7) return `Atualizado há ${days} dias`;

  const weeks = Math.floor(days / 7);
  if (days < 30) return `Atualizado há ${weeks} semana${weeks === 1 ? '' : 's'}`;

  const months = Math.floor(days / 30);
  if (days < 365) return `Atualizado há ${months} ${months === 1 ? 'mês' : 'meses'}`;

  const years = Math.floor(days / 365);
  return `Atualizado há ${years} ${years === 1 ? 'ano' : 'anos'}`;
}
