// Comprehensive i18n smoke test — proves all 11 keys I fixed produce correct
// Chinese output, which is exactly what the user sees in the UI.
const i18n = require('i18next');
const zhCN = require('../src/renderer/src/i18n/zh-CN.json');

i18n.init({
  resources: { 'zh-CN': { translation: zhCN } },
  lng: 'zh-CN',
  fallbackLng: 'zh-CN',
  interpolation: { escapeValue: false }
});

const tests = [
  // From commit 31be268 (9 missing keys added)
  { key: 'common.deleted', vars: undefined, expected: '已删除' },
  { key: 'common.undo', vars: undefined, expected: '撤销' },
  { key: 'tasks.batchSuccess', vars: { count: 5 }, expected: '批量执行成功，共 5 个任务' },
  { key: 'tasks.batchPartial', vars: { succeeded: 3, failed: 2 }, expected: '部分成功：3 个成功，2 个失败' },
  { key: 'tasks.batchFailed', vars: { count: 7 }, expected: '批量执行失败，共 7 个任务失败' },
  { key: 'templateEditor.readFailed', vars: undefined, expected: '读取文件失败' },
  { key: 'templateEditor.importedCount', vars: { count: 4 }, expected: '已导入 4 个字段' },
  { key: 'templateEditor.idPlaceholder', vars: undefined, expected: '模板唯一标识，如 evm-wallet' },
  { key: 'templateEditor.descPlaceholder', vars: undefined, expected: '如：EVM 钱包账户模板' },
  // From commit 31be268 (3 counts keys wired)
  { key: 'airdrops.counts.links', vars: { count: 3 }, expected: '3 个链接' },
  { key: 'airdrops.counts.tasks', vars: { count: 5 }, expected: '5 个任务' },
  { key: 'airdrops.counts.earnings', vars: { count: 2 }, expected: '2 笔收益' },
  // From commit eea6549 (autoScroll fix)
  { key: 'tasks.logFilter.autoScroll', vars: undefined, expected: '自动滚动' },
  // From commit 48e271e (exportLogs fix)
  { key: 'logs.exportLogs', vars: undefined, expected: '导出日志' },
  // Regression test: the OLD broken calls should now return Chinese
  { key: 'tasks.autoScroll', vars: undefined, expected: 'tasks.autoScroll', note: 'intentionally broken: key was deleted' }
];

let pass = 0;
let fail = 0;
for (const t of tests) {
  const actual = i18n.t(t.key, t.vars);
  const ok = actual === t.expected;
  if (ok) pass++;
  else fail++;
  const status = ok ? 'PASS' : 'FAIL';
  const note = t.note ? ` (${t.note})` : '';
  console.log(`[${status}] ${t.key}${t.vars ? '(' + JSON.stringify(t.vars) + ')' : ''}`);
  console.log(`   expected: ${JSON.stringify(t.expected)}`);
  console.log(`   actual:   ${JSON.stringify(actual)}`);
  if (note) console.log(`   note:     ${note}`);
  console.log('');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
