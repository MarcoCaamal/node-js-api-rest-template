import { PrismaClient } from '../src/generated/prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'

// Prisma 7 requires adapter configuration
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const isProduction = process.env.NODE_ENV === 'production'
const allowProdSeed = process.env.ALLOW_PROD_SEED === 'true'

if (isProduction && !allowProdSeed) {
  throw new Error(
    'Refusing to run seed in production. Set ALLOW_PROD_SEED=true only if you explicitly want this.'
  )
}

/**
 * Database Seeder for Identity Module (RBAC System)
 *
 * Seeds in order:
 * 1. Permissions (read-only, immutable)
 * 2. System Roles (SUPER_ADMIN, ADMIN, USER, GUEST)
 * 3. Initial SUPER_ADMIN user
 *
 * Run with: pnpm prisma db seed
 */

// ============================================================================
// 1. PERMISSIONS DATA
// ============================================================================

const PERMISSIONS = [
  // Users permissions
  { resource: 'users', action: 'create', description: 'Create new users' },
  { resource: 'users', action: 'read', description: 'View user details' },
  { resource: 'users', action: 'update', description: 'Update user information' },
  { resource: 'users', action: 'delete', description: 'Delete users (soft delete)' },

  // Roles permissions
  { resource: 'roles', action: 'create', description: 'Create custom roles' },
  { resource: 'roles', action: 'read', description: 'View role details' },
  { resource: 'roles', action: 'update', description: 'Update role information' },
  { resource: 'roles', action: 'delete', description: 'Delete custom roles' },

  // Permissions permissions (read-only)
  { resource: 'permissions', action: 'read', description: 'View permission details' },

  // Wildcard permissions (for ADMIN)
  { resource: '*', action: '*', description: 'Full system access (admin)' }
]

// ============================================================================
// 2. SYSTEM ROLES DATA
// ============================================================================

const SYSTEM_ROLES = [
  {
    name: 'ADMIN',
    description: 'System administrator with full access',
    isSystem: true,
    permissions: ['*:*'] // Everything
  },
  {
    name: 'USER',
    description: 'Authenticated user with basic permissions',
    isSystem: true,
    permissions: [
      'users:read', // Can view own profile
      'roles:read', // Can view role details (but not manage roles)
      'permissions:read' // Can view permissions (for transparency)
    ]
  },
  {
    name: 'GUEST',
    description: 'Guest user with no permissions',
    isSystem: true,
    permissions: [] // No permissions
  }
]

const MIN_ADMIN_PASSWORD_LENGTH = 12

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedPermissions() {
  console.log('🔐 Seeding permissions...')

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: {
        unique_permission_code: {
          resource: permission.resource,
          action: permission.action
        }
      },
      update: {
        description: permission.description
      },
      create: permission
    })
  }

  const count = await prisma.permission.count()
  console.log(`✅ Seeded ${count} permissions`)
}

async function seedRoles() {
  console.log('👥 Seeding system roles...')

  for (const roleData of SYSTEM_ROLES) {
    // Find permission IDs for this role
    const permissionRecords = await prisma.permission.findMany({
      where: {
        OR: roleData.permissions.map((code) => {
          const [resource, action] = code.split(':')
          return { resource, action }
        })
      }
    })

    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        description: roleData.description,
        isSystem: roleData.isSystem,
        permissions: {
          set: permissionRecords.map((p) => ({ id: p.id }))
        }
      },
      create: {
        name: roleData.name,
        description: roleData.description,
        isSystem: roleData.isSystem,
        permissions: {
          connect: permissionRecords.map((p) => ({ id: p.id }))
        }
      }
    })
  }

  const count = await prisma.role.count()
  console.log(`✅ Seeded ${count} roles`)
}

async function seedInitialAdmin() {
  console.log('👤 Seeding initial ADMIN user...')

  // Check if ADMIN already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: {
        name: 'ADMIN'
      },
      deletedAt: null
    }
  })

  if (existingAdmin) {
    console.log('⚠️  ADMIN user already exists, skipping...')
    return
  }

  const adminEmail = getRequiredEnv('ADMIN_EMAIL')
  const adminPassword = getRequiredEnv('ADMIN_PASSWORD')
  const adminFirstName = process.env.ADMIN_FIRST_NAME ?? 'System'
  const adminLastName = process.env.ADMIN_LAST_NAME ?? 'Administrator'

  if (adminPassword.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters long for security`
    )
  }

  // Find ADMIN role
  const adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' }
  })

  if (!adminRole) {
    throw new Error('ADMIN role not found. Run role seeds first.')
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  // Create user
  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      isActive: true,
      roleId: adminRole.id
    }
  })

  console.log('✅ Initial ADMIN user created')
  console.log('📧 Email:', adminEmail)
  console.log('🔐 Password was loaded from ADMIN_PASSWORD environment variable')
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} environment variable is required`)
  }

  return value
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  console.log('🌱 Starting database seed...\n')

  try {
    // Seed in order (permissions → roles → users)
    await seedPermissions()
    console.log('')

    await seedRoles()
    console.log('')

    await seedInitialAdmin()
    console.log('')

    console.log('✅ Database seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// ============================================================================
// EXECUTE SEED
// ============================================================================

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
