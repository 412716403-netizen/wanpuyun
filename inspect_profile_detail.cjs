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

  const res = await request(`${CONFIG.baseUrl}/fact/admin/profile.html`, {
    method: 'GET',
    headers: { 'Cookie': sessionCookie },
  });
  
  // 查找包含 "姓名" 的行及其后两行
  const lines = res.body.split('\n');
  const idx = lines.findIndex(l => l.includes('姓名：'));
  if (idx !== -1) {
    console.log('--- 姓名行详情 ---');
    for (let i = idx; i <= idx + 5; i++) {
      console.log(`Line ${i}:`, lines[i]?.trim());
    }
  }
}

run();
