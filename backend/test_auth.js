require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '311302625838-2oqtkdsfptg3ljg943rqeaj5hgmcf7hr.apps.googleusercontent.com');

console.log("OAuth2Client instantiated successfully with ID:", process.env.GOOGLE_CLIENT_ID || '311302625838-2oqtkdsfptg3ljg943rqeaj5hgmcf7hr.apps.googleusercontent.com');
