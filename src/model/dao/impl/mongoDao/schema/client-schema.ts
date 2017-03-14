import mongoose = require("mongoose");

export const ClientSchema: mongoose.Schema = new mongoose.Schema({

   
    name: {
        type: String
    },

    username: {
        type: String
    },

    clientId: {
        type: String
    },

    clientSecret: {
        type: String
    },
    credentialsFlow : {
         type: Boolean
    },
    deleted : {
         type: Boolean,
         default: false
    },

    redirect_uris: []

}, { collection: 'clients', 'strict': true });
