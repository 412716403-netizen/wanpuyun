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

  console.log('--- 探测字典类型 (1 到 30) ---');
  
  for (let t = 1; t <= 30; t++) {
    const res = await request(`${CONFIG.baseUrl}/fact/dict/list-data.html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': sessionCookie },
    }, `platform=H5&type=${t}&limit=20`);
    
    try {
      const json = JSON.parse(res.body);
      if (json.data && json.data.length > 0) {
        console.log(`Type ${t}: ${json.data[0].name} (共 ${json.data.length} 条)`);
      }
    } catch (e) {}
  }
}

run();
