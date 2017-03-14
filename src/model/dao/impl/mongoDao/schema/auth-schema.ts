import mongoose = require("mongoose");

export const AuthSchema: mongoose.Schema = new mongoose.Schema({

    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    scope: { type: 'array', required: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    sub: { type: 'string', required: true },
    code: { type: 'string', required: true },
    redirectUri: { type: 'String', required: true },
    responseType: { type: 'string', required: true },
    status: { type: 'string', required: true },
    /*accessTokens: {
        collection: 'access',
        via: 'auth'
    },
    refreshTokens: {
        collection: 'refresh',
        via: 'auth'
    }*/

}, { collection: 'auth', 'strict': true });
