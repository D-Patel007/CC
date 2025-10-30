const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@umb.edu' },
    update: {
      name: 'Demo User',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    },
    create: {
      supabaseId: 'demo-supabase-user',
      name: 'Demo User',
      email: 'demo@umb.edu',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    },
  })

  const [furniture, electronics, books, clothing] = await Promise.all([
    prisma.category.upsert({ where: { slug: 'furniture' }, update: {}, create: { name: 'Furniture', slug: 'furniture' } }),
    prisma.category.upsert({ where: { slug: 'electronics' }, update: {}, create: { name: 'Electronics', slug: 'electronics' } }),
    prisma.category.upsert({ where: { slug: 'books' }, update: {}, create: { name: 'Books', slug: 'books' } }),
    prisma.category.upsert({ where: { slug: 'clothing' }, update: {}, create: { name: 'Clothing', slug: 'clothing' } }),
  ])

  await prisma.listing.createMany({
    data: [
      { title: 'IKEA Desk (white)', description: 'Pickup near campus. Minor scratches.', priceCents: 4500, imageUrl: '', condition: 'GOOD', sellerId: user.id, categoryId: furniture.id },
      { title: 'MacBook Air M1 8/256', description: 'Great battery, includes charger.', priceCents: 55000, imageUrl: '', condition: 'LIKE_NEW', sellerId: user.id, categoryId: electronics.id },
      { title: 'Discrete Math Textbook', description: 'Highlighting in a few chapters.', priceCents: 2500, imageUrl: '', condition: 'USED', sellerId: user.id, categoryId: books.id },
    ],
    skipDuplicates: true,
  })
}

main().then(()=>prisma.$disconnect()).catch(e=>{console.error(e); prisma.$disconnect()})
