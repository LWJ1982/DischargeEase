// models/PatientRecord.js
module.exports = (sequelize, DataTypes) => {
    const PatientRecord = sequelize.define(
        "PatientRecord",
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
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            ward: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            medical_history: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            drawings: {
                type: DataTypes.JSON, // array of strings (paths)
                allowNull: true,
              }
        },
        {
            tableName: 'patient_records',
            timestamps: true,
        }
    );

    // Associations
    PatientRecord.associate = (models) => {
        PatientRecord.belongsTo(models.User, {
            foreignKey: 'patient_id',
            as: 'Patient',
        });

        // One-to-Many relationship with Erratum
        PatientRecord.hasMany(models.Erratum, {
            foreignKey: 'patient_id',
            as: 'Errata',
            onDelete: 'CASCADE',
        });

        // One-to-Many relationship with ServiceBooking
        PatientRecord.hasMany(models.ServiceBooking, {
            foreignKey: 'patient_id',
            as: 'ServiceBookings',
            onDelete: 'CASCADE',
        });
    };

    return PatientRecord;
};