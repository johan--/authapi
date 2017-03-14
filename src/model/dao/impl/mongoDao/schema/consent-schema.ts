import mongoose = require("mongoose");

export const ConsentSchema: mongoose.Schema = new mongoose.Schema({

    user: {
            type : mongoose.Schema.Types.ObjectId, 
            ref : 'users',
             required: true
            },
    client: {
            type : mongoose.Schema.Types.ObjectId, 
            ref : 'client',
            required: true
        },
    scopes: 'array'

}, { collection: 'consent', 'strict': true });
