const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const VisitorSchema = new Schema({
	userId: {type: String, required: true},
	venueId: {type: String, required: true}
});

const Visitor = mongoose.model('Visitor', VisitorSchema);

module.exports = Visitor;
