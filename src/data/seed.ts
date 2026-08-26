import type { GlossaryTerm, Member, Task } from '../types';

// Sample data only — fictional names, for demonstrating the app on first run.
export const seedMembers: Member[] = [
  {
    id: 'seed-member-1',
    name: '田中 太郎',
    location: 'Tokyo, Japan',
    timezone: 'Asia/Tokyo',
    workStart: '09:00',
    workEnd: '18:00',
    languages: ['ja'],
  },
  {
    id: 'seed-member-2',
    name: 'Nguyen Van A',
    location: 'Hanoi, Vietnam',
    timezone: 'Asia/Ho_Chi_Minh',
    workStart: '08:00',
    workEnd: '17:00',
    languages: ['vi', 'en'],
  },
  {
    id: 'seed-member-3',
    name: 'Maria Santos',
    location: 'Manila, Philippines',
    timezone: 'Asia/Manila',
    workStart: '09:00',
    workEnd: '18:00',
    languages: ['en'],
  },
];

export const seedTasks: Task[] = [
  {
    id: 'seed-task-1',
    titleJa: 'ログイン画面のAPI連携',
    titleEn: 'Wire up login screen to API',
    descriptionJa: '既存のモックデータをバックエンドAPIに置き換える。エラー時のメッセージ表示も対応すること。',
    descriptionEn: 'Replace the mocked data with real backend API calls. Also handle error message display.',
    assigneeId: 'seed-member-2',
    dueDate: null,
    status: 'in-progress',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-task-2',
    titleJa: '週次進捗レポートのフォーマット確認',
    titleEn: 'Review weekly progress report format',
    descriptionJa: '日本側と合意したテンプレートに沿っているかチームでレビューする。',
    descriptionEn: 'Review whether the report follows the template agreed with the Japan side.',
    assigneeId: null,
    dueDate: null,
    status: 'todo',
    createdAt: new Date().toISOString(),
  },
];

export const seedGlossary: GlossaryTerm[] = [
  { id: 'seed-term-1', termJa: '手戻り', termEn: 'rework', note: '仕様誤解などによるやり直し作業' },
  { id: 'seed-term-2', termJa: '要件定義', termEn: 'requirements definition', note: '' },
  { id: 'seed-term-3', termJa: '結合テスト', termEn: 'integration testing', note: '' },
];
