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
  console.log('--- 测试登录并检查返回的用户信息 ---');
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

  try {
    const json = JSON.parse(loginRes.body);
    console.log('登录响应详情:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.log('响应不是 JSON:', loginRes.body.substring(0, 500));
  }
}

run();
