//Date formated
export const formatDate = (stringDate) => {
    const date = new Date(stringDate);
    const dateComplete = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Paris'
    }).format(date);

    const hourComplete = new Intl.DateTimeFormat('fr-FR', {
      hour: "numeric",
      minute: "numeric",
      timeZone: 'Europe/Paris'
    }).format(date);

    return (`${dateComplete} à ${hourComplete}`)
}