const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const validator = require("validator");
const { isEmail } = validator;

const candidateSchema = new Schema(
  {
     email: {
      type: String,
      required: true,
      unique: true
    },
    
    password: {
      type: String,
      required: true
    },
    
    name: {
      type: String,
      required: true
    },
    
    highest_qualification: String,
    college_name: String,
    college_passout_year: Number,
    college_percent: Number,
    school_name: String,
    school_passout_year: Number,
    board_percent: Number,
    work_experience: String
  },

  
  {
    collection: "Candidates"
  }
);

candidateSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("Candidate", candidateSchema);