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

  const res = await request(`${CONFIG.baseUrl}/fact/material/add.html?platform=H5`, {
    method: 'GET',
    headers: { 'Cookie': sessionCookie },
  });
  
  // 提取 <select name="unit_id"> 里的选项
  const unitMatch = res.body.match(/<select name="unit_id"[\s\S]*?<\/select>/);
  if (unitMatch) {
    console.log('发现单位选择器:');
    const options = unitMatch[0].match(/<option value="(\d+)".*?>([\s\S]*?)<\/option>/g);
    options?.forEach(opt => {
      const m = opt.match(/value="(\d+)".*?>([\s\S]*?)<\/option>/);
      if (m) console.log(`${m[2]}: ID=${m[1]}`);
    });
  } else {
    console.log('未发现单位选择器');
  }

  // 提取 <select name="type"> 里的选项
  const typeMatch = res.body.match(/<select name="type"[\s\S]*?<\/select>/);
  if (typeMatch) {
    console.log('\n发现类型选择器:');
    const options = typeMatch[0].match(/<option value="(\d+)".*?>([\s\S]*?)<\/option>/g);
    options?.forEach(opt => {
      const m = opt.match(/value="(\d+)".*?>([\s\S]*?)<\/option>/);
      if (m) console.log(`${m[2]}: ID=${m[1]}`);
    });
  }
}

run();
