import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 清理现有数据
  await prisma.log.deleteMany()
  await prisma.stageField.deleteMany()
  await prisma.stage.deleteMany()
  await prisma.sampleVersion.deleteMany()
  await prisma.productCustomField.deleteMany()
  await prisma.yarnUsage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.stageTemplate.deleteMany()

  console.log('正在注入初始数据...')

  // 创建节点模板
  const templates = [
    { name: '设计与工艺单', order: 0 },
    { name: '纱线与色样', order: 1 },
    { name: '横机编程', order: 2 },
    { name: '衣片机织', order: 3 },
    { name: '套口组装', order: 4 },
    { name: '后整洗水', order: 5 },
    { name: '尺寸质检', order: 6 },
    { name: '成品包装', order: 7 },
  ]

  for (const t of templates) {
    await prisma.stageTemplate.upsert({
      where: { 
        tenantId_name: { 
          tenantId: 'default', 
          name: t.name 
        } 
      },
      update: { order: t.order },
      create: { tenantId: 'default', name: t.name, order: t.order },
    })
  }

  // 创建款式 PROD-1
  const product1 = await prisma.product.create({
    data: {
      tenantId: 'default',
      code: '202020',
      name: '202020',
      status: 'developing',
      isSynced: true,
      image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=300&auto=format&fit=crop',
      customFields: {
        create: [
          { label: '针型', value: '12G' },
          { label: '成分', value: '100% Cashmere' },
          { label: '颜色', value: '燕麦色 Oatmeal' },
          { label: '季节', value: '2024 AW' },
        ],
      },
      samples: {
        create: [
          {
            name: '头样',
            stages: {
              create: [
                {
                  name: '设计与工艺单',
                  status: 'completed',
                  order: 0,
                  fields: {
                    create: [
                      { label: '尺寸', value: '衣长55 胸围60', type: 'text' }
                    ]
                  }
                },
                {
                  name: '尺寸质检',
                  status: 'in_progress',
                  order: 1,
                }
              ]
            },
            logs: {
              create: [
                { user: 'Jun Zheng', action: '修改状态', detail: '设计与工艺单 -> 已完成' },
                { user: 'Jun Zheng', action: '新增参数', detail: '录入尺寸: 衣长55 胸围60' },
              ]
            }
          }
        ]
      }
    }
  })

  // 再创建一个款式作为对比
  await prisma.product.create({
    data: {
      tenantId: 'default',
      code: 'SY-8821',
      name: '复古粗花呢毛衣',
      status: 'developing',
      isSynced: false,
      image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=300&auto=format&fit=crop',
      customFields: {
        create: [
          { label: '针型', value: '7G' },
          { label: '成分', value: '80% Wool, 20% Nylon' },
          { label: '季节', value: '2024 AW' },
        ],
      },
      samples: {
        create: [
          {
            name: '头样',
            stages: {
              create: [
                { name: '设计与工艺单', status: 'completed', order: 0 },
                { name: '纱线与色样', status: 'pending', order: 1 },
              ]
            }
          }
        ]
      }
    }
  })

  console.log('数据注入成功！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
