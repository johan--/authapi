import mongoose = require("mongoose");

export const RefreshSchema: mongoose.Schema = new mongoose.Schema({

    token: { type: 'string', required: true },
   // type: { type: 'string', required: true },
    status: { type: 'string'},
    idToken: 'string',
    expiresIn: 'Number',
    scope: { type: 'array', required: true },
    /*client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }*/
    auth: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'auth'
    }

}, { collection: 'refresh', 'strict': true });