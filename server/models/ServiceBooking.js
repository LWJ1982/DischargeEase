// models/ServiceBooking.js
module.exports = (sequelize, DataTypes) => {
    const ServiceBooking = sequelize.define(
        "ServiceBooking",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            patient_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            patient_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            service_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            nurse_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            nurse_name: {
                type: DataTypes.STRING,
                allowNull: true
            },
            schedule_time: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'pending',
                validate: {
                    isIn: [['pending', 'scheduled', 'in progress', 'completed', 'cancelled']],
                },
            },
            metadata: {
                type: DataTypes.JSON,
                allowNull: true,
            },

        },
        {
            tableName: 'service_bookings',
            timestamps: true,
        }
    );

    // Associations
    ServiceBooking.associate = (models) => {
        ServiceBooking.belongsTo(models.PatientRecord, {
            foreignKey: 'patient_id',
            as: 'patient',
        });
        ServiceBooking.belongsTo(models.Service, {
            foreignKey: 'service_id',
            as: 'Service',
        });
        ServiceBooking.belongsTo(models.User, {
            foreignKey: 'nurse_id',
            as: 'nurse',
        });
    };

    return ServiceBooking;
};