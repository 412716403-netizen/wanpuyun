'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Product, StageStatus } from '@/types'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

// 将 Prisma 的数据格式转换为前端定义的类型格式
function mapProduct(dbProduct: any): Product {
  return {
    id: dbProduct.id,
    code: dbProduct.code,
    name: dbProduct.name,
    colors: dbProduct.colorsJson ? JSON.parse(dbProduct.colorsJson) : [],
    sizes: dbProduct.sizesJson ? JSON.parse(dbProduct.sizesJson) : [],
    yarnUsage: dbProduct.yarnUsages?.map((y: any) => ({
      id: y.id,
      color: y.color,
      materialName: y.materialName,
      specification: y.specification || "",
      weight: y.weight || "",
      unit: (y.unit === '千克' || y.unit === 'kg') ? '克' : (y.unit || "克"),
      materialColor: y.materialColor || "",
      materialType: y.materialType || ""
    })) || [],
    status: dbProduct.status as "developing" | "archived",
    isSynced: dbProduct.isSynced,
    image: dbProduct.image || "",
    thumbnail: dbProduct.thumbnail || "",
    createdAt: dbProduct.createdAt.toISOString().split('T')[0],
    customFields: dbProduct.customFields?.map((cf: any) => ({
      id: cf.id,
      label: cf.label,
      value: cf.value,
    })) || [],
    samples: dbProduct.samples?.map((s: any) => ({
      id: s.id,
      name: s.name,
      logs: s.logs?.map((l: any) => ({
        id: l.id,
        user: l.user,
        action: l.action,
        detail: l.detail,
        time: l.time.toLocaleString('zh-CN', { hour12: false }),
      })) || [],
      stages: s.stages.map((st: any) => ({
        id: st.id,
        name: st.name,
        status: st.status as StageStatus,
        updatedAt: st.updatedAt ? st.updatedAt.toLocaleString('zh-CN', { hour12: false }) : "",
        fields: st.fields?.map((f: any) => ({
          id: f.id,
          label: f.label,
          type: f.type,
          value: f.value,
        })) || [],
        attachments: st.attachments?.map((a: any) => ({
          id: a.id,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
        })) || [],
      })),
    })) || [],
  }
}

// 外部接口配置
const EXTERNAL_API_BASE_URL = "https://www.wanpuxx.com"; 

// 辅助函数：带超时的 fetch
async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number }) {
  const { timeout = 10000 } = options; // 默认 10 秒超时
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export async function externalLogin(company: string, user: string, pass: string) {
  if (!EXTERNAL_API_BASE_URL) return { success: false, message: "请配置域名" };
  try {
    const response = await fetchWithTimeout(`${EXTERNAL_API_BASE_URL}/fact/admin/login.html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ fact: company, username: user, password: pass, platform: 'H5' }).toString(),
      timeout: 15000 // 登录稍微给长一点时间
    });

    const setCookieHeader = response.headers.get('set-cookie');
    const result = await response.json();
    
    if (result.error === 0) {
      const cookieStore = await cookies();
      let sessionCookie = "";
      
      // Cookie 配置：使用宽松策略（适用于 HTTP 环境）
      const cookieOptions = {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax' as const,
      };
      
      if (setCookieHeader) {
        const valid_cookies = setCookieHeader.split(/,(?=\s*[^,;]+=[^,;]+)/).map(c => c.trim().split(';')[0]).filter(c => !c.includes('=deleted'));
        if (valid_cookies.length > 0) {
          sessionCookie = valid_cookies.join('; ');
          cookieStore.set('external_session_cookie', sessionCookie, cookieOptions);
          const match = sessionCookie.match(/advanced-frontend-fact=([^;]+)/);
          if (match) cookieStore.set('external_token', match[1], cookieOptions);
        }
      }
      cookieStore.set('connected_company', company, cookieOptions);

      // 尝试获取经办人姓名
      try {
        logger.debug("[Login] 正在尝试获取经办人姓名...");
        const homeRes = await fetchWithTimeout(`${EXTERNAL_API_BASE_URL}/fact.html`, {
          headers: { 'Cookie': sessionCookie },
          timeout: 5000
        });
        const html = await homeRes.text();
        // 匹配 <cite>...管理员 </cite> 结构，支持图片头像和空白字符
        const citeMatch = html.match(/<cite>[\s\S]*?<\/img>\s*([\s\S]*?)\s*<\/cite>/);
        const realName = citeMatch ? citeMatch[1].trim() : user;
        logger.info(`[Login] 成功获取经办人: ${realName}`);
        cookieStore.set('connected_user_name', realName, cookieOptions);
      } catch (nameError) {
        logger.error("[Login] 获取经办人姓名失败:", nameError);
        cookieStore.set('connected_user_name', user, cookieOptions);
      }

      return { success: true, message: "连接成功" };
    }
    return { success: false, message: result.message || "登录失败" };
  } catch (error) { 
    logger.error("[Login] Connection failed or timeout:", error);
    return { success: false, message: "连接生产系统超时或异常，请检查网络" }; 
  }
}

// 获取颜色字典 (Type: 3)
export async function getExternalColors() {
  if (!EXTERNAL_API_BASE_URL) return [];
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('external_session_cookie')?.value;
    if (!sessionCookie) return [];

    const headers: Record<string, string> = { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': sessionCookie 
    };

    logger.debug("[InitData] 开始从外部系统拉取颜色字典...");
    const response = await fetchWithTimeout(`${EXTERNAL_API_BASE_URL}/fact/dict/list-data.html`, { 
      method: 'POST', 
      headers, 
      body: 'type=3&platform=H5&limit=1000&pageSize=1000&per-page=1000', 
      timeout: 10000 
    });
    const result = await response.json();
    const colors = (result.data || []).map((item: any) => ({ id: String(item.dict_id), name: item.name }));
    logger.info(`[InitData] 颜色拉取完成: ${colors.length} 条`);
    return colors;
  } catch (error) {
    logger.error("[InitData] 颜色拉取异常:", error);
    return [];
  }
}

// 获取尺码字典 (Type: 2)
export async function getExternalSizes() {
  if (!EXTERNAL_API_BASE_URL) return [];
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('external_session_cookie')?.value;
    if (!sessionCookie) return [];

    const headers: Record<string, string> = { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': sessionCookie 
    };

    logger.debug("[InitData] 开始从外部系统拉取尺码字典...");
    const response = await fetchWithTimeout(`${EXTERNAL_API_BASE_URL}/fact/dict/list-data.html`, { 
      method: 'POST', 
      headers, 
      body: 'type=2&platform=H5&limit=1000&pageSize=1000&per-page=1000', 
      timeout: 10000 
    });
    const result = await response.json();
    const sizes = (result.data || []).map((item: any) => ({ id: String(item.dict_id), name: item.name }));
    logger.info(`[InitData] 尺码拉取完成: ${sizes.length} 条`);
    return sizes;
  } catch (error) {
    logger.error("[InitData] 尺码拉取异常:", error);
    return [];
  }
}

// 获取物料字典 (Materials)
export async function getExternalMaterials() {
  if (!EXTERNAL_API_BASE_URL) return [];
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('external_session_cookie')?.value;
    if (!sessionCookie) return [];

    const headers: Record<string, string> = { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': sessionCookie 
    };

    logger.debug("[InitData] 开始从外部系统拉取物料字典...");
    const response = await fetchWithTimeout(`${EXTERNAL_API_BASE_URL}/fact/material/list-data.html`, { 
      method: 'POST', 
      headers, 
      body: 'platform=H5&limit=1000&pageSize=1000&per-page=1000', 
      timeout: 10000 
    });
    const result = await response.json();
    const materials = (result.data || []).map((item: any) => ({
      id: String(item.material_id),
      name: item.name,
      spec: item.spec || "",
      color: item.color || "",
      unit: (item.unit_name === '千克' || item.unit_name === 'kg') ? '克' : (item.unit_name || ""),
      type: item.type?.replace(/<[^>]+>/g, '') || "" 
    }));
    logger.info(`[InitData] 物料拉取完成: ${materials.length} 条`);
    return materials;
  } catch (error) {
    logger.error("[InitData] 物料拉取异常:", error);
    return [];
  }
}

// 保持原函数名以兼容旧代码，但改为调用上面的具体函数
export async function getGoodsInitData() {
  const [colors, sizes, materials] = await Promise.all([
    getExternalColors(),
    getExternalSizes(),
    getExternalMaterials()
  ]);
  return { colors, sizes, materials };
}

export async function syncProductToExternal(productId: string) {
  if (!EXTERNAL_API_BASE_URL) return { success: false, message: "请配置域名" };
  
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('external_session_cookie')?.value;
    if (!sessionCookie) return { success: false, message: "请先连接生产系统" };

    // 1. 获取本地商品完整数据和外部物料字典
    const [product, initData] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        include: { yarnUsages: true, customFields: true }
      }),
      getGoodsInitData()
    ]);

    if (!product || !initData) return { success: false, message: "数据加载失败" };

    const colors = JSON.parse(product.colorsJson || "[]");
    const sizes = JSON.parse(product.sizesJson || "[]");

    // 2. 处理图片同步 (如果有图片)
    let remoteImagePath = "";
    if (product.image && product.image.startsWith('data:image')) {
      try {
        const base64Data = product.image.split(',')[1];
        const contentType = product.image.split(',')[0].split(':')[1].split(';')[0];
        const buffer = Buffer.from(base64Data, 'base64');
        const formData = new FormData();
        const blob = new Blob([buffer], { type: contentType });
        formData.append('file', blob, `product_${productId}.${contentType.split('/')[1]}`);
        
        const uploadRes = await fetchWithTimeout(`${EXTERNAL_API_BASE_URL}/fact/product/upload-product-album.html`, {
          method: 'POST',
          headers: { 'Cookie': sessionCookie },
          body: formData,
          timeout: 30000 // 图片上传给 30 秒
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.error === 0) {
          remoteImagePath = uploadResult.file;
        }
      } catch (uploadError) {
        logger.error("[Sync] 图片上传失败:", uploadError);
      }
    }

    // 3. 构建请求体 (根据终端测试出的正确结构)
    const params = new URLSearchParams();
    params.append('platform', 'H5');
    params.append('sn', product.code);
    params.append('name', product.name);
    params.append('price', '0');
    params.append('productAttrPlaceholder', '1');
    
    if (remoteImagePath) {
      params.append('uploadAlbumFiles[]', remoteImagePath);
    }

    // 内容/备注
    const needleField = product.customFields.find(f => f.label.includes('针'));
    params.append('content', needleField ? needleField.value : "");

    // 4. 处理颜色 (Type: color)
    const timestamp = Date.now();
    let colorCount = 0;

    colors.forEach((colorName: string) => {
      const id = `TMP_C_${timestamp}_${colorCount++}`;
      
      params.append(`productAttrNames[${id}]`, colorName);
      params.append(`productAttrTypes[${id}]`, 'color'); 
      params.append(`productAttrEnables[${id}]`, '1');
      
      // 关联物料 (Yarn Usage)
      const colorYarns = product.yarnUsages.filter(y => y.color === colorName);
      colorYarns.forEach((yarn, yIdx) => {
        const mInfo = initData.materials.find((m: any) => m.name === yarn.materialName && m.spec === (yarn.specification || ""));
        if (mInfo) {
          // 用户要求：直接同步重量数字，不进行单位换算
          params.append(`productAttrColorMaterials[${colorName}][${yIdx}][material_id]`, mInfo.id);
          params.append(`productAttrColorMaterials[${colorName}][${yIdx}][number]`, yarn.weight || '0');
        }
      });
    });

    // 5. 处理尺码 (Type: size)
    let sizeCount = 0;
    sizes.forEach((sizeName: string) => {
      const id = `TMP_S_${timestamp}_${sizeCount++}`;
      
      params.append(`productAttrNames[${id}]`, sizeName);
      params.append(`productAttrTypes[${id}]`, 'size'); 
      params.append(`productAttrEnables[${id}]`, '1');
      
      // 用户要求：直接同步重量数字
      const totalWeight = product.yarnUsages.reduce((sum, y) => sum + (parseFloat(y.weight || '0') || 0), 0);
      if (totalWeight > 0) {
        params.append(`productAttrWeights[${id}]`, String(totalWeight));
      }
    });

    // 6. 发送 POST 请求
    const response = await fetchWithTimeout(`${EXTERNAL_API_BASE_URL}/fact/product/add.html`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': sessionCookie,
        'Referer': `${EXTERNAL_API_BASE_URL}/fact/product/add.html`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: params.toString(),
      timeout: 20000
    });

    const result = await response.json();
    
    if (result.error === 0) {
      await prisma.product.update({ where: { id: productId }, data: { isSynced: true } });
      revalidatePath('/');
      return { success: true, message: "同步成功" };
    } else {
      const errorMsg = result.errors?.[0]?.message || result.message || "同步失败";
      return { success: false, message: errorMsg };
    }

  } catch (error) {
    logger.error("[Sync] Exception:", error);
    return { success: false, message: "同步过程发生异常" };
  }
}

// 获取单位字典
export async function getExternalUnits() {
  if (!EXTERNAL_API_BASE_URL) return [];
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('external_session_cookie')?.value;
    if (!sessionCookie) return [];

    logger.debug("[InitData] 开始从 HTML 提取单位字典...");
    const response = await fetchWithTimeout(`${EXTERNAL_API_BASE_URL}/fact/material/add.html?platform=H5`, {
      method: 'GET',
      headers: { 'Cookie': sessionCookie },
      timeout: 10000
    });
    const html = await response.text();
    
    const unitMatch = html.match(/<select name="unit_id"[\s\S]*?<\/select>/);
    const units: { id: string, name: string }[] = [];
    
    if (unitMatch) {
      const options = unitMatch[0].match(/<option value="(\d+)".*?>([\s\S]*?)<\/option>/g);
      options?.forEach(opt => {
        const m = opt.match(/value="(\d+)".*?>([\s\S]*?)<\/option>/);
        if (m && m[1] !== '0') { // 排除“请选择”之类的空项
          units.push({ id: m[1], name: m[2].trim() });
        }
      });
    }
    logger.info(`[InitData] 单位拉取完成: ${units.length} 条`);
    return units;
  } catch (error) {
    logger.error("[InitData] 单位拉取异常:", error);
    return [];
  }
}

// 新增物料 (原料)
export async function addMaterial(params: {
  type: '1' | '2', // 1: 毛料, 2: 辅料
  name: string,
  color: string,
  spec: string,
  unit_id?: string
}) {
  if (!EXTERNAL_API_BASE_URL) return { success: false, message: "请配置域名" };
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('external_session_cookie')?.value;
    if (!sessionCookie) return { success: false, message: "请先连接生产系统" };

    const bodyParams = new URLSearchParams({
      platform: 'H5',
      type: params.type,
      name: params.name,
      color: params.color,
      spec: params.spec,
      unit_id: params.unit_id || '0'
    });

    logger.debug(`[MaterialAdd] 开始创建原料: 名称=${params.name}, 类型=${params.type}`);

    const response = await fetchWithTimeout(`${EXTERNAL_API_BASE_URL}/fact/material/add.html`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': sessionCookie
      },
      body: bodyParams.toString(),
      timeout: 10000
    });
    
    const result = await response.json();
    if (result.error === 0) {
      return { success: true, message: "增加成功" };
    } else {
      return { success: false, message: result.message || "增加失败" };
    }
  } catch (error) { 
    logger.error("[MaterialAdd] 发生异常:", error);
    return { success: false, message: "系统连接异常" }; 
  }
}

export async function addDictItem(type: string, name: string) {
  if (!EXTERNAL_API_BASE_URL) return false;
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('external_session_cookie')?.value;
    const typeMap: Record<string, string> = { 'color': '3', 'size': '2', 'material': '1' };
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (sessionCookie) headers['Cookie'] = sessionCookie;

    logger.debug(`[DictAdd] 开始创建字典项: 类型=${type}(${typeMap[type]}), 名称=${name}`);

    const response = await fetchWithTimeout(`${EXTERNAL_API_BASE_URL}/fact/dict/add.html`, {
      method: 'POST',
      headers,
      body: new URLSearchParams({ type: typeMap[type] || type, name, platform: 'H5' }).toString(),
      timeout: 10000
    });
    
    const result = await response.json();
    if (result.error === 0) {
      logger.info(`[DictAdd] 创建成功: ${name}`);
      return true;
    } else {
      logger.error(`[DictAdd] 创建失败: ${result.message || '未知错误'}`);
      return false;
    }
  } catch (error) { 
    logger.error("[DictAdd] 发生异常:", error);
    return false; 
  }
}

export async function getConnectedInfo() {
  const cookieStore = await cookies();
  const company = cookieStore.get('connected_company')?.value;
  const token = cookieStore.get('external_token')?.value;
  const userName = cookieStore.get('connected_user_name')?.value;
  const sessionCookie = cookieStore.get('external_session_cookie')?.value;

  if (!token || !sessionCookie) {
    return { isConnected: false, company: "", userName: "" };
  }

  // 增强校验：实时验证外部 Session 是否有效
  try {
    const res = await fetchWithTimeout(`${EXTERNAL_API_BASE_URL}/fact.html`, {
      headers: { 'Cookie': sessionCookie },
      timeout: 5000 
    });
    const html = await res.text();
    
    // 核心判定逻辑：
    // 1. 如果包含 logout.html，说明处于登录状态，直接返回正常
    if (html.includes('logout.html')) {
      return { isConnected: true, company: company || "", userName: userName || "" };
    }

    // 2. 如果不包含 logout.html，且包含以下任一特征，说明已掉线
    if (
      html.includes('fact/admin/login.html') || 
      html.includes('login-box') || 
      html.includes('请先登录') ||
      html.includes('fact/admin/login')
    ) {
      logger.info("[Verify] 确认 Session 已失效，正在清理本地凭证...");
      cookieStore.delete('external_token');
      cookieStore.delete('external_session_cookie');
      cookieStore.delete('connected_company');
      cookieStore.delete('connected_user_name');
      return { isConnected: false, company: "", userName: "" };
    }
  } catch (e) {
    logger.error("[Verify] 验证连接状态失败 (网络问题):", e);
  }

  // 默认保持现状，除非明确检测到登录页
  return { isConnected: !!token, company: company || "", userName: userName || "" };
}

export async function disconnectExternal() {
  const cookieStore = await cookies();
  cookieStore.delete('external_token');
  cookieStore.delete('external_session_cookie');
  cookieStore.delete('connected_company');
  cookieStore.delete('connected_user_name');
  revalidatePath('/');
}

// 获取所有款式列表 (瘦身版：不包含阶段附件的 Base64 数据)
export async function getProducts() {
  const startTime = Date.now();
  logger.debug("[getProducts] 正在刷新列表..."); 
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('external_token')?.value;
    const tenantId = cookieStore.get('connected_company')?.value;

    if (!token || !tenantId) {
      logger.debug("[getProducts] 未连接，不返回任何数据");
      return [];
    }

    logger.debug(`[getProducts] 开始极简列表查询, 租户=${tenantId}...`);
    const dbProducts = await prisma.product.findMany({
      where: { tenantId },
      select: {
        id: true,
        code: true,
        name: true,
        tenantId: true,
        status: true,
        isSynced: true,
        thumbnail: true, 
        createdAt: true,
        // 列表只需要知道进度状态，不需要字段和日志
        samples: {
          select: {
            id: true,
            name: true,
            stages: {
              select: { id: true, name: true, status: true, order: true },
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    const duration = Date.now() - startTime;
    logger.perf(`[getProducts] 查询完成, 数量=${dbProducts.length}`, startTime);
    
    return dbProducts.map(mapProduct)
  } catch (error) {
    logger.error("[getProducts] 查询失败:", error);
    return [];
  }
}

// 获取仪表盘初始数据 (极致优化：不再预取详情，只取列表)
export async function getInitialData() {
  const startTime = Date.now();
  logger.debug("[getInitialData] 开始合并加载基础数据...");
  
  try {
    const [products, templates, connectedInfo] = await Promise.all([
      getProducts(),
      getStageTemplates(),
      getConnectedInfo()
    ]);
    
    logger.perf("[getInitialData] 基础数据获取完成", startTime);
    return {
      products,
      templates,
      connectedInfo
    };
  } catch (error) {
    logger.error("[getInitialData] 失败:", error);
    return null;
  }
}

// 获取单个款式的完整详情 (包含附件的 Base64 数据)
export async function getProductDetail(productId: string) {
  try {
    const dbProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        customFields: true,
        yarnUsages: true,
        samples: {
          include: {
            stages: {
              include: { fields: true, attachments: true },
              orderBy: { order: 'asc' }
            },
            logs: { orderBy: { time: 'desc' } }
          }
        }
      }
    });
    return dbProduct ? mapProduct(dbProduct) : null;
  } catch (error) {
    logger.error("[getProductDetail] 失败:", error);
    return null;
  }
}

export async function getStageTemplates() {
  const cookieStore = await cookies();
  const token = cookieStore.get('external_token')?.value;
  const tenantId = cookieStore.get('connected_company')?.value;
  
  if (!token || !tenantId) return [];
  
  return await prisma.stageTemplate.findMany({ 
    where: { tenantId },
    orderBy: { order: 'asc' } 
  })
}

export async function deleteStageTemplate(id: string) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('connected_company')?.value || "default";
  await prisma.stageTemplate.delete({ 
    where: { id_tenantId: { id, tenantId } } 
  })
  revalidatePath('/')
}

export async function updateStageTemplateOrder(items: { id: string, order: number }[]) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('connected_company')?.value || "default";
  
  // 使用 transaction 批量更新
  await prisma.$transaction(
    items.map(item => prisma.stageTemplate.update({
      where: { id_tenantId: { id: item.id, tenantId } },
      data: { order: item.order }
    }))
  );
  
  revalidatePath('/')
}

export async function createProduct(data: {
  code: string,
  name: string,
  colors: string[],
  sizes: string[],
  yarnUsage: { color: string, materialName: string, specification?: string, weight?: string, unit?: string, materialColor?: string, materialType?: string }[],
  image?: string,
  thumbnail?: string,
  customFields: { label: string, value: string }[],
  stages: string[]
}) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('connected_company')?.value || "default";

  // 检查款号或品名是否重复
  const existing = await prisma.product.findFirst({
    where: {
      tenantId,
      OR: [
        { code: data.code },
        { name: data.name }
      ]
    }
  });

  if (existing) {
    if (existing.code === data.code) {
      return { success: false, message: `款号 "${data.code}" 已存在` };
    }
    return { success: false, message: `品名 "${data.name}" 已存在` };
  }

  for (const name of data.stages) {
    await prisma.stageTemplate.upsert({
      where: { 
        tenantId_name: { tenantId, name } 
      },
      update: {},
      create: { tenantId, name, order: 99 }
    })
  }
  const product = await prisma.product.create({
    data: {
      tenantId,
      code: data.code,
      name: data.name,
      colorsJson: JSON.stringify(data.colors),
      sizesJson: JSON.stringify(data.sizes),
      image: data.image,
      thumbnail: data.thumbnail,
      customFields: {
        create: data.customFields.map(f => ({ label: f.label, value: f.value }))
      },
      yarnUsages: {
        create: data.yarnUsage.map(y => ({
          color: y.color,
          materialName: y.materialName,
          specification: y.specification,
          weight: y.weight,
          unit: y.unit,
          materialColor: y.materialColor,
          materialType: y.materialType
        }))
      },
      samples: {
        create: [{
          name: '头样',
          stages: {
            create: data.stages.map((name, index) => ({
              name,
              order: index,
              status: index === 0 ? 'in_progress' : 'pending'
            }))
          }
        }]
      }
    },
    include: {
      customFields: true,
      yarnUsages: true,
      samples: {
        include: {
          stages: {
            include: { fields: true, attachments: true },
            orderBy: { order: 'asc' }
          },
          logs: { orderBy: { time: 'desc' } }
        }
      }
    }
  })
  revalidatePath('/')
  return { success: true, product: mapProduct(product) };
}

export async function updateProduct(id: string, data: {
  code: string,
  name: string,
  colors: string[],
  sizes: string[],
  yarnUsage: { color: string, materialName: string, specification?: string, weight?: string, unit?: string, materialColor?: string, materialType?: string }[],
  image?: string,
  thumbnail?: string,
  customFields: { label: string, value: string }[]
}) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('connected_company')?.value || "default";

  // 检查款号或品名是否与其他款式重复
  const existing = await prisma.product.findFirst({
    where: {
      tenantId,
      id: { not: id },
      OR: [
        { code: data.code },
        { name: data.name }
      ]
    }
  });

  if (existing) {
    if (existing.code === data.code) {
      return { success: false, message: `款号 "${data.code}" 已被其他款式占用` };
    }
    return { success: false, message: `品名 "${data.name}" 已被其他款式占用` };
  }

  await prisma.product.update({
    where: { id_tenantId: { id, tenantId } },
    data: {
      code: data.code,
      name: data.name,
      colorsJson: JSON.stringify(data.colors),
      sizesJson: JSON.stringify(data.sizes),
      image: data.image,
      thumbnail: data.thumbnail,
      customFields: {
        deleteMany: {},
        create: data.customFields.map(f => ({ label: f.label, value: f.value }))
      },
      yarnUsages: {
        deleteMany: {},
        create: data.yarnUsage.map(y => ({
          color: y.color,
          materialName: y.materialName,
          specification: y.specification,
          weight: y.weight,
          unit: y.unit,
          materialColor: y.materialColor,
          materialType: y.materialType
        }))
      }
    }
  })
  revalidatePath('/')
  const updatedProduct = await prisma.product.findUnique({
    where: { id_tenantId: { id, tenantId } },
    include: {
      customFields: true,
      yarnUsages: true,
      samples: {
        include: {
          stages: {
            include: { fields: true, attachments: true },
            orderBy: { order: 'asc' }
          },
          logs: { orderBy: { time: 'desc' } }
        }
      }
    }
  });
  return { success: true, product: updatedProduct ? mapProduct(updatedProduct) : null };
}

export async function createSampleVersion(productId: string, name: string) {
  const lastSample = await prisma.sampleVersion.findFirst({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    include: { stages: { orderBy: { order: 'asc' } } }
  })
  const newSample = await prisma.sampleVersion.create({
    data: {
      name,
      productId,
      stages: {
        create: lastSample?.stages.map((st, index) => ({
          name: st.name,
          order: st.order,
          status: index === 0 ? 'in_progress' : 'pending'
        })) || []
      }
    }
  })
  const cookieStore = await cookies();
  const userName = cookieStore.get('connected_user_name')?.value || '未知用户';

  await prisma.log.create({
    data: {
      sampleId: newSample.id,
      user: userName,
      action: '创建新轮次',
      detail: `从 ${lastSample?.name || '初始模板'} 派生新轮次: ${name}`
    }
  })
  revalidatePath('/')
  return newSample.id
}

export async function deleteSampleVersion(sampleId: string) {
  await prisma.sampleVersion.delete({ where: { id: sampleId } })
  revalidatePath('/')
}

export async function toggleProductStatus(id: string, currentStatus: string) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('connected_company')?.value || "default";
  await prisma.product.update({
    where: { id_tenantId: { id, tenantId } },
    data: { status: currentStatus === 'developing' ? 'archived' : 'developing' }
  })
  revalidatePath('/')
}

export async function toggleSyncStatus(id: string, currentSync: boolean) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('connected_company')?.value || "default";
  await prisma.product.update({
    where: { id_tenantId: { id, tenantId } },
    data: { isSynced: !currentSync }
  })
  revalidatePath('/')
}

export async function deleteProduct(id: string) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('connected_company')?.value || "default";
  await prisma.product.delete({ 
    where: { id_tenantId: { id, tenantId } } 
  })
  revalidatePath('/')
}

export async function updateStageInfo(params: {
  stageId: string,
  status: StageStatus,
  fields: { label: string, value: string, type: string }[],
  attachments: { id?: string, fileName: string, fileUrl: string }[],
  sampleId: string,
  userName: string, // 保留参数名以兼容前端调用，但内部改用 Cookie
  logDetail: string
}): Promise<{ success: boolean; message?: string; stage?: any; newLog?: any }> {
  try {
    const cookieStore = await cookies();
    const realUserName = cookieStore.get('connected_user_name')?.value || params.userName || '未知用户';

    // 1. 更新阶段基本信息
    const updatedStage = await prisma.stage.update({
      where: { id: params.stageId },
      data: {
        status: params.status,
        fields: {
          deleteMany: {},
          create: params.fields.map(f => ({ label: f.label, value: f.value, type: f.type }))
        }
      }
    })

    // 2. 处理附件：只创建带数据的“新”附件
    const newAttachments = params.attachments.filter(a => a.fileUrl.startsWith('data:'));
    if (newAttachments.length > 0) {
      await prisma.attachment.createMany({
        data: newAttachments.map(a => ({
          stageId: params.stageId,
          fileName: a.fileName,
          fileUrl: a.fileUrl
        }))
      });
    }
    
    // 3. 处理附件：删除不在当前列表中的附件 (使用 ID 判定，防止同名文件删除失败)
    const currentIds = params.attachments.map(a => a.id).filter(id => id && !id.startsWith('att-')) as string[];
    await prisma.attachment.deleteMany({
      where: {
        stageId: params.stageId,
        id: { notIn: currentIds }
      }
    });

    if (params.status === 'completed') {
      const nextStage = await prisma.stage.findFirst({
        where: { sampleId: params.sampleId, order: { gt: updatedStage.order } },
        orderBy: { order: 'asc' }
      })
      if (nextStage && nextStage.status === 'pending') {
        await prisma.stage.update({ where: { id: nextStage.id }, data: { status: 'in_progress' } })
      }
    }
    const newLog = await prisma.log.create({
      data: { sampleId: params.sampleId, user: realUserName, action: '更新状态/参数', detail: params.logDetail }
    })
    
    // 关键优化：返回给前端的结果中，剔除沉重的 fileUrl (Base64)
    const fullUpdatedStage = await prisma.stage.findUnique({
      where: { id: params.stageId },
      include: { 
        fields: true, 
        attachments: {
          select: { id: true, fileName: true, createdAt: true, stageId: true } // 不选 fileUrl
        } 
      }
    });
    
    return { 
      success: true, 
      stage: fullUpdatedStage,
      newLog: {
        id: newLog.id,
        user: newLog.user,
        action: newLog.action,
        detail: newLog.detail,
        time: newLog.time.toLocaleString('zh-CN', { hour12: false })
      }
    };
  } catch (error) {
    logger.error("[updateStageInfo] Error:", error);
    return { success: false, message: error instanceof Error ? error.message : "更新失败" };
  }
}

// 获取每日进度报表
export async function getDailyReport(dateStr: string) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('connected_company')?.value;
    
    if (!tenantId) {
      return [];
    }

    // 解析日期并设置为当天的起止时间
    const targetDate = new Date(dateStr);
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

    logger.debug(`[getDailyReport] 查询日期: ${dateStr}, 范围: ${dayStart} ~ ${dayEnd}`);

    // 查询该日期内所有状态变更为 completed 的日志
    const completionLogs = await prisma.log.findMany({
      where: {
        time: {
          gte: dayStart,
          lte: dayEnd
        },
        detail: {
          contains: '已完成'
        }
      },
      include: {
        sample: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        time: 'desc'
      }
    });

    // 从日志中提取节点名称并分组
    const reportMap = new Map<string, any[]>();

    for (const log of completionLogs) {
      // 过滤掉不属于当前租户的记录
      if (!log.sample?.product || log.sample.product.tenantId !== tenantId) continue;

      // 从日志详情中提取节点名称
      const nodeMatch = log.detail.match(/节点:\s*(.+?)\n/);
      const stageName = nodeMatch ? nodeMatch[1].trim() : '未知节点';

      if (!reportMap.has(stageName)) {
        reportMap.set(stageName, []);
      }

      // 检查是否已经添加过该款式（避免重复）
      const existing = reportMap.get(stageName)!.find(
        item => item.productId === log.sample.product!.id && item.sampleId === log.sample.id
      );

      if (!existing) {
        reportMap.get(stageName)!.push({
          productId: log.sample.product.id,
          sampleId: log.sample.id,
          productCode: log.sample.product.code,
          productName: log.sample.product.name,
          sampleName: log.sample.name,
          completedAt: log.time.toLocaleString('zh-CN', { hour12: false }),
          operator: log.user
        });
      }
    }

    // 转换为数组格式
    const report = Array.from(reportMap.entries()).map(([stageName, products]) => ({
      stageName,
      count: products.length,
      products
    }));

    logger.info(`[getDailyReport] 查询完成, 共 ${report.length} 个节点, ${completionLogs.length} 条记录`);

    return report;
  } catch (error) {
    logger.error("[getDailyReport] 查询失败:", error);
    return [];
  }
}

// 获取节点趋势报表 - 查看某个节点在过去N天的完成情况
export async function getStageTrendReport(stageName: string, days = 30) {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('connected_company')?.value;
    
    if (!tenantId) {
      return [];
    }

    // 计算起止时间
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    logger.debug(`[getStageTrendReport] 查询节点: ${stageName}, 范围: ${days}天`);

    // 查询该节点在该时间段内的所有完成记录
    const completionLogs = await prisma.log.findMany({
      where: {
        time: {
          gte: startDate,
          lte: endDate
        },
        detail: {
          contains: `节点: ${stageName}`
        },
        AND: {
          detail: {
            contains: '已完成'
          }
        }
      },
      include: {
        sample: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        time: 'desc'
      }
    });

    // 按日期分组统计
    const dailyMap = new Map<string, {
      date: string;
      count: number;
      products: { code: string; name: string; sampleName: string; time: string }[];
    }>();

    for (const log of completionLogs) {
      // 过滤掉不属于当前租户的记录
      if (!log.sample?.product || log.sample.product.tenantId !== tenantId) continue;

      // 提取日期（YYYY-MM-DD 格式）
      const dateKey = log.time.toISOString().split('T')[0];
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          count: 0,
          products: []
        });
      }

      const dayData = dailyMap.get(dateKey)!;
      
      // 检查是否已经添加过该款式（避免重复）
      const existing = dayData.products.find(
        p => p.code === log.sample.product!.code && p.sampleName === log.sample.name
      );

      if (!existing) {
        dayData.count++;
        dayData.products.push({
          code: log.sample.product.code,
          name: log.sample.product.name,
          sampleName: log.sample.name,
          time: log.time.toLocaleString('zh-CN', { hour12: false })
        });
      }
    }

    // 转换为数组并按日期倒序排列
    const trendData = Array.from(dailyMap.values()).sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    logger.info(`[getStageTrendReport] 查询完成, 共 ${trendData.length} 天有数据`);

    return trendData;
  } catch (error) {
    logger.error("[getStageTrendReport] 查询失败:", error);
    return [];
  }
}
