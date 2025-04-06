module.exports = (sequelize, DataTypes) => {
    const Profile = sequelize.define('Profile', {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        mobile: {
            type: DataTypes.STRING(20),
            allowNull: true,
            validate: {
                isNumeric: true,
                len: [8,15] // Ensure a valid phone number length
            }
        },
        profile_picture: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    }, {
        tableName: 'profiles', // Ensure this matches your actual table name
        timestamps: true // Enable createdAt & updatedAt timestamps
    });

    // Associations
    Profile.associate = (models) => {
        Profile.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'User',
        });
    };

    return Profile;
};