import mongoose = require("mongoose");

export const AccessSchema: mongoose.Schema = new mongoose.Schema({

    token: { type: 'string', required: true },
    type: { type: 'string', required: true },
    idToken: 'string',
    expiresIn: 'Number',
    expiresOn: 'Number',
    scope: { type: 'array', required: true },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'client',
        required: false
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    auth: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'auth'
    }

}, { collection: 'access', 'strict': true });
