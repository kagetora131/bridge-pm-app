import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';

const STEPS: Array<{ titleKey: TranslationKey; bodyKey: TranslationKey }> = [
  { titleKey: 'guideStep1Title', bodyKey: 'guideStep1Body' },
  { titleKey: 'guideStep2Title', bodyKey: 'guideStep2Body' },
  { titleKey: 'guideStep3Title', bodyKey: 'guideStep3Body' },
];

export function GuidedTour({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs font-medium text-slate-400">
          {t('guideStepIndicator')} {step + 1} / {STEPS.length}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-slate-900">{t(current.titleKey)}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(current.bodyKey)}</p>
        <div className="mt-6 flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600">
            {t('guideDone')}
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                {t('guidePrev')}
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                {t('guideNext')}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                {t('guideDone')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
