// Quick script to add categories to the database
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addCategories() {
  console.log('Adding categories...')
  
  const categories = [
    { name: 'Furniture', slug: 'furniture' },
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Books', slug: 'books' },
    { name: 'Clothing', slug: 'clothing' },
    { name: 'Appliances', slug: 'appliances' },
    { name: 'School Supplies', slug: 'school-supplies' },
    { name: 'Sports Equipment', slug: 'sports-equipment' },
    { name: 'Other', slug: 'other' }
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat
    })
    console.log(`✓ ${cat.name}`)
  }

  console.log('Done!')
  await prisma.$disconnect()
}

addCategories().catch(e => {
  console.error(e)
  process.exit(1)
})
