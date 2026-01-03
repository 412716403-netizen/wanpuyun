'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Product, StageStatus } from '@/types'
import { cookies } from 'next/headers'

// 将 Prisma 的数据格式转换为前端定义的类型格式
function mapProduct(dbProduct: any): Product {
  return {
    id: dbProduct.id,
    code: dbProduct.code,
    name: dbProduct.name,
    colors: JSON.parse(dbProduct.colorsJson || "[]"),
    sizes: JSON.parse(dbProduct.sizesJson || "[]"),
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
    createdAt: dbProduct.createdAt.toISOString().split('T')[0],
    customFields: dbProduct.customFields.map((cf: any) => ({
      id: cf.id,
      label: cf.label,
      value: cf.value,
    })),
    samples: dbProduct.samples.map((s: any) => ({
      id: s.id,
      name: s.name,
      logs: s.logs.map((l: any) => ({
        id: l.id,
        user: l.user,
        action: l.action,
        detail: l.detail,
        time: l.time.toLocaleString(),
      })),
      stages: s.stages.map((st: any) => ({
        id: st.id,
        name: st.name,
        status: st.status as StageStatus,
        updatedAt: st.updatedAt.toLocaleDateString(),
        fields: st.fields.map((f: any) => ({
          id: f.id,
          label: f.label,
          type: f.type,
          value: f.value,
        })),
        attachments: st.attachments?.map((a: any) => ({
          id: a.id,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
        })) || [],
      })),
    })),
  }
}

// 外部接口配置
const EXTERNAL_API_BASE_URL = "https://www.wanpuxx.com"; 

export async function externalLogin(company: string, user: string, pass: string) {
  if (!EXTERNAL_API_BASE_URL) return { success: false, message: "请配置域名" };
  try {
    const response = await fetch(`${EXTERNAL_API_BASE_URL}/fact/admin/login.html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ fact: company, username: user, password: pass, platform: 'H5' }).toString(),
    });

    const setCookieHeader = response.headers.get('set-cookie');
    const result = await response.json();
    
    if (result.error === 0) {
      const cookieStore = await cookies();
      if (setCookieHeader) {
        const valid_cookies = setCookieHeader.split(/,(?=\s*[^,;]+=[^,;]+)/).map(c => c.trim().split(';')[0]).filter(c => !c.includes('=deleted'));
        if (valid_cookies.length > 0) {
          const cookie_string = valid_cookies.join('; ');
          cookieStore.set('external_session_cookie', cookie_string, { path: '/', maxAge: 60 * 60 * 24 * 7 });
          const match = cookie_string.match(/advanced-frontend-fact=([^;]+)/);
          if (match) cookieStore.set('external_token', match[1], { path: '/', maxAge: 60 * 60 * 24 * 7 });
        }
      }
      cookieStore.set('connected_company', company, { path: '/', maxAge: 60 * 60 * 24 * 7 });
      return { success: true, message: "连接成功" };
    }
    return { success: false, message: result.message || "登录失败" };
  } catch (error) { return { success: false, message: "连接异常" }; }
}

// 获取商品录入所需的初始化数据（颜色、尺码、原料）
export async function getGoodsInitData() {
  if (!EXTERNAL_API_BASE_URL) return null;
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('external_session_cookie')?.value;
    if (!sessionCookie) return null;

    const headers: Record<string, string> = { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': sessionCookie 
    };

    // 1. 获取颜色 (type=3) 和 尺码 (type=2)
    const [cRes, sRes, mRes] = await Promise.all([
      fetch(`${EXTERNAL_API_BASE_URL}/fact/dict/list-data.html`, { method: 'POST', headers, body: 'type=3&platform=H5&limit=1000&pageSize=1000&per-page=1000' }),
      fetch(`${EXTERNAL_API_BASE_URL}/fact/dict/list-data.html`, { method: 'POST', headers, body: 'type=2&platform=H5&limit=1000&pageSize=1000&per-page=1000' }),
      fetch(`${EXTERNAL_API_BASE_URL}/fact/material/list-data.html`, { method: 'POST', headers, body: 'platform=H5&limit=1000&pageSize=1000&per-page=1000' })
    ]);

    const [cData, sData, mData] = await Promise.all([cRes.json(), sRes.json(), mRes.json()]);

    const colors = (cData.data || []).map((item: any) => ({ id: String(item.dict_id), name: item.name }));
    const sizes = (sData.data || []).map((item: any) => ({ id: String(item.dict_id), name: item.name }));
    const materials = (mData.data || []).map((item: any) => ({
      id: String(item.material_id),
      name: item.name,
      spec: item.spec || "",
      color: item.color || "",
      unit: (item.unit_name === '千克' || item.unit_name === 'kg') ? '克' : (item.unit_name || ""),
      type: item.type?.replace(/<[^>]+>/g, '') || "" // 提取 "毛料" 或 "辅料"
    }));

    return { colors, sizes, materials };
  } catch (error) { 
    console.error("[InitData] 严重异常:", error);
    return null; 
  }
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
        
        const uploadRes = await fetch(`${EXTERNAL_API_BASE_URL}/fact/product/upload-product-album.html`, {
          method: 'POST',
          headers: { 'Cookie': sessionCookie },
          body: formData
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.error === 0) {
          remoteImagePath = uploadResult.file;
        }
      } catch (uploadError) {
        console.error("[Sync] 图片上传失败:", uploadError);
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
        const mInfo = initData.materials.find(m => m.name === yarn.materialName && m.spec === (yarn.specification || ""));
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
    const response = await fetch(`${EXTERNAL_API_BASE_URL}/fact/product/add.html`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': sessionCookie,
        'Referer': `${EXTERNAL_API_BASE_URL}/fact/product/add.html`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: params.toString()
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
    console.error("[Sync] Exception:", error);
    return { success: false, message: "同步过程发生异常" };
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
    const response = await fetch(`${EXTERNAL_API_BASE_URL}/fact/dict/add.html`, {
      method: 'POST',
      headers,
      body: new URLSearchParams({ type: typeMap[type] || type, name, platform: 'H5' }).toString()
    });
    const result = await response.json();
    return result.error === 0;
  } catch (error) { return false; }
}

export async function getConnectedInfo() {
  const cookieStore = await cookies();
  const company = cookieStore.get('connected_company')?.value;
  const token = cookieStore.get('external_token')?.value;
  return { isConnected: !!token, company: company || "" };
}

export async function disconnectExternal() {
  const cookieStore = await cookies();
  cookieStore.delete('external_token');
  cookieStore.delete('external_session_cookie');
  cookieStore.delete('connected_company');
  revalidatePath('/');
}

export async function getProducts() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('connected_company')?.value || "default";

  const dbProducts = await prisma.product.findMany({
    where: { tenantId },
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
    },
    orderBy: { createdAt: 'desc' }
  })
  return dbProducts.map(mapProduct)
}

export async function getStageTemplates() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('connected_company')?.value || "default";
  return await prisma.stageTemplate.findMany({ 
    where: { tenantId },
    orderBy: { order: 'asc' } 
  })
}

export async function deleteStageTemplate(id: string) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('connected_company')?.value || "default";
  await prisma.stageTemplate.delete({ 
    where: { id, tenantId } 
  })
  revalidatePath('/')
}

export async function createProduct(data: {
  code: string,
  name: string,
  colors: string[],
  sizes: string[],
  yarnUsage: { color: string, materialName: string, specification?: string, weight?: string, unit?: string, materialColor?: string, materialType?: string }[],
  image?: string,
  customFields: { label: string, value: string }[],
  stages: string[]
}) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('connected_company')?.value || "default";

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
              status: 'pending'
            }))
          }
        }]
      }
    }
  })
  revalidatePath('/')
  return product.id
}

export async function updateProduct(id: string, data: {
  code: string,
  name: string,
  colors: string[],
  sizes: string[],
  yarnUsage: { color: string, materialName: string, specification?: string, weight?: string, unit?: string, materialColor?: string, materialType?: string }[],
  image?: string,
  customFields: { label: string, value: string }[]
}) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('connected_company')?.value || "default";

  await prisma.product.update({
    where: { id, tenantId },
    data: {
      code: data.code,
      name: data.name,
      colorsJson: JSON.stringify(data.colors),
      sizesJson: JSON.stringify(data.sizes),
      image: data.image,
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
        create: lastSample?.stages.map(st => ({
          name: st.name,
          order: st.order,
          status: 'pending'
        })) || []
      }
    }
  })
  await prisma.log.create({
    data: {
      sampleId: newSample.id,
      user: 'Jun Zheng',
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
    where: { id, tenantId },
    data: { status: currentStatus === 'developing' ? 'archived' : 'developing' }
  })
  revalidatePath('/')
}

export async function toggleSyncStatus(id: string, currentSync: boolean) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('connected_company')?.value || "default";
  await prisma.product.update({
    where: { id, tenantId },
    data: { isSynced: !currentSync }
  })
  revalidatePath('/')
}

export async function deleteProduct(id: string) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('connected_company')?.value || "default";
  await prisma.product.delete({ where: { id, tenantId } })
  revalidatePath('/')
}

export async function updateStageInfo(params: {
  stageId: string,
  status: StageStatus,
  fields: { label: string, value: string, type: string }[],
  attachments: { fileName: string, fileUrl: string }[],
  sampleId: string,
  userName: string,
  logDetail: string
}) {
  const updatedStage = await prisma.stage.update({
    where: { id: params.stageId },
    data: {
      status: params.status,
      fields: {
        deleteMany: {},
        create: params.fields.map(f => ({ label: f.label, value: f.value, type: f.type }))
      },
      attachments: {
        deleteMany: {},
        create: params.attachments.map(a => ({ fileName: a.fileName, fileUrl: a.fileUrl }))
      }
    }
  })
  if (params.status === 'completed') {
    const nextStage = await prisma.stage.findFirst({
      where: { sampleId: params.sampleId, order: { gt: updatedStage.order } },
      orderBy: { order: 'asc' }
    })
    if (nextStage && nextStage.status === 'pending') {
      await prisma.stage.update({ where: { id: nextStage.id }, data: { status: 'in_progress' } })
    }
  }
  await prisma.log.create({
    data: { sampleId: params.sampleId, user: params.userName, action: '更新状态/参数', detail: params.logDetail }
  })
  revalidatePath('/')
}
