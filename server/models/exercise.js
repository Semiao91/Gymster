const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    type:{
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;