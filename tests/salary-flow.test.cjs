const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = process.env.SALARY_TEST_ROOT || path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const cache = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = new Module(filename);
  cache.set(filename, module);
  module.require = name => name.startsWith('@/') ? load('src/' + name.slice(2) + '.ts') : require(name);
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, filename);
  return module.exports;
}
const { validateWorkTime, isValidTime } = load('src/lib/workTimeValidation.ts');
const { calculateSalary } = load('src/salary/calculateSalary.ts');
const { findWorkEntryConflict } = load('src/salary/workEntryConflicts.ts');
const { parseSalaryBackup, saveSalaryData, loadSalaryData } = load('src/lib/storage.ts');
const { getEntriesForMonth, getMonthEndDate, shiftMonthKey } = load('src/lib/month.ts');
const settings = { hourlyWage: 11000, bonusAllowance: 0, mealAllowance: 0, overtimeMultiplier: 1.5, nightMultiplier: 1.5, applyOvertime: true, applyNight: true, applyWeeklyAllowance: true, applyBonusAllowance: false, applyDeductions: false, applyPension: false, applyHealthInsurance: false, applyLongTermCare: false, applyEmploymentInsurance: false, applyIncomeTax: false, applyLocalIncomeTax: false };
const entry = { id: 'a', date: '2026-09-01', startTime: '09:00', endTime: '18:00', breakMinutes: 60 };
test('HH:mm boundaries and invalid text', () => {
  for (const t of ['00:00','09:00','18:30','23:59','09:17']) assert.equal(isValidTime(t), true);
  for (const t of ['25:00','12:75','abc','9999','25:70','','9:00','24:00']) assert.equal(isValidTime(t), false);
});
test('breaks and overnight are validated without changing elapsed-time calculation', () => {
  assert.deepEqual(validateWorkTime(entry), {});
  assert.deepEqual(validateWorkTime({...entry, startTime:'22:00',endTime:'06:00',breakMinutes:0}), {});
  for (const minutes of [-1, 0.5, NaN, Infinity, 540, 600]) assert.ok(Object.keys(validateWorkTime({...entry,breakMinutes:minutes})).length);
  assert.ok(validateWorkTime({...entry,endTime:'09:00',breakMinutes:0}).endTime);
  assert.equal(calculateSalary([{...entry,startTime:'22:00',endTime:'06:00',breakMinutes:60}],settings).totalWorkMinutes,420);
});
test('overnight conflicts across month boundary; adjacent shifts remain accepted', () => {
  const night={...entry,date:'2026-08-31',startTime:'22:00',endTime:'06:00'};
  assert.ok(findWorkEntryConflict([night],{...entry,id:'b',startTime:'05:00',endTime:'09:00'}));
  assert.equal(findWorkEntryConflict([night],{...entry,id:'b',startTime:'06:00',endTime:'09:00'}),null);
  assert.equal(findWorkEntryConflict([entry],{...entry,id:'b',startTime:'18:00',endTime:'22:00'}),null);
});
test('V1 restore creates independent month snapshots and preserves calculated results', () => {
  const entries=[entry,{...entry,id:'b',date:'2026-08-31'}];
  const restored=parseSalaryBackup(JSON.stringify({version:1,entries,settings,savedAt:'2026-09-01T00:00:00Z'}));
  assert.equal(restored.version,2);
  assert.deepEqual(restored.entries,entries);
  assert.deepEqual(restored.settingsByMonth['2026-08'],settings);
  assert.deepEqual(calculateSalary(getEntriesForMonth(entries,'2026-09'),settings),calculateSalary(getEntriesForMonth(restored.entries,'2026-09'),restored.settingsByMonth['2026-09']));
  restored.defaultSettings.hourlyWage=13000;
  assert.equal(restored.settingsByMonth['2026-08'].hourlyWage,11000);
});
test('V2 roundtrip preserves distinct monthly wages, same-day records, and storage fields', () => {
  const data={version:2,entries:[entry,{...entry,id:'b',startTime:'18:30',endTime:'22:17',breakMinutes:0}],defaultSettings:settings,settingsByMonth:{'2026-08':{...settings,hourlyWage:10500},'2026-09':settings},savedAt:'2026-09-01T00:00:00Z'};
  assert.deepEqual(parseSalaryBackup(JSON.stringify(data)),data);
  const local=new Map();global.window={localStorage:{getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v)}};
  const saved=saveSalaryData(data.entries,data.defaultSettings,data.settingsByMonth);
  assert.deepEqual(Object.keys(saved).sort(),['defaultSettings','entries','savedAt','settingsByMonth','version']);
  assert.deepEqual(loadSalaryData().data,saved);
  assert.equal(loadSalaryData().data.entries.length,2);
  delete global.window;
});
test('month utilities handle leap year and year boundary', () => {
  assert.equal(getMonthEndDate('2028-02'),'2028-02-29');
  assert.equal(getMonthEndDate('2026-02'),'2026-02-28');
  assert.equal(shiftMonthKey('2026-12',1),'2027-01');
  assert.equal(shiftMonthKey('2026-01',-1),'2025-12');
});
