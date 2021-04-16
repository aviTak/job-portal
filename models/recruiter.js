const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const validator = require("validator");
const { isEmail } = validator;

const recruiterSchema = new Schema(
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
    }
  },

  {
    collection: "Recruiters"
  }
);

recruiterSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("Recruiter", recruiterSchema);