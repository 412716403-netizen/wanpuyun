const https = require('https');
const { URLSearchParams } = require('url');

const company = "万濮服饰1";
const user = "wanpu";
const pass = "012345";
const baseUrl = "https://www.wanpuxx.com";

async function runDebug() {
    console.log("🚀 开始深度调试 API 对接...");
    console.log(`🏢 公司: ${company}, 用户: ${user}`);

    // 1. 尝试登录并获取 Cookie
    const loginPaths = ['/fact/admin/login.html', '/fact/api/login.html', '/fact/admin/index.php?r=site/login'];
    let sessionCookie = "";

    for (const path of loginPaths) {
        console.log(`\n[Step 1] 正在尝试登录路径: ${path}`);
        try {
            const body = new URLSearchParams({ fact: company, username: user, password: pass, platform: 'H5' }).toString();
            const res = await request(baseUrl + path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }, body);

            console.log(`HTTP 状态码: ${res.statusCode}`);
            const setCookie = res.headers['set-cookie'];
            if (setCookie) {
                sessionCookie = setCookie.map(c => c.split(';')[0]).join('; ');
                console.log(`✅ 拿到 Cookie: ${sessionCookie}`);
            }

            try {
                const data = JSON.parse(res.body);
                console.log("响应内容:", JSON.stringify(data, null, 2));
                if (data.error === 0 || data.success) {
                    console.log("🎉 登录成功!");
                    break;
                }
            } catch (e) {
                console.log("响应不是 JSON，前 100 字符:", res.body.substring(0, 100));
            }
        } catch (err) {
            console.log("请求失败:", err.message);
        }
    }

    if (!sessionCookie) {
        console.log("❌ 无法获取有效的 Session Cookie，调试终止。");
        return;
    }

    // 2. 探测字典路径
    const dictPaths = [
        '/fact/admin/index.php?r=dict/list',
        '/fact/dict/list.html',
        '/fact/goods/add.html',
        '/fact/admin/goods/add.html'
    ];

    console.log("\n[Step 2] 开始探测数据获取路径...");
    for (const path of dictPaths) {
        console.log(`\n--- 尝试路径: ${path} ---`);
        try {
            const query = new URLSearchParams({ platform: 'H5', type: '3' }).toString();
            const url = baseUrl + path + (path.includes('?') ? '&' : '?') + query;
            const res = await request(url, {
                method: path.includes('dict') ? 'POST' : 'GET',
                headers: { 
                    'Cookie': sessionCookie,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }, path.includes('dict') ? query : null);

            console.log(`HTTP 状态码: ${res.statusCode}`);
            try {
                const data = JSON.parse(res.body);
                console.log("✅ 成功获取 JSON 数据!");
                console.log("字段预览:", Object.keys(data).join(', '));
                if (data.productSizeColorDicts) console.log("发现关键字段: productSizeColorDicts");
                if (data.materials) console.log("发现关键字段: materials");
                if (data.data || data.list) console.log("发现列表数据项数:", (data.data || data.list).length);
            } catch (e) {
                console.log("❌ 路径有效但返回非 JSON 内容。");
            }
        } catch (err) {
            console.log("请求异常:", err.message);
        }
    }
}

function request(url, options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

runDebug();

