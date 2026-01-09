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
  const loginBody = new URLSearchParams({ fact: CONFIG.company, username: CONFIG.username, password: CONFIG.password, platform: 'H5' }).toString();
  const loginRes = await request(`${CONFIG.baseUrl}/fact/admin/login.html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, loginBody);

  const setCookie = loginRes.headers['set-cookie'];
  const sessionCookie = setCookie.map(c => c.split(';')[0]).join('; ');

  console.log('--- 探测原料新增字段 ---');
  
  // 故意发空数据，看返回什么错误
  console.log('\n[Test 1] 发送空数据探测必填项:');
  const emptyRes = await request(`${CONFIG.baseUrl}/fact/material/add.html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': sessionCookie },
  }, 'platform=H5');
  console.log('响应:', emptyRes.body);

  // 测试毛料类型字段
  console.log('\n[Test 2] 测试毛料字段 (type=1):');
  const yarnBody = new URLSearchParams({
    platform: 'H5',
    type: '1', // 1: 毛料
    name: '毛料测试' + Date.now(),
    color: '米白',
    spec: '2/48',
    unit_id: '1' // 假设 1 是 克
  }).toString();
  const yarnRes = await request(`${CONFIG.baseUrl}/fact/material/add.html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': sessionCookie },
  }, yarnBody);
  console.log('毛料响应:', yarnRes.body);

  // 测试辅料类型字段
  console.log('\n[Test 3] 测试辅料字段 (type=2):');
  const accBody = new URLSearchParams({
    platform: 'H5',
    type: '2', // 2: 辅料
    name: '辅料测试' + Date.now(),
    color: '黑色',
    spec: '20cm',
    unit_id: '1'
  }).toString();
  const accRes = await request(`${CONFIG.baseUrl}/fact/material/add.html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': sessionCookie },
  }, accBody);
  console.log('辅料响应:', accRes.body);
}

run();
