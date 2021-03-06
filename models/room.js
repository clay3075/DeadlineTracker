var mongoose = require('mongoose');
var Worker = require('./worker');


var roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    goal: {
        type: Number,
        default: 0
    },
    overallGoal: {
        type: Number,
        default: 0
    },
    previousCount: {
        type: Number,
        default: 0
    },
    currentCount: {
        type: Number,
        default: 0
    },
    deadline: {
        type: Date,
        default: null
    },
    archived: {
        type: Boolean,
        default: false
    }
});

roomSchema.virtual('workers').get(function () {
    return Worker.find({
        roomID: this.name
    });
});

roomSchema.methods.incrementCurrentCount = function () {
    this.currentCount++;
};

roomSchema.methods.decrementCurrentCount = function () {
    this.currentCount--;
};

//returns a promise holding the requested room
roomSchema.statics.findByWorker = function (worker) {
    return Worker.findOne({
            _id: worker._id
        }).exec()
        .then(function (err, worker) {
            this.findOne({
                name: worker.roomID
            }).exec();
        });
};

//returns a promise holding the requested room
roomSchema.statics.findByName = function (name) {
    return this.findOne({
        name: name
    }).exec();
};

module.exports = mongoose.model('Room', roomSchema);