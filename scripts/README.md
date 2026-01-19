# 开发工具与测试脚本

本目录包含项目开发过程中使用的各种测试和调试脚本。

## 外部系统 API 探测脚本

- `test_api.cjs` - 自动化探测外部生产系统接口
- `debug_api.js` - 深度调试 API 对接
- `check_login_info.cjs` - 测试登录并检查用户信息

## 数据字典探测

- `test_dict_all.cjs` - 测试所有字典接口
- `probe_units.cjs` - 探测单位字典
- `extract_options.cjs` - 提取选项数据

## 物料相关

- `test_material_api.cjs` / `test_material_api.js` - 测试物料 API
- `test_material_fields.cjs` - 测试物料字段
- `inspect_material.cjs` - 检查物料详情

## 用户与配置

- `fetch_profile.cjs` - 获取用户配置
- `inspect_profile_detail.cjs` - 检查用户详情
- `extract_user_segment.cjs` - 提取用户片段
- `probe_user_name.cjs` - 探测用户名
- `read_more_lines.cjs` - 读取更多行数据

## 数据库测试

- `test-db.ts` - 测试数据库连接和查询

## 使用说明

这些脚本主要用于开发阶段的 API 探测和调试，生产环境不需要。

运行示例：
```bash
node scripts/test_api.cjs
```
