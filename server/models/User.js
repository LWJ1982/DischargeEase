// models/User.js

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      // email_verified: {
      //   type: DataTypes.BOOLEAN,
      //   defaultValue: false,
      // },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [['doctor', 'nurse', 'caregiver', 'admin', 'patient']],
        }
      },
      profileDetails: {
        type: DataTypes.JSON, // Map structure in SQLite
        allowNull: true
      }
    }, {
    tableName: 'users'
  });


  // Associations
  User.associate = (models) => {

// One-to-One relationship with Profile
User.hasOne(models.Profile, {
  foreignKey: 'user_id',
  as: 'Profile',
  onDelete: 'CASCADE',
});

// One-to-Many relationship with PatientRecord
User.hasMany(models.PatientRecord, {
  foreignKey: 'patient_id',
  as: 'PatientRecords',
  onDelete: 'CASCADE',
});

// One-to-Many relationship with ServiceBooking (as patient)
User.hasMany(models.ServiceBooking, {
  foreignKey: 'patient_id',
  as: 'ServiceBookingsAsPatient',
  onDelete: 'CASCADE',
});

// One-to-Many relationship with ServiceBooking (as nurse)
User.hasMany(models.ServiceBooking, {
  foreignKey: 'nurse_id',
  as: 'ServiceBookingsAsNurse',
  onDelete: 'SET NULL',
});

// One-to-Many relationship with Notification (as recipient)
User.hasMany(models.Notification, {
  foreignKey: 'recipient_id',
  as: 'Notifications',
  onDelete: 'CASCADE',
});
};

  return User;
};
