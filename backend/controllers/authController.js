const User = require('../models/User.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '311302625838-2oqtkdsfptg3ljg943rqeaj5hgmcf7hr.apps.googleusercontent.com');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth with Google
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Google ID token is required' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID || '311302625838-2oqtkdsfptg3ljg943rqeaj5hgmcf7hr.apps.googleusercontent.com',
        });
        const payload = ticket.getPayload();

        const { sub: googleId, email, name, picture: profilePicture } = payload;

        let user = await User.findOne({ email });

        if (user) {
            // User exists, just log them in
            if (!user.googleId) {
                // Link Google account to existing email user
                user.googleId = googleId;
                user.profilePicture = profilePicture;
                await user.save();
            }

            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                location: user.location,
                profilePicture: user.profilePicture,
                token: generateToken(user._id),
                isNewUser: !user.role // If role is missing, treat as new user needing role selection
            });
        } else {
            // New user, create them
            user = await User.create({
                name,
                email,
                googleId,
                profilePicture,
                location: 'Unknown',
            });

            return res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                location: user.location,
                profilePicture: user.profilePicture,
                token: generateToken(user._id),
                isNewUser: true // Flag to tell frontend to prompt for role
            });
        }

    } catch (error) {
        console.error('Google login error:', error);
        res.status(401).json({ message: 'Invalid Google token' });
    }
};

// @desc    Update User Role (after first Google login)
// @route   PUT /api/auth/role
// @access  Private (Needs valid JWT token)
const updateRole = async (req, res) => {
    // Note: Assuming we have an auth middleware setting req.user soon. 
    // If not, we will need to verify the JWT explicitly here or add a middleware.
    // For now, let's extract it from headers manually since this is a quick update, 
    // or assume we use the user ID from the body if the frontend sends it cleanly. 
    // Best practice: rely on Authorization header. Let's decode it here for simplicity if middleware isn't present

    const { role, password, language, location } = req.body;

    if (!role || !['farmer', 'buyer'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role provided' });
    }

    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findById(decoded.id);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            user.role = role;

            if (language) {
                user.language = language;
            }

            if (location) {
                user.location = location;
            }

            if (password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);
            }

            await user.save();

            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                location: user.location,
                profilePicture: user.profilePicture,
                token: generateToken(user._id)
            });

        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// @desc    Auth with Email & Password
// @route   POST /api/auth/login
// @access  Public
const emailLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    try {
        const user = await User.findOne({ email });

        if (user && user.password && (await user.matchPassword(password))) {
            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                location: user.location,
                profilePicture: user.profilePicture,
                language: user.language,
                token: generateToken(user._id),
                isNewUser: !user.role // Very unlikely here since they had to select a role to set a password, but good practice
            });
        } else {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Email login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

module.exports = { googleLogin, updateRole, emailLogin };
