import { useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';

const UNDO_WINDOW_MS = 8000;

export interface UndoAction {
  key: number;
  message: string;
  restore: () => void;
}

export function UndoToast({ action, onDismiss }: { action: UndoAction; onDismiss: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    const id = window.setTimeout(onDismiss, UNDO_WINDOW_MS);
    return () => window.clearTimeout(id);
  }, [action.key, onDismiss]);

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4" role="status">
      <div className="flex max-w-lg items-center gap-4 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
        <span className="min-w-0">{action.message}</span>
        <button
          type="button"
          onClick={() => {
            action.restore();
            onDismiss();
          }}
          className="shrink-0 font-semibold text-amber-300 hover:text-amber-200"
        >
          {t('undoAction')}
        </button>
        <button type="button" onClick={onDismiss} aria-label={t('close')} className="shrink-0 text-slate-400 hover:text-white">
          ×
        </button>
      </div>
    </div>
  );
}
