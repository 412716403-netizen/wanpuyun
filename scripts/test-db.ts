import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    const count = await prisma.product.count()
    console.log('Database Connection Success!')
    console.log('Total Products:', count)
    
    // Test the specific problematic query
    const products = await prisma.product.findMany({
      include: {
        samples: {
          include: {
            stages: {
              include: {
                attachments: true
              }
            }
          }
        }
      }
    })
    console.log('Query with attachments success!')
  } catch (e) {
    console.error('Database Connection Failed:')
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

test()

