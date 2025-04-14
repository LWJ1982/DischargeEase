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

// Insert dummy users
async function insertDummyUsers() {
  const { User, Profile } = db;

  const dummyUsers = [
    {
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@hospital.com",
      password: "$2a$10$KLJ8HpSOk0GpHwUuRFyUI.DfYrRMQXEPqpsnw2aCUZXdoaYDWmEeG", // hashed "password123"
      role: "doctor",
      profileDetails: { specialty: "Cardiology", years_experience: 15 },
      Profile: {
        mobile: "85512345678",
        profile_picture: "/uploads/profiles/sarah.jpg"
      }
    },
    {
      name: "Nurse Mike Chen",
      email: "mike.chen@hospital.com",
      password: "$2b$10$PHbVtkrRRB8pCWqcCyXmcuUGpu/iZR9ZUlKuiNEVbgnJit/L2/Zyq",
      role: "nurse",
      profileDetails: { department: "Emergency", shift: "Morning" },
      Profile: {
        mobile: "85523456789",
        profile_picture: "/uploads/profiles/mike.jpg"
      }
    },
    {
      name: "Emma Wong",
      email: "emma.wong@email.com",
      password: "$2b$10$PHbVtkrRRB8pCWqcCyXmcuUGpu/iZR9ZUlKuiNEVbgnJit/L2/Zyq",
      role: "patient",
      profileDetails: { emergency_contact: "85534567890", blood_type: "O+" },
      Profile: {
        mobile: "85534567890",
        profile_picture: "/uploads/profiles/emma.jpg"
      }
    },
    {
      name: "Alex Martinez",
      email: "alex.martinez@email.com",
      password: "$2b$10$PHbVtkrRRB8pCWqcCyXmcuUGpu/iZR9ZUlKuiNEVbgnJit/L2/Zyq",
      role: "caregiver",
      profileDetails: { relation: "Son", years_experience: 3 },
      Profile: {
        mobile: "85545678901",
        profile_picture: "/uploads/profiles/alex.jpg"
      }
    },
    {
      name: "Admin User",
      email: "admin@hospital.com",
      password: "$2b$10$PHbVtkrRRB8pCWqcCyXmcuUGpu/iZR9ZUlKuiNEVbgnJit/L2/Zyq",
      role: "admin",
      profileDetails: { department: "IT" },
      Profile: {
        mobile: "85556789012",
        profile_picture: "/uploads/profiles/admin.jpg"
      }
    }
  ];

  for (const userData of dummyUsers) {
    const profileData = userData.Profile;
    delete userData.Profile;

    // Create user with profile in a transaction
    await sequelize.transaction(async (t) => {
      const user = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData,
        transaction: t
      });

      // If user was created (not found), create their profile
      if (user[1]) {
        await Profile.create(
          {
            user_id: user[0].id,
            ...profileData
          },
          { transaction: t }
        );
      }
    });
  }

  console.log("🟢 Dummy users inserted.");
}

// Insert dummy patient records
async function insertDummyPatientRecords() {
  const { PatientRecord, User } = db;

  // Get patient user IDs
  const patientUsers = await User.findAll({
    where: { role: "patient" }
  });

  if (patientUsers.length === 0) {
    console.log("⚠️ No patient users found. Skipping patient records insertion.");
    return;
  }

  const dummyRecords = [
    {
      patient_id: patientUsers[0].id,
      name: patientUsers[0].name,
      ward: "Cardiology - Ward 3B",
      medical_history: "Hypertension, underwent bypass surgery in 2022. Regular medication includes Lisinopril and low-dose aspirin.",
      drawings: ["/uploads/drawings/patient1_ecg.png", "/uploads/drawings/patient1_heart.png"]
    }
  ];

  // Add more records for the same patient if they don't exist yet
  if (patientUsers.length > 0) {
    const existingRecords = await PatientRecord.count({
      where: { patient_id: patientUsers[0].id }
    });

    if (existingRecords === 0) {
      for (const record of dummyRecords) {
        await PatientRecord.create(record);
      }
      console.log("🟢 Dummy patient records inserted.");
    } else {
      console.log("⚠️ Patient records already exist. Skipping insertion.");
    }
  }
}

// Master function to insert all dummy data
async function insertDummyData() {
  try {
    await insertDefaultServices();
    await insertDummyUsers();
    await insertDummyPatientRecords();
    console.log("ദ്ദി(˵ •̀ ᴗ - ˵ )✧🟢👍 All dummy data inserted successfully.");
  } catch (error) {
    console.error("p(●｀□´●)q 🔴👎 Error inserting dummy data:", error);
  }
}

// Attach to db object for optional use elsewhere
db.insertDefaultServices = insertDefaultServices;
db.insertDummyUsers = insertDummyUsers;
db.insertDummyPatientRecords = insertDummyPatientRecords;
db.insertDummyData = insertDummyData;


db.sequelize = sequelize;
db.Sequelize = Sequelize;

insertDummyData().catch(err => console.error("Error populating dummy data:", err));
module.exports = db;