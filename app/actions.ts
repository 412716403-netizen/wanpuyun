'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Product, StageStatus } from '@/types'

// 将 Prisma 的数据格式转换为前端定义的类型格式
function mapProduct(dbProduct: any): Product {
  return {
    ...dbProduct,
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

// 获取所有款式
export async function getProducts() {
  const dbProducts = await prisma.product.findMany({
    include: {
      customFields: true,
      samples: {
        include: {
          stages: {
            include: {
              fields: true,
              attachments: true
            },
            orderBy: {
              order: 'asc'
            }
          },
          logs: {
            orderBy: {
              time: 'desc'
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return dbProducts.map(mapProduct)
}

// 获取所有节点模板
export async function getStageTemplates() {
  return await prisma.stageTemplate.findMany({
    orderBy: {
      order: 'asc'
    }
  })
}

// 删除节点模板
export async function deleteStageTemplate(id: string) {
  await prisma.stageTemplate.delete({
    where: { id }
  })
  revalidatePath('/')
}

// 创建新款式
export async function createProduct(data: {
  code: string,
  name: string,
  image?: string,
  customFields: { label: string, value: string }[],
  stages: string[]
}) {
  // 自动将新节点名加入模板库
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
      image: data.image,
      customFields: {
        create: data.customFields.map(f => ({ label: f.label, value: f.value }))
      },
      samples: {
        create: [
          {
            name: '头样',
            stages: {
              create: data.stages.map((name, index) => ({
                name,
                order: index,
                status: 'pending'
              }))
            }
          }
        ]
      }
    }
  })

  revalidatePath('/')
  return product.id
}

// 更新款式基本信息
export async function updateProduct(id: string, data: {
  code: string,
  name: string,
  image?: string,
  customFields: { label: string, value: string }[]
}) {
  await prisma.product.update({
    where: { id },
    data: {
      code: data.code,
      name: data.name,
      image: data.image,
      customFields: {
        deleteMany: {},
        create: data.customFields.map(f => ({ label: f.label, value: f.value }))
      }
    }
  })

  revalidatePath('/')
}

// 新增样衣轮次
export async function createSampleVersion(productId: string, name: string) {
  // 1. 获取当前产品最近的一个样衣轮次，用于复制流程节点结构
  const lastSample = await prisma.sampleVersion.findFirst({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    include: {
      stages: {
        orderBy: { order: 'asc' }
      }
    }
  })

  // 2. 创建新轮次
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

  // 3. 记录日志
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

// 删除样衣轮次
export async function deleteSampleVersion(sampleId: string) {
  await prisma.sampleVersion.delete({
    where: { id: sampleId }
  })
  revalidatePath('/')
}

// 更新款式状态 (归档/激活)
export async function toggleProductStatus(id: string, currentStatus: string) {
  await prisma.product.update({
    where: { id },
    data: {
      status: currentStatus === 'developing' ? 'archived' : 'developing'
    }
  })
  revalidatePath('/')
}

// 更新同步状态
export async function toggleSyncStatus(id: string, currentSync: boolean) {
  await prisma.product.update({
    where: { id },
    data: {
      isSynced: !currentSync
    }
  })
  revalidatePath('/')
}

// 更新节点信息 (状态和参数)
export async function updateStageInfo(params: {
  stageId: string,
  status: StageStatus,
  fields: { label: string, value: string, type: string }[],
  attachments: { fileName: string, fileUrl: string }[],
  sampleId: string,
  userName: string,
  logDetail: string
}) {
  // 1. 更新当前节点状态
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

  // 2. 如果当前节点标记为“已完成”，则自动将下一个“待开始”的节点设为“进行中”
  if (params.status === 'completed') {
    const nextStage = await prisma.stage.findFirst({
      where: {
        sampleId: params.sampleId,
        order: {
          gt: updatedStage.order
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    if (nextStage && nextStage.status === 'pending') {
      await prisma.stage.update({
        where: { id: nextStage.id },
        data: { status: 'in_progress' }
      })
    }
  }

  // 3. 记录日志
  await prisma.log.create({
    data: {
      sampleId: params.sampleId,
      user: params.userName,
      action: '更新状态/参数',
      detail: params.logDetail
    }
  })

  revalidatePath('/')
}

