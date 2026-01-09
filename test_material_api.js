const https = require('https');

const CONFIG = {
  baseUrl: 'https://www.wanpuxx.com',
  company: '万濮服饰1',
  username: 'wanpu',
  password: '012345'
};

async function request(url, options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: data
      }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  console.log('--- 开始测试登录 ---');
  // 1. 登录
  const loginBody = new URLSearchParams({
    fact: CONFIG.company,
    username: CONFIG.username,
    password: CONFIG.password,
    platform: 'H5'
  }).toString();

  const loginRes = await request(`${CONFIG.baseUrl}/fact/admin/login.html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, loginBody);

  console.log('登录状态码:', loginRes.statusCode);
  const setCookie = loginRes.headers['set-cookie'];
  if (!setCookie) {
    console.log('未获取到 Cookie，登录可能失败。');
    console.log('响应内容:', loginRes.body);
    return;
  }
  const sessionCookie = setCookie.map(c => c.split(';')[0]).join('; ');
  console.log('成功获取 Cookie');

  // 2. 测试路径 /factapp/material/add.html
  console.log('\n--- 测试路径 /factapp/material/add.html ---');
  const testPaths = ['/factapp/material/add.html', '/fact/material/add.html', '/fact/dict/add.html'];
  
  for (const path of testPaths) {
    console.log(`\n尝试 POST 到: ${path}`);
    const testBody = new URLSearchParams({
      name: '测试原料_AI',
      color: '红色',
      spec: '32s/2',
      type: '1', // 假设 1 是毛料
      platform: 'H5'
    }).toString();

    try {
      const res = await request(`${CONFIG.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': sessionCookie
        }
      }, testBody);
      
      console.log(`状态码: ${res.statusCode}`);
      console.log('响应预览:', res.body.substring(0, 300));
      
      try {
        const json = JSON.parse(res.body);
        if (json.errors) {
          console.log('校验错误详情:', JSON.stringify(json.errors, null, 2));
        }
      } catch (e) {
        // Not JSON
      }
    } catch (err) {
      console.log(`请求 ${path} 失败:`, err.message);
    }
  }
}

run();
