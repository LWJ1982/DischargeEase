// models/Erratum.js
module.exports = (sequelize, DataTypes) => {
    const Erratum = sequelize.define(
        "Erratum",
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
            submitted_by: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            correction_details: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: 'errata',
            timestamps: true,
        }
    );

    // Associations
    Erratum.associate = (models) => {
        Erratum.belongsTo(models.PatientRecord, {
            foreignKey: 'patient_id',
            as: 'PatientRecord',
        });
        Erratum.belongsTo(models.User, {
            foreignKey: 'submitted_by',
            as: 'SubmittedBy',
        });
    };

    return Erratum;
};