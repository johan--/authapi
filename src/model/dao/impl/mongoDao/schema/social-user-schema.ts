import mongoose = require("mongoose");
import Address = require("../../../../entity/address");

export const UserSchema: mongoose.Schema = new mongoose.Schema({

        username: {
                type: String,
                required: [true, 'No username given']
        },
        userType: {
                type: String,
                required: [false, 'No userType given'],
                default: 'shopper'
        },
        email: {
                type: String,
                required: [false, 'No email given']
        },
        firstName: {
                type: String,
                required: [true, 'No fist name given']
        },
        lastName: {
                type: String,
                required: [true, 'No surname given']
        },
        address: {

        },
        credential: {

        },
        accessToken: [],
        registrationVerificationToken: String,
        isValidated: Boolean

}, { collection: 'users', 'strict': false });