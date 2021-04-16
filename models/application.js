const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const applicationSchema = new Schema(
  {
     candidate_id: {
      type: String,
      required: true
    },
    
    job_id: {
      type: String,
      required: true
    },
    
    stage: {
      type: String,
      required: true
    },
    
    status: {
      type: String,
      required: true
    },
    
    current_ctc: String,
    
    expected_ctc: String,
    
    years_of_experience: Number,
    
    skillset: String
    
  },

  {
    collection: "Applications"
  }
);

applicationSchema.index({ candidate_id: 1, job_id: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);