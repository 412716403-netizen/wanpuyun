#!/bin/bash
# 万濮云 - 一键更新（备份 + 拉取代码 + 构建重启）
# 拉取代码步骤带超时，避免国内服务器访问 GitHub 时无限卡住

set -e
cd "$(dirname "$0")"

GIT_PULL_TIMEOUT=120  # 秒，超时后报错而不是一直卡住

echo "1. 正在备份数据库..."
if [ -f ./data/dev.db ]; then
  mkdir -p ./data/backups
  cp ./data/dev.db "./data/backups/dev.db.$(date +%Y%m%d-%H%M%S)"
  echo "   已备份到 data/backups/"
else
  echo "   未找到 data/dev.db，跳过备份"
fi

echo "2. 正在拉取 GitHub 最新代码（超时 ${GIT_PULL_TIMEOUT} 秒）..."
if timeout "$GIT_PULL_TIMEOUT" git pull origin main; then
  echo "   拉取完成"
else
  ret=$?
  if [ "$ret" -eq 124 ]; then
    echo ""
    echo "   ❌ 拉取超时（${GIT_PULL_TIMEOUT} 秒）。国内服务器访问 GitHub 可能较慢，可："
    echo "      - 稍后重试: ./update.sh"
    echo "      - 或配置代理后重试"
    echo "      - 或先手动执行: git pull origin main（卡住时 Ctrl+C 再重试）"
    exit 124
  else
    echo "   ❌ 拉取失败，退出码: $ret"
    exit "$ret"
  fi
fi

echo "3. 正在构建并重启..."
if command -v docker-compose &>/dev/null; then
  docker-compose build
  docker-compose up -d
else
  docker compose build
  docker compose up -d
fi

echo ""
echo "✅ 更新完成！"
