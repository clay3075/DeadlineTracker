var mongoose = require('mongoose');
var Room = require('./room');

var workerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    roomID: {
        type: String,
        required: true
    },
    count: {
        type: String,
        default: 0
    }
});

workerSchema.methods.incrementWorkCount = function() {
    this.count++;
};

workerSchema.methods.decrementWorkCount = function() {
    if (this.count > 0)
        this.count--;
};

module.exports = mongoose.model('Worker', workerSchema);