const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        googleId: { type: String, sparse: true, unique: true }, // Optional for older users, unique if provided
        role: { type: String, required: false, enum: ['farmer', 'buyer'] }, // Made not required initially for Google Sign-in
        location: { type: String, required: false }, // Made not required initially
        profilePicture: { type: String },
        password: { type: String, required: false }, // Optional for Google OAuth users
        language: { type: String, default: 'en' }, // Added language preference
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
