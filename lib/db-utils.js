const mongoose = require("mongoose");

/**
 * Counter schema for auto-incrementing IDs
 */
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

/**
 * Get next sequence value for auto-incrementing fields
 * @param {string} sequenceName - Name of the sequence (e.g., 'user_id', 'account_id')
 * @returns {Promise<number>} Next sequence value
 */
async function getNextSequence(sequenceName) {
  const counter = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
}

module.exports = {
  getNextSequence,
  Counter,
};
