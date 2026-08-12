export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex items-center gap-3 text-sm text-mv-ink-soft">
        <span className="w-4 h-4 rounded-full border-2 border-mv-green border-t-transparent animate-spin" />
        Chargement…
      </div>
    </div>
  );
}
