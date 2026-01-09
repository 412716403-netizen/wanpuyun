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

  const res = await request(`${CONFIG.baseUrl}/fact.html`, {
    method: 'GET',
    headers: { 'Cookie': sessionCookie },
  });
  
  // 打印包含 "退出" 的那一整行及其前三行
  const lines = res.body.split('\n');
  const targetIdx = lines.findIndex(l => l.includes('退出'));
  if (targetIdx !== -1) {
    console.log('--- 关键代码片段 ---');
    for (let i = Math.max(0, targetIdx - 5); i <= targetIdx; i++) {
      console.log(`Line ${i}:`, lines[i].trim());
    }
  }
}

run();
