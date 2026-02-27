#!/bin/bash
# 万濮云 - 快速更新（适用于小更新）
# 适用：仅改了 tsx/ts/css 等业务代码，未改 package.json、Dockerfile、数据库
# 利用 Docker 缓存跳过拉取镜像和 npm install，通常 1-3 分钟完成
# 若改了依赖或 schema，请用 ./update.sh 做完整更新

set -e
cd "$(dirname "$0")"

echo "--- 1. 拉取最新代码 ---"
git pull origin main

echo ""
echo "--- 2. 重新构建并重启（使用缓存）---"
# 使用缓存构建，小更新通常 1-3 分钟
if command -v docker-compose &>/dev/null; then
  docker-compose build
  docker-compose up -d
else
  docker compose build
  docker compose up -d
fi

echo ""
echo "✅ 快速更新完成！"
