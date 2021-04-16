 const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Job {
    _id: ID!  
    vacancy_count: Int   
    company_name: String    
    company_description: String    
    location: String    
    role: String    
    job_description: String
    recruiter: Recruiter
    applications: [Application]
  }

  type Recruiter {
    _id: ID!
    name: String
    email: String
  }
  
  type Candidate {
    _id: ID!
    name: String
    email: String
    highest_qualification: String
    college_name: String
    college_passout_year: Int
    college_percent: Float
    school_name: String
    school_passout_year: Int
    board_percent: Float
    work_experience: String
  }
  
  enum Status {
    PENDING
    REJECTED
    ACCEPTED
  }
  
  enum Stage {
    DRAFT
    PUBLISHED
  }

  type Application {
    _id: ID!
    candidate: Candidate    
    job: Job    
    stage: Stage
    status: Status    
    current_ctc: String
    expected_ctc: String
    years_of_experience: Int
    skillset: String
  }
  
  type Result {
    value: Boolean!
    email: Boolean
    message: String
  }

  type Query {
    jobs: [Job]
    job(id: ID!): Job
    postedJobs: [Job]
    postedJob(id: ID!): Job
    myApplications: [Application]
    myApplication(id: ID!): Application
  }
  
  type Mutation {
    recruiterSignup(name: String!, email: String!, password: String!): Recruiter
    recruiterLogin(email: String!, password: String!): Recruiter
    candidateSignup(name: String!, email: String!, password: String!, highest_qualification: String, college_name: String, college_passout_year: Int, college_percent: Float, school_name: String, school_passout_year: Int, board_percent: Float, work_experience: String): Candidate
    candidateLogin(email: String!, password: String!): Candidate
    postJob(vacancy_count: Int!, company_name: String!, company_description: String!, location: String!, role: String!, job_description: String!): Result
    reviewApplication(id: ID!, status: Status!): Result
    applyJobApplication(id: ID!, stage: Stage!, current_ctc: String, expected_ctc: String, years_of_experience: Int, skillset: String): Result
    removeJobApplication(id: ID!): Result
    updateJobApplication(id: ID!, stage: Stage, current_ctc: String, expected_ctc: String, years_of_experience: Int, skillset: String): Result
  }
  
`;

module.exports = typeDefs;
