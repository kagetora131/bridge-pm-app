import type { Assignment, GlossaryTerm, Member, Project, Task } from '../types';

// Sample data only — a fictional game-studio bridge-PM scenario, derived from
// docs/bridge_pm_dummy_data.json. Deliberately includes a location whose
// weekend isn't Sat/Sun (Dubai: Fri/Sat off, Sun a working day) and staffing
// allocations that push a couple of members over capacity, so the
// timezone/weekday and overload logic have something real to be tested against.

export const seedMembers: Member[] = [
  {
    id: 'st01', name: '佐藤 健太', role: '企画', location: 'Tokyo, Japan', timezone: 'Asia/Tokyo',
    workStart: '09:00', workEnd: '18:00', workingDays: [1, 2, 3, 4, 5], weeklyCapacityHours: 40, languages: ['ja'],
  },
  {
    id: 'st02', name: '田中 亮', role: 'プログラム', location: 'Tokyo, Japan', timezone: 'Asia/Tokyo',
    workStart: '09:00', workEnd: '18:00', workingDays: [1, 2, 3, 4, 5], weeklyCapacityHours: 40, languages: ['ja'],
  },
  {
    id: 'st03', name: '山田 愛子', role: 'アート', location: 'Tokyo, Japan', timezone: 'Asia/Tokyo',
    workStart: '10:00', workEnd: '19:00', workingDays: [1, 2, 3, 4, 5], weeklyCapacityHours: 40, languages: ['ja'],
  },
  {
    id: 'st04', name: '望月 さくら', role: 'テスト(QA)', location: 'Tokyo, Japan', timezone: 'Asia/Tokyo',
    workStart: '09:00', workEnd: '18:00', workingDays: [1, 2, 3, 4, 5], weeklyCapacityHours: 40, languages: ['ja'],
  },
  {
    id: 'st05', name: '高橋 舞', role: 'ブリッジPM', location: 'Tokyo, Japan', timezone: 'Asia/Tokyo',
    workStart: '09:00', workEnd: '19:00', workingDays: [1, 2, 3, 4, 5], weeklyCapacityHours: 45, languages: ['ja', 'en'],
  },
  {
    id: 'st06', name: 'Sofía Hernández', role: 'ローカライズ・テスト(スペイン語圏)', location: 'Mexico City, Mexico', timezone: 'America/Mexico_City',
    workStart: '09:00', workEnd: '18:00', workingDays: [1, 2, 3, 4, 5], weeklyCapacityHours: 40, languages: ['es', 'en'],
  },
  {
    id: 'st07', name: 'Camille Dubois', role: 'テスト・ローカライズ(EU諸語)', location: 'Paris, France', timezone: 'Europe/Paris',
    workStart: '09:00', workEnd: '18:00', workingDays: [1, 2, 3, 4, 5], weeklyCapacityHours: 40, languages: ['fr', 'en'],
  },
  {
    id: 'st08', name: 'Élise Martin', role: 'EU圏PR', location: 'Paris, France', timezone: 'Europe/Paris',
    workStart: '09:30', workEnd: '18:30', workingDays: [1, 2, 3, 4, 5], weeklyCapacityHours: 40, languages: ['fr', 'en'],
  },
  {
    id: 'st09', name: 'David Kim', role: 'PR', location: 'Los Angeles, USA', timezone: 'America/Los_Angeles',
    workStart: '10:00', workEnd: '18:00', workingDays: [1, 2, 3, 4, 5], weeklyCapacityHours: 35, languages: ['en'],
  },
  {
    id: 'st10', name: 'Jessica Reyes', role: 'テスト(QA)', location: 'Los Angeles, USA', timezone: 'America/Los_Angeles',
    workStart: '09:00', workEnd: '17:00', workingDays: [1, 2, 3, 4, 5], weeklyCapacityHours: 35, languages: ['en'],
  },
  {
    id: 'st11', name: 'Marcus Bell', role: '吹替(英語音声収録)', location: 'Los Angeles, USA', timezone: 'America/Los_Angeles',
    workStart: '11:00', workEnd: '19:00', workingDays: [1, 2, 3, 4, 5], weeklyCapacityHours: 25, languages: ['en'],
  },
  {
    id: 'st12', name: 'Emily Carter', role: 'PR', location: 'New York, USA', timezone: 'America/New_York',
    workStart: '09:00', workEnd: '17:00', workingDays: [1, 2, 3, 4, 5], weeklyCapacityHours: 40, languages: ['en'],
  },
  {
    id: 'st13', name: 'Ahmed Al-Farsi', role: 'ローカライズ(アラビア語)・MENA市場事業開発', location: 'Dubai, UAE', timezone: 'Asia/Dubai',
    // Dubai weekend is Fri/Sat, not Sat/Sun — Sunday is a working day here.
    workStart: '09:00', workEnd: '17:00', workingDays: [0, 1, 2, 3, 4], weeklyCapacityHours: 40, languages: ['ar', 'en'],
  },
];

export const seedProjects: Project[] = [
  { id: 'pj01', name: 'サムライゴースト', genre: 'アクションRPG', status: 'active', phase: 'ローカライズ／PR準備', startDate: '2026-05-01', targetRelease: '2027-03-01' },
  { id: 'pj02', name: 'ネオトーキョー2088', genre: 'アクション', status: 'active', phase: 'アート／プログラム', startDate: '2026-07-01', targetRelease: '2027-09-01' },
  { id: 'pj03', name: '忍者パズルクエスト', genre: 'パズル', status: 'planning', phase: '企画', startDate: '2026-08-01', targetRelease: '2027-01-15' },
];

export const seedAssignments: Assignment[] = [
  { id: 'as01', memberId: 'st01', projectId: 'pj01', roleInProject: '企画', allocatedHoursPerWeek: 5 },
  { id: 'as02', memberId: 'st01', projectId: 'pj03', roleInProject: '企画', allocatedHoursPerWeek: 35 },
  { id: 'as03', memberId: 'st02', projectId: 'pj01', roleInProject: 'プログラム', allocatedHoursPerWeek: 10 },
  { id: 'as04', memberId: 'st02', projectId: 'pj02', roleInProject: 'プログラム', allocatedHoursPerWeek: 30 },
  { id: 'as05', memberId: 'st03', projectId: 'pj02', roleInProject: 'アート', allocatedHoursPerWeek: 40 },
  { id: 'as06', memberId: 'st04', projectId: 'pj01', roleInProject: 'テスト', allocatedHoursPerWeek: 15 },
  { id: 'as07', memberId: 'st04', projectId: 'pj02', roleInProject: 'テスト', allocatedHoursPerWeek: 25 },
  { id: 'as08', memberId: 'st05', projectId: 'pj01', roleInProject: 'ブリッジPM', allocatedHoursPerWeek: 15 },
  { id: 'as09', memberId: 'st05', projectId: 'pj02', roleInProject: 'ブリッジPM', allocatedHoursPerWeek: 15 },
  { id: 'as10', memberId: 'st05', projectId: 'pj03', roleInProject: 'ブリッジPM', allocatedHoursPerWeek: 15 },
  { id: 'as11', memberId: 'st06', projectId: 'pj01', roleInProject: 'ローカライズ・テスト', allocatedHoursPerWeek: 25 },
  { id: 'as12', memberId: 'st06', projectId: 'pj02', roleInProject: 'ローカライズ・テスト', allocatedHoursPerWeek: 20 },
  { id: 'as13', memberId: 'st07', projectId: 'pj01', roleInProject: 'テスト・ローカライズ', allocatedHoursPerWeek: 20 },
  { id: 'as14', memberId: 'st07', projectId: 'pj02', roleInProject: 'テスト・ローカライズ', allocatedHoursPerWeek: 20 },
  { id: 'as15', memberId: 'st08', projectId: 'pj01', roleInProject: 'EU圏PR', allocatedHoursPerWeek: 30 },
  { id: 'as16', memberId: 'st09', projectId: 'pj01', roleInProject: 'PR', allocatedHoursPerWeek: 20 },
  { id: 'as17', memberId: 'st10', projectId: 'pj01', roleInProject: 'テスト', allocatedHoursPerWeek: 20 },
  { id: 'as18', memberId: 'st10', projectId: 'pj02', roleInProject: 'テスト', allocatedHoursPerWeek: 20 },
  { id: 'as19', memberId: 'st11', projectId: 'pj01', roleInProject: '吹替', allocatedHoursPerWeek: 15 },
  { id: 'as20', memberId: 'st12', projectId: 'pj01', roleInProject: 'PR', allocatedHoursPerWeek: 25 },
  { id: 'as21', memberId: 'st13', projectId: 'pj01', roleInProject: 'ローカライズ・事業開発', allocatedHoursPerWeek: 30 },
];

export const seedTasks: Task[] = [
  { id: 'tk01', projectId: 'pj01', titleJa: 'リリース版シナリオ最終稿確定', titleEn: '', descriptionJa: '', descriptionEn: '', assigneeId: 'st01', dueDate: '2026-06-01', status: 'done', dependsOn: null, createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'tk02', projectId: 'pj01', titleJa: '英語版QAテスト', titleEn: '', descriptionJa: '', descriptionEn: '', assigneeId: 'st04', dueDate: '2026-07-15', status: 'done', dependsOn: 'tk01', createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'tk03', projectId: 'pj01', titleJa: 'スペイン語ローカライズ・QA', titleEn: '', descriptionJa: '', descriptionEn: '', assigneeId: 'st06', dueDate: '2026-08-20', status: 'in-progress', dependsOn: 'tk02', createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'tk04', projectId: 'pj01', titleJa: 'フランス語ほかEU諸語ローカライズ・QA', titleEn: '', descriptionJa: '', descriptionEn: '', assigneeId: 'st07', dueDate: '2026-08-25', status: 'in-progress', dependsOn: 'tk02', createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'tk05', projectId: 'pj01', titleJa: 'アラビア語ローカライズ', titleEn: '', descriptionJa: '', descriptionEn: '', assigneeId: 'st13', dueDate: '2026-09-05', status: 'todo', dependsOn: 'tk02', createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'tk06', projectId: 'pj01', titleJa: '英語版フルボイス収録', titleEn: '', descriptionJa: '', descriptionEn: '', assigneeId: 'st11', dueDate: '2026-09-10', status: 'todo', dependsOn: 'tk02', createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'tk07', projectId: 'pj01', titleJa: '北米向けプロモーション計画', titleEn: '', descriptionJa: '英語吹替素材が完成するまでプロモ動画を作れずブロック中。', descriptionEn: '', assigneeId: 'st09', dueDate: '2026-09-25', status: 'blocked', dependsOn: 'tk06', createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'tk08', projectId: 'pj01', titleJa: 'EU圏向けプロモーション計画', titleEn: '', descriptionJa: '', descriptionEn: '', assigneeId: 'st08', dueDate: '2026-09-25', status: 'todo', dependsOn: 'tk04', createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'tk09', projectId: 'pj01', titleJa: '北米メディア向けプレスリリース', titleEn: '', descriptionJa: '', descriptionEn: '', assigneeId: 'st12', dueDate: '2026-10-01', status: 'todo', dependsOn: 'tk07', createdAt: '2026-05-01T00:00:00.000Z' },
  { id: 'tk10', projectId: 'pj02', titleJa: '主人公キャラクターデザイン確定', titleEn: '', descriptionJa: '', descriptionEn: '', assigneeId: 'st03', dueDate: '2026-09-05', status: 'in-progress', dependsOn: null, createdAt: '2026-07-01T00:00:00.000Z' },
  { id: 'tk11', projectId: 'pj02', titleJa: 'キャラクター実装(仮モデル)', titleEn: '', descriptionJa: '', descriptionEn: '', assigneeId: 'st02', dueDate: '2026-09-20', status: 'todo', dependsOn: 'tk10', createdAt: '2026-07-01T00:00:00.000Z' },
  { id: 'tk12', projectId: 'pj02', titleJa: '初期ビルド動作確認', titleEn: '', descriptionJa: '', descriptionEn: '', assigneeId: 'st10', dueDate: '2026-10-01', status: 'todo', dependsOn: 'tk11', createdAt: '2026-07-01T00:00:00.000Z' },
  { id: 'tk13', projectId: 'pj03', titleJa: '起承転結プロット第1稿', titleEn: '', descriptionJa: '', descriptionEn: '', assigneeId: 'st01', dueDate: '2026-08-20', status: 'in-progress', dependsOn: null, createdAt: '2026-08-01T00:00:00.000Z' },
];

export const seedGlossary: GlossaryTerm[] = [
  { id: 'seed-term-1', termJa: '手戻り', termEn: 'rework', note: '仕様誤解などによるやり直し作業' },
  { id: 'seed-term-2', termJa: '要件定義', termEn: 'requirements definition', note: '' },
  { id: 'seed-term-3', termJa: '結合テスト', termEn: 'integration testing', note: '' },
];
