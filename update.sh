#!/bin/bash
# 万濮云 - 一键更新（备份 + 拉取代码 + 构建重启）
# 优先从 Gitee 拉取；无 gitee 远程时则用 origin（部署机请将 origin 指向 Gitee）
# 拉取带超时，避免网络差时长时间卡住

set -e
cd "$(dirname "$0")"

GIT_PULL_TIMEOUT=120  # 秒，超时后报错而不是一直卡住

if git remote | grep -qx 'gitee'; then
  GIT_REMOTE=gitee
  GIT_REMOTE_LABEL="Gitee"
else
  GIT_REMOTE=origin
  GIT_REMOTE_LABEL="origin（当前未配置 gitee 远程，请确保 origin 已指向 Gitee）"
fi

echo "1. 正在备份数据库..."
if [ -f ./data/dev.db ]; then
  mkdir -p ./data/backups
  cp ./data/dev.db "./data/backups/dev.db.$(date +%Y%m%d-%H%M%S)"
  echo "   已备份到 data/backups/"
else
  echo "   未找到 data/dev.db，跳过备份"
fi

echo "2. 正在从 ${GIT_REMOTE_LABEL} 拉取 main（超时 ${GIT_PULL_TIMEOUT} 秒）..."
if timeout "$GIT_PULL_TIMEOUT" git pull "$GIT_REMOTE" main; then
  echo "   拉取完成"
else
  ret=$?
  if [ "$ret" -eq 124 ]; then
    echo ""
    echo "   ❌ 拉取超时（${GIT_PULL_TIMEOUT} 秒）。可稍后重试: ./update.sh"
    echo "      或手动: git pull ${GIT_REMOTE} main"
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
