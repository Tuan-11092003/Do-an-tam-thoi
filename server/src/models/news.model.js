const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelNews = new Schema(
    {
        title: { type: String, require: true },
        content: { type: String, require: true },
        type: { 
            type: String, 
            enum: ['terms', 'privacy', 'shipping', 'payment', 'other'],
            default: 'other'
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('news', modelNews);

