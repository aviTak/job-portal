const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const jobSchema = new Schema(
  {
     recruiter_id: {
      type: String,
      required: true
    },
    
    vacancy_count: {
      type: Number,
      required: true
    },
    
    company_name: {
      type: String,
      required: true
    },
    
    company_description: {
      type: String,
      required: true
    },
    
    location: {
      type: String,
      required: true
    },
    
    role: {
      type: String,
      required: true
    },
    
    job_description: {
      type: String,
      required: true
    }
    
  },

  {
    collection: "Jobs"
  }
);

module.exports = mongoose.model("Job", jobSchema);