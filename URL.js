const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    }
});

const URL = mongoose.model('URL', userSchema);

module.exports = URL;