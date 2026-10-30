import { useSyncExternalStore } from 'react'
import { subscribeLibrary, getLibrarySnapshot, refreshLibrary, importBrowserLibrary, downloadLibraryBackup, discardPendingChanges } from '@/lib/shared-library'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function SharedLibraryStatus() {
  const status = useSyncExternalStore(subscribeLibrary, getLibrarySnapshot)
  return <section className="mb-6 rounded-lg border border-border bg-card p-4 text-white" aria-label="Shared home library">
    <p className="font-medium">Shared home library</p>
    <p className="text-sm text-muted-foreground" role="status">
      {status.error ? 'The library is not fully synced.' : !status.ready ? 'Connecting to your home server…' : status.saving || status.pending ? 'Saving changes to your home server…' : 'Saved on your home server. Available to every computer using this app.'}
    </p>
    {status.error && <p role="alert" className="mt-2 text-sm text-red-300">{status.error}{status.pending > 0 && ` ${status.pending} change(s) are waiting in this browser tab. Keep it open until they are saved.`}</p>}
    <div className="mt-3 flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={status.saving} onClick={() => void refreshLibrary()}>Refresh / retry</Button>
      <Button variant="outline" size="sm" disabled={!status.ready || status.saving || status.pending > 0} onClick={() => {
        try { const count = importBrowserLibrary(); toast.info(count ? `${count} browser entries queued for upload. Check the save status above.` : 'No new browser entries to import.') }
        catch (error) { toast.error(error instanceof Error ? error.message : 'Could not import browser data') }
      }}>Import charts and readings from this browser</Button>
      <Button variant="outline" size="sm" onClick={downloadLibraryBackup}>Download backup</Button>
      {status.error && status.pending > 0 && <Button variant="outline" size="sm" disabled={status.saving} onClick={() => {
        if (window.confirm('Discard this tab’s unsaved changes and load the server library? Download a backup first if you want to keep them.')) {
          void discardPendingChanges().catch(error => toast.error(error.message))
        }
      }}>Discard pending changes</Button>}
    </div>
    <p className="mt-2 text-xs text-muted-foreground">To bring over existing work, import once from each browser where you created charts. Existing shared entries are kept; browser originals remain untouched.</p>
  </section>
}
