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

  console.log('--- 查看原料详细数据 ---');
  const res = await request(`${CONFIG.baseUrl}/fact/material/list-data.html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': sessionCookie },
  }, `platform=H5&limit=1`);
  
  console.log(res.body);
}

run();
