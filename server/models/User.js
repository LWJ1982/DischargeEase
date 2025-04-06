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
        allowNull: true,
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      verification_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      provider: {
        type: DataTypes.STRING(100),
        defaultValue: "local"
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: {
              args: [['Patient', 'Caregiver', 'Nurse', 'Doctor', 'Admin']],
              msg: "Role must be one of 'Patient', 'Caregiver', 'Nurse', 'Doctor', 'Admin'"
          }
        }
    },
    singpass_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
  },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "users",
      timestamps: false, // Since we’re using `created_at` manually
    }
  );

  // Associations
  User.associate = (models) => {
    // Many-to-Many
    User.belongsToMany(models.Address, {
      through: models.UserAddress, // or simply 'UserAddresses' if you prefer an implicit model
      foreignKey: "user_id", // key in the join table
      otherKey: "address_id", // secondary key in the join table
      onDelete: "CASCADE",
    });

    // If you still have a Profile model:
    User.hasOne(models.Profile, {
      foreignKey: "user_id",
      as: "Profile",
      onDelete: "CASCADE",
    });
  };

  return User;
};
