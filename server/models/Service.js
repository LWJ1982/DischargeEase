// models/Service.js
module.exports = (sequelize, DataTypes) => {
    const Service = sequelize.define(
        "Service",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            service_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            tableName: 'services',
            timestamps: true,
        }
    );

    // Associations
    Service.associate = (models) => {
        Service.hasMany(models.ServiceBooking, {
            foreignKey: 'service_id',
            as: 'ServiceBookings',
        });
    };

    return Service;
};