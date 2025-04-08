// index.js
// This file initializes the Sequelize instance and imports all models in the directory.
// It also sets up associations between models if any exist.
// This is the main entry point for the models in the application.
// server/models/index.js

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const db = {};

// Create Sequelize instance
const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.DB_STORAGE || "./database.sqlite",
    logging: process.env.NODE_ENV === "development" ? console.log : false
  }
);

// Import all model files in the directory
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

// Set up associations if any
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});


// Insert default services
async function insertDefaultServices() {
  const { Service } = db;

  const defaultServices = [
    {
      service_name: 'discharge medication counselling',
      description: 'To allow for medication query with nurse',
    },
    {
      service_name: 'caregiver training',
      description: 'To train the caregiver to take care of the patient',
    },
    {
      service_name: 'home assessment',
      description: 'CareGiver to perform assessment of home',
    }
  ];

  for (const service of defaultServices) {
    await Service.findOrCreate({
      where: { service_name: service.service_name },
      defaults: service
    });
  }

  console.log("🟢 Default services inserted.");
}

// Attach to db object for optional use elsewhere
db.insertDefaultServices = insertDefaultServices;


db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
