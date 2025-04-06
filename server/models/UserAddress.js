// models/UserAddress.js

module.exports = (sequelize, DataTypes) => {
  const UserAddress = sequelize.define(
    "UserAddress",
    {
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      address_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "UserAddresses",
      timestamps: false, 
      // If you want a composite PK:
      // indexes: [{ unique: true, fields: ['user_id', 'address_id'] }],
    }
  );

  // Optionally define associations here if needed
  // e.g., foreignKey constraints, etc.

  return UserAddress;
};
