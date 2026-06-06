export function formatListingDateLabel(createdAt?: string, updatedAt?: string, now = new Date()) {
  const created = createdAt ? new Date(createdAt) : null;
  const updated = updatedAt ? new Date(updatedAt) : null;

  if (created && !Number.isNaN(created.getTime())) {
    const diffMs = now.getTime() - created.getTime();
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));

    if (diffMinutes < 60) {
      return `Publicado ha ${diffMinutes} minuto${diffMinutes === 1 ? '' : 's'}`;
    }

    if (diffMinutes < 60 * 24) {
      const diffHours = Math.floor(diffMinutes / 60);
      return `Publicado ha ${diffHours} hora${diffHours === 1 ? '' : 's'}`;
    }
  }

  if (updated && !Number.isNaN(updated.getTime())) {
    return `Atualizado em ${new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(updated)}`;
  }

  return null;
}
