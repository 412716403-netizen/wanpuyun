const https = require('https');
const url = require('url');

const CONFIG = {
  host: 'www.wanpuxx.com',
  company: '万濮服饰1',
  user: 'wanpu',
  pass: '012345'
};

async function request(path, method, body = null, headers = {}) {
  return new Promise((resolve) => {
    const options = {
      hostname: CONFIG.host,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...headers
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    if (body) req.write(body);
    req.end();
  });
}

async function start() {
  console.log('🚀 开始自动化探测生产系统接口...');
  
  // 1. 尝试登录
  const loginPaths = ['/fact/admin/login.html', '/fact/api/login.html', '/fact/admin/index.php?r=site/login'];
  let sessionCookie = '';
  let token = '';

  for (const path of loginPaths) {
    console.log(`\n尝试登录路径: ${path}`);
    const res = await request(path, 'POST', `fact=${encodeURIComponent(CONFIG.company)}&username=${CONFIG.user}&password=${CONFIG.pass}&platform=H5`);
    
    if (res.body && res.body.includes('"error":0')) {
      console.log('✅ 登录成功！');
      const setCookie = res.headers['set-cookie'];
      if (setCookie) sessionCookie = setCookie.map(c => c.split(';')[0]).join('; ');
      try {
        const json = JSON.parse(res.body);
        token = json.token || (json.data && json.data.token) || '';
      } catch(e) {}
      break;
    } else {
      console.log(`❌ 失败 (状态码: ${res.status})`);
    }
  }

  if (!sessionCookie) {
    console.log('\n❌ 无法获取会话，探测终止。请检查网络或账号密码。');
    return;
  }

  // 2. 尝试获取字典
  console.log('\n--- 开始探测数据路径 ---');
  const testPaths = [
    '/fact/goods/add.html',
    '/fact/dict/list.html',
    '/fact/admin/index.php?r=goods/add',
    '/fact/admin/index.php?r=dict/list',
    '/fact/api/dict/list',
    '/fact/base/dict/list'
  ];

  for (const p of testPaths) {
    console.log(`\n测试路径: ${p}`);
    const query = `session=${token}&platform=H5&type=3`;
    const fullPath = p.includes('?') ? `${p}&${query}` : `${p}?${query}`;
    const res = await request(fullPath, 'POST', query, { 'Cookie': sessionCookie });
    
    if (res.status === 200) {
      console.log(`✅ 响应 200！预览: ${res.body.substring(0, 200)}`);
      if (res.body.includes('"error":0')) {
        console.log('🎯 找到有效接口！');
      }
    } else {
      console.log(`❌ 响应 ${res.status}`);
    }
  }
}

start();
