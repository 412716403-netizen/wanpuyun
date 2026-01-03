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
      weight: y.weight || ""
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

    const colors = (cData.data || []).map((item: any) => ({ id: `c-${item.dict_id}`, name: item.name }));
    const sizes = (sData.data || []).map((item: any) => ({ id: `s-${item.dict_id}`, name: item.name }));
    const materials = (mData.data || []).map((item: any) => ({
      id: String(item.material_id),
      name: item.name,
      spec: item.spec || "",
      color: item.color || "",
      unit: item.unit_name || ""
    }));

    return { colors, sizes, materials };
  } catch (error) { 
    console.error("[InitData] 严重异常:", error);
    return null; 
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
  const dbProducts = await prisma.product.findMany({
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
  return await prisma.stageTemplate.findMany({ orderBy: { order: 'asc' } })
}

export async function deleteStageTemplate(id: string) {
  await prisma.stageTemplate.delete({ where: { id } })
  revalidatePath('/')
}

export async function createProduct(data: {
  code: string,
  name: string,
  colors: string[],
  sizes: string[],
  yarnUsage: { color: string, materialName: string, specification?: string, weight?: string }[],
  image?: string,
  customFields: { label: string, value: string }[],
  stages: string[]
}) {
  for (const name of data.stages) {
    await prisma.stageTemplate.upsert({
      where: { name },
      update: {},
      create: { name, order: 99 }
    })
  }
  const product = await prisma.product.create({
    data: {
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
          weight: y.weight
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
  yarnUsage: { color: string, materialName: string, specification?: string, weight?: string }[],
  image?: string,
  customFields: { label: string, value: string }[]
}) {
  await prisma.product.update({
    where: { id },
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
          weight: y.weight
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
  await prisma.product.update({
    where: { id },
    data: { status: currentStatus === 'developing' ? 'archived' : 'developing' }
  })
  revalidatePath('/')
}

export async function toggleSyncStatus(id: string, currentSync: boolean) {
  await prisma.product.update({
    where: { id },
    data: { isSynced: !currentSync }
  })
  revalidatePath('/')
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } })
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
