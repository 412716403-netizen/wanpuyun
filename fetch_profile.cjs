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

  console.log('--- 尝试抓取个人资料页面 ---');
  const res = await request(`${CONFIG.baseUrl}/fact/admin/profile.html`, {
    method: 'GET',
    headers: { 'Cookie': sessionCookie },
  });
  
  // 查找表单中的内容
  const searchStrs = ['姓名', '经办', '真实姓名', '手机'];
  for (const s of searchStrs) {
    const idx = res.body.indexOf(s);
    if (idx !== -1) {
      console.log(`发现关键词 "${s}" 附近的文本:`, res.body.substring(idx - 10, idx + 100).replace(/\s+/g, ' '));
    }
  }
}

run();
