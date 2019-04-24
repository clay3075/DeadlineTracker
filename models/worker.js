var mongoose = require('mongoose');

var workerSchema = new mongoose.Schema({
	name: { type: String },
	room: { type: String }
});

module.exports = mongoose.model('Worker', workerSchema);