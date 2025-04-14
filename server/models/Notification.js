// models/Notification.js
module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define(
        "Notification",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            recipient_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            message: {
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
            tableName: 'notifications',
            timestamps: true,
        }
    );

    // Associations
    Notification.associate = (models) => {
        Notification.belongsTo(models.User, {
            foreignKey: 'recipient_id',
            as: 'Recipient',
        });
    };

    return Notification;
};