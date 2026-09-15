// 生成 agent-browser batch 所需 JSON（[["cmd","arg"], ...]）
// 用法: node build-batch.js <out.json> <steps.txt>
// steps.txt 语法：
//   # 注释
//   @<name>            展开为 ["eval", .qa/<name>.js 的内容]（如 @diag / @check）
//   cmd a b c          按空白切分为多个参数（如 set viewport 390 844）
//   !cmd 整段参数       感叹号开头 = 整段作为单个参数（选择器含空格、内联 eval 等）
const fs = require('fs');
const path = require('path');

const [outPath, stepFile] = process.argv.slice(2);
const dir = path.dirname(stepFile);

const inlineCache = {};
function inline(name) {
  if (!(name in inlineCache)) {
    inlineCache[name] = fs.readFileSync(path.join(dir, name + '.js'), 'utf8')
      .replace(/\s*\n\s*/g, ' ');
  }
  return inlineCache[name];
}

const cmds = fs.readFileSync(stepFile, 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((line) => {
    if (line.startsWith('@')) return ['eval', inline(line.slice(1))];
    if (line.startsWith('!')) {
      const rest = line.slice(1);
      const sp = rest.indexOf(' ');
      return sp === -1 ? [rest] : [rest.slice(0, sp), rest.slice(sp + 1)];
    }
    return line.split(/\s+/);
  });

fs.writeFileSync(outPath, JSON.stringify(cmds));
console.log('wrote ' + outPath + ' with ' + cmds.length + ' commands');
