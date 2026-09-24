import { useI18n } from '../i18n/I18nContext';
import type { RelatedTaskMode } from '../lib/deletion';

export interface PendingDelete {
  kind: 'member' | 'project';
  id: string;
  name: string;
  relatedTaskCount: number;
}

/** Asks what to do with a member's/project's tasks before deleting it. */
export function DeleteChoiceDialog({
  pending,
  onChoose,
  onCancel,
}: {
  pending: PendingDelete;
  onChoose: (mode: RelatedTaskMode) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl" role="dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-slate-900">
          {t(pending.kind === 'member' ? 'deleteDialogMemberTitle' : 'deleteDialogProjectTitle', { name: pending.name })}
        </h3>
        <p className="mt-2 text-sm text-slate-600">{t('deleteDialogBody', { n: pending.relatedTaskCount })}</p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onChoose('keep')}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t(pending.kind === 'member' ? 'deleteKeepTasksMember' : 'deleteKeepTasksProject')}
          </button>
          <button
            type="button"
            onClick={() => onChoose('delete')}
            className="rounded-md border border-rose-300 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            {t('deleteAlsoTasks')}
          </button>
          <button type="button" onClick={onCancel} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800">
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
