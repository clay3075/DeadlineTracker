var mongoose = require('mongoose');
var Worker = require('./worker');


var roomSchema = new mongoose.Schema({
	id: { type: String },
	goal: { type: Number },
	overallGoal: { type: Number },
	previousCount: { type: Number },
	currentCount: { type: Number }
});

roomSchema.virtual('workers').get(function() {
	return Worker.find( { 'room': this.id } );
});

module.exports = mongoose.model('Room', roomSchema);