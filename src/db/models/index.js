import { Sequelize } from 'sequelize'
import sequelize from '../config/db.js'
import Organization from './Organization.js'
import User from './User.js'
import Lead from './Lead.js'
import { logger } from '../../support/logger.js'

const db = {}

db.Organization = Organization
db.User = User
db.Lead = Lead

Organization.hasMany(User, { foreignKey: 'organization_id' })
User.belongsTo(Organization, { foreignKey: 'organization_id' })

// Organization → Leads
Organization.hasMany(Lead, { foreignKey: 'organization_id' })
Lead.belongsTo(Organization, { foreignKey: 'organization_id' })

// User → Leads (assigned_to)
User.hasMany(Lead, { foreignKey: 'assigned_to', as: 'assignedLeads' })
Lead.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' })

// User → Leads (added_by)
User.hasMany(Lead, { foreignKey: 'added_by', as: 'createdLeads' })
Lead.belongsTo(User, { foreignKey: 'added_by', as: 'creator' })


Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

// ✅ Exported separately — call this once at server startup
export async function initDB () {
  try {
    await sequelize.authenticate()
    logger.info('Database connection established successfully.')
  } catch (error) {
    logger.error('Unable to connect to the database:', error)
    process.exit(1)
  }
}

export default db
export { sequelize, Sequelize }
