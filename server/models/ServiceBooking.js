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
            service_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            nurse_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            schedule_time: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'Pending',
                validate: {
                    isIn: [['Pending', 'Scheduled', 'In Progress', 'Completed', 'Cancelled']],
                },
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
            as: 'Patient',
        });
        ServiceBooking.belongsTo(models.Service, {
            foreignKey: 'service_id',
            as: 'Service',
        });
        ServiceBooking.belongsTo(models.User, {
            foreignKey: 'nurse_id',
            as: 'Nurse',
        });
    };

    return ServiceBooking;
};