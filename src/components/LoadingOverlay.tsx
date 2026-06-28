export function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 bg-ink/80 flex items-center justify-center z-50">
      <div className="bg-surface rounded-2xl p-8 text-center max-w-xs mx-4">
        <div className="w-10 h-10 border-2 border-vermillion border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-ui text-fg text-sm">{message}</p>
      </div>
    </div>
  )
}
