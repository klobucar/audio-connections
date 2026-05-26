import { useCallback, useEffect, useState } from 'react';
import { applyBackup, collectBackup } from '../backup';
import { decodeBackup, encodeBackup } from '../transfer';

interface SettingsModalProps {
  onClose: () => void;
}

type ExportState = 'idle' | 'copied' | 'failed';
type ImportPhase =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'confirm'; incomingCount: number; b64: string };

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [importText, setImportText] = useState('');
  const [importPhase, setImportPhase] = useState<ImportPhase>({ kind: 'idle' });

  const records = collectBackup();
  const exportB64 = encodeBackup(records);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportB64);
      setExportState('copied');
      setTimeout(() => setExportState('idle'), 1500);
    } catch {
      setExportState('failed');
    }
  }, [exportB64]);

  const handleImport = useCallback(() => {
    const result = decodeBackup(importText);
    if (!result.ok) {
      setImportPhase({ kind: 'error', message: result.error });
      return;
    }
    setImportPhase({
      kind: 'confirm',
      incomingCount: result.envelope.days.length,
      b64: importText,
    });
  }, [importText]);

  const handleConfirm = useCallback(() => {
    if (importPhase.kind !== 'confirm') return;
    const result = decodeBackup(importPhase.b64);
    if (!result.ok) {
      setImportPhase({ kind: 'error', message: result.error });
      return;
    }
    applyBackup(result.envelope.days);
    // Reload so per-day status, current day, and the session for the
    // active day all reseed cleanly from the new localStorage state.
    window.location.reload();
  }, [importPhase]);

  return (
    <div className="settings-overlay" data-testid="settings-modal" role="dialog" aria-modal="true">
      <div className="settings-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="settings-card">
        <button
          type="button"
          className="settings-close"
          onClick={onClose}
          aria-label="Close settings"
        >
          ×
        </button>
        <h2 className="settings-title">Settings</h2>

        <section className="settings-section">
          <h3>Export</h3>
          <p className="settings-hint">
            {records.length === 0
              ? 'No finished days yet — nothing to back up.'
              : `Backs up your ${records.length} finished ${records.length === 1 ? 'day' : 'days'} as a single string. Paste it on another device to restore.`}
          </p>
          <button
            type="button"
            className="settings-btn"
            onClick={handleCopy}
            disabled={records.length === 0}
            data-testid="settings-export"
          >
            {exportState === 'copied' ? 'Copied!' : exportState === 'failed' ? 'Copy failed' : 'Copy backup'}
          </button>
        </section>

        <section className="settings-section">
          <h3>Import</h3>
          <p className="settings-hint">
            Paste a backup string. This replaces all your finished days on this device.
          </p>
          <textarea
            className="settings-textarea"
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value);
              if (importPhase.kind !== 'idle') setImportPhase({ kind: 'idle' });
            }}
            placeholder="Paste backup string here"
            spellCheck={false}
            data-testid="settings-import-input"
          />
          {importPhase.kind === 'error' && (
            <p className="settings-error" data-testid="settings-import-error">
              {importPhase.message}
            </p>
          )}
          {importPhase.kind === 'confirm' ? (
            <div className="settings-confirm" data-testid="settings-import-confirm">
              <p>
                Replace your {records.length} finished{' '}
                {records.length === 1 ? 'day' : 'days'} with{' '}
                {importPhase.incomingCount} from this backup?
              </p>
              <div className="settings-confirm-row">
                <button
                  type="button"
                  className="settings-btn settings-btn--primary"
                  onClick={handleConfirm}
                  data-testid="settings-import-confirm-yes"
                >
                  Replace
                </button>
                <button
                  type="button"
                  className="settings-btn"
                  onClick={() => setImportPhase({ kind: 'idle' })}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="settings-btn"
              onClick={handleImport}
              disabled={!importText.trim()}
              data-testid="settings-import-go"
            >
              Import
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
