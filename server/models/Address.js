// models/Address.js

module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define(
    "Address",
    {
      address_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        field: "address_id",
      },
      addressLine1: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "address_line1",
      },
      addressLine2: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "address_line2",
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "city",
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "state",
      },
      postalCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: "postal_code",
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "SINGAPORE",
        field: "country",
      },
    },
    {
      tableName: "Addresses",
      timestamps: false,
    }
  );

  // Associations
  Address.associate = (models) => {
    // Many-to-Many
    Address.belongsToMany(models.User, {
      through: models.UserAddress, // or 'UserAddresses'
      foreignKey: "address_id",
      otherKey: "user_id",
      onDelete: "CASCADE",
    });
  };

  return Address;
};
