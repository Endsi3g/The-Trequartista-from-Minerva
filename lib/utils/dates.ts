// Monday of the ISO week containing `d`, as YYYY-MM-DD. Shared by
// everything that keys a record to "this week" (Coach Minerva's weekly
// check-in cron, its admin review, and the reply handler that matches a
// chat message back to the pending weekly prompt) so they always agree on
// which week a given date belongs to.
export function getIsoWeekStart(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7; // Sunday -> 7
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  return date.toISOString().slice(0, 10);
}
