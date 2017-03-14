import mongoose = require("mongoose");

export const UserSchema: mongoose.Schema = new mongoose.Schema({

        username: {
                type: String,
                lowercase: true,
                required: [true, 'No username given']
        },
        userType: {
                type: String,
                required: [false, 'No userType given'],
                default: 'shopper'
        },
        email: {
                type: String,
                lowercase: true
        },
        firstName: {
                type: String
        },
        lastName: {
                type: String
        },
        address: {

        },
        credential: {

        },
        accessToken: [],

        clients:[],

        consents:[],
        
        registrationVerificationToken: String,
        registrationVerificationTokenExpiry: Number,
        isValidated: Boolean

}, { collection: 'users', 'strict': false });