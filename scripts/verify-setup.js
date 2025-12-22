#!/usr/bin/env node

/**
 * Script de vérification de la configuration LinkedIn
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Vérification de la configuration LinkedIn...\n')

let allGood = true

// Vérifier ENCRYPTION_KEY
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  if (envContent.includes('ENCRYPTION_KEY=')) {
    const keyMatch = envContent.match(/ENCRYPTION_KEY=([a-f0-9]{64})/)
    if (keyMatch && keyMatch[1].length === 64) {
      console.log('✅ ENCRYPTION_KEY configurée (64 caractères hex)')
    } else {
      console.log('❌ ENCRYPTION_KEY invalide (doit faire 64 caractères hex)')
      allGood = false
    }
  } else {
    console.log('❌ ENCRYPTION_KEY manquante dans .env')
    allGood = false
  }
} else {
  console.log('❌ Fichier .env non trouvé')
  allGood = false
}

// Vérifier Puppeteer
try {
  require.resolve('puppeteer')
  console.log('✅ Puppeteer installé')
} catch (e) {
  console.log('❌ Puppeteer non installé - exécutez: npm install puppeteer')
  allGood = false
}

// Vérifier les fichiers de service
const services = [
  'src/lib/services/linkedin-cache.ts',
  'src/lib/services/linkedin-enrichment.ts',
  'src/lib/services/linkedin-pool.ts',
  'src/lib/services/linkedin-risk-detection.ts',
  'src/lib/services/linkedin-scraper.ts',
  'src/lib/utils/encryption.ts',
]

console.log('\n📁 Vérification des fichiers de service...')
services.forEach(service => {
  const filePath = path.join(process.cwd(), service)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${service}`)
  } else {
    console.log(`❌ ${service} manquant`)
    allGood = false
  }
})

// Vérifier la migration SQL
const migrationPath = path.join(process.cwd(), 'prisma/migrations/add_linkedin_fields.sql')
if (fs.existsSync(migrationPath)) {
  console.log('\n✅ Migration SQL prête: prisma/migrations/add_linkedin_fields.sql')
  console.log('   ⚠️  À exécuter manuellement dans Supabase SQL Editor')
} else {
  console.log('\n❌ Migration SQL manquante')
  allGood = false
}

// Résumé
console.log('\n' + '='.repeat(50))
if (allGood) {
  console.log('✅ Configuration complète !')
  console.log('\n📋 Prochaines étapes:')
  console.log('   1. Exécutez la migration SQL dans Supabase')
  console.log('   2. (Optionnel) Configurez LinkedIn OAuth dans .env')
  console.log('   3. Testez l\'enrichissement depuis /candidates/new')
} else {
  console.log('❌ Certains éléments manquent - vérifiez ci-dessus')
}
console.log('='.repeat(50))

process.exit(allGood ? 0 : 1)

