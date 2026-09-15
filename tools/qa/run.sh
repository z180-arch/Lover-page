#!/usr/bin/env bash
# Lover-page 真实浏览器 QA 运行器
#
# 前置：
#   1. 本地静态服务器（零构建项目没有 dev server，用任意静态服务器即可）
#        python -m http.server 8899 --bind 127.0.0.1
#   2. agent-browser（vercel-labs/agent-browser）：npm i -g agent-browser && agent-browser install
#
# 用法：
#   tools/qa/run.sh steps-mobile-320.txt
#   tools/qa/run.sh steps-regression.txt
#
# 说明：agent-browser 的 batch 需要 stdin 传入 JSON（[["cmd","arg"], ...]），
#       build-batch.js 负责把人类可读的 steps 文件翻译过去。
#       一次 batch 必须在同一个进程内完成 —— 否则浏览器 daemon 会随命令结束被回收，
#       页面状态（当前章节、cookie、localStorage）不跨调用保留。

set -euo pipefail

STEPS="${1:-steps-mobile-320.txt}"
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$(mktemp -t lover-qa-XXXXXX.json)"

node "$HERE/build-batch.js" "$OUT" "$HERE/$STEPS"
echo "--- running $STEPS ---"
agent-browser batch < "$OUT"
rm -f "$OUT"
