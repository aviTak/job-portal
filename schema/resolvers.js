const { gql, AuthenticationError } = require("apollo-server-express");
const mongoose = require("mongoose");
const Application = require("../models/application.js");
const Candidate = require("../models/candidate.js");
const Job = require("../models/job.js");
const Recruiter = require("../models/recruiter.js");
const Bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { isEmail } = require("validator");

const ObjectId = id => {
  return new mongoose.Types.ObjectId(id);
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER,
    pass: process.env.PASS
  }
});

const solve = async nId => {
  let email = [];
  for (let i = 0; i < nId.length; i++) {
    let t = await Candidate.findById(nId[i]);
    email.push(t.email);
  }
  return email;
};

const sendMail = async (email, multiple = false, status = false) => {
  var people = "bcc",
    message = "";

  if (!multiple) {
    people = "to";
  }

  if (status === "ACCEPTED") {
    message = "Congratulations! You have been accepted for a job you applied.";
  } else if (status === "REJECTED") {
    message = "Sorry, you got rejected to a job you applied.";
  } else {
    message = "Someone applied to a job you posted.";
  }

  var mailOptions = {
    from: `Job Portal <${process.env.USER}>`,
    [people]: email,
    subject: "Greetings from Job Portal",
    html: `<!doctype html>
          <html>
            <body>
              <p>${message}</p>
            </body>
          </html>`
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (e) {
    return { value: true, email: false, message: e.message };
  }

  return { value: true, email: true, message: "Email Sent!" };
};

const resolvers = {
  Job: {
    recruiter: (_, args, context) => {
      return Recruiter.findById(_.recruiter_id);
    },

    applications: async (_, args, context) => {
      if (!context.recruiter_id) {
        throw new AuthenticationError("UNAUTHENTICATED");
      }

      const rec = Recruiter.findById(_.recruiter_id);

      if (!rec) {
        return null;
      }

      if (rec._id !== context.recruiter_id) {
        return null;
      }

      return Application.find({ job_id: _._id });
    }
  },

  Application: {
    candidate: (_, args, context) => {
      return Candidate.findById(_.candidate_id);
    },

    job: (_, args, context) => {
      return Job.findById(_.job_id);
    }
  },

  Query: {
    jobs: (_, args, context) => {
      return Job.find({ vacancy_count: { $gt: 0 } });
    },

    job: (_, args, context) => {
      try {
        ObjectId(args.id);
      } catch (e) {
        return null;
      }
      return Job.findById(args.id);
    },

    postedJobs: (_, args, context) => {
      if (!context.recruiter_id) {
        throw new AuthenticationError("UNAUTHENTICATED");
      }

      return Job.find({ recruiter_id: context.recruiter_id });
    },

    postedJob: (_, args, context) => {
      if (!context.recruiter_id) {
        throw new AuthenticationError("UNAUTHENTICATED");
      }

      return Job.findOne({ recruiter_id: context.recruiter_id, _id: args.id });
    },

    myApplications: (_, args, context) => {
      if (!context.candidate_id) {
        throw new AuthenticationError("UNAUTHENTICATED");
      }

      return Application.find({ candidate_id: context.candidate_id });
    },

    myApplication: (_, args, context) => {
      if (!context.candidate_id) {
        throw new AuthenticationError("UNAUTHENTICATED");
      }

      return Application.findOne({
        candidate_id: context.candidate_id,
        _id: args.id
      });
    }
  },

  Mutation: {
    recruiterSignup: async (_, args, context) => {
      const rec = await Recruiter.create({
        name: args.name,
        email: args.email.toLowerCase(),
        password: Bcrypt.hashSync(args.password, 10)
      });

      var token;

      token = jwt.sign({ _id: rec._id }, process.env.JWT_R, {
        algorithm: "HS256",
        expiresIn: "24h"
      });

      context.res.cookie("recruiter", token, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 1 * 24 * 60 * 60 * 1000
      });

      return { _id: rec._id, name: rec.name, email: rec.email };
    },

    recruiterLogin: async (_, args, context) => {
      const rec = await Recruiter.findOne({ email: args.email.toLowerCase() });

      if (!rec) return null; // User does not exist

      var token;

      if (Bcrypt.compareSync(args.password, rec.password)) {
        token = jwt.sign({ _id: rec._id }, process.env.JWT_R, {
          algorithm: "HS256",
          expiresIn: "24h"
        });

        context.res.cookie("recruiter", token, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
          maxAge: 1 * 24 * 60 * 60 * 1000
        });

        return { _id: rec._id, name: rec.name, email: rec.email };
      }

      return null;
    },
    
    recruiterLogout: (_, args, context) => {
      context.res.cookie("recruiter", 0, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 0
      });

      return { value: true, message: "You are logged out" };
    },

    candidateSignup: async (_, args, context) => {
      const cand = await Candidate.create({
        name: args.name,
        email: args.email.toLowerCase(),
        password: Bcrypt.hashSync(args.password, 10),
        highest_qualification: args.highest_qualification,
        college_name: args.college_name,
        college_passout_year: args.colege_passout_year,
        college_percent: args.college_percent,
        school_name: args.school_name,
        school_passout_year: args.school_passout_year,
        board_percent: args.board_percent,
        work_experience: args.work_experience
      });

      var token;

      token = jwt.sign({ _id: cand._id }, process.env.JWT_C, {
        algorithm: "HS256",
        expiresIn: "24h"
      });

      context.res.cookie("candidate", token, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 1 * 24 * 60 * 60 * 1000
      });

      return {
        _id: cand._id,
        name: cand.name,
        email: cand.email.toLowerCase(),
        highest_qualification: cand.highest_qualification,
        college_name: cand.college_name,
        college_passout_year: cand.colege_passout_year,
        college_percent: cand.college_percent,
        school_name: cand.school_name,
        school_passout_year: cand.school_passout_year,
        board_percent: cand.board_percent,
        work_experience: cand.work_experience
      };
    },

    candidateLogin: async (_, args, context) => {
      const cand = await Candidate.findOne({ email: args.email });

      if (!cand) return null; // User does not exist

      var token;

      if (Bcrypt.compareSync(args.password, cand.password)) {
        token;

        token = jwt.sign({ _id: cand._id }, process.env.JWT_C, {
          algorithm: "HS256",
          expiresIn: "24h"
        });

        context.res.cookie("candidate", token, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
          maxAge: 1 * 24 * 60 * 60 * 1000
        });

        return {
          _id: cand._id,
          name: cand.name,
          email: cand.email,
          highest_qualification: cand.highest_qualification,
          college_name: cand.college_name,
          college_passout_year: cand.colege_passout_year,
          college_percent: cand.college_percent,
          school_name: cand.school_name,
          school_passout_year: cand.school_passout_year,
          board_percent: cand.board_percent,
          work_experience: cand.work_experience
        };
      }

      return null;
    },
    
    candidateLogout: (_, args, context) => {
      context.res.cookie("candidate", 0, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 0
      });

      return { value: true, message: "You are logged out" };
    },

    postJob: async (_, args, context) => {
      if (!context.recruiter_id) {
        throw new AuthenticationError("UNAUTHENTICATED");
      }

      if (args.vacancy_count <= 0) {
        throw new Error("NO_VACANCY_ERROR");
      }

      const job = await Job.create({
        recruiter_id: context.recruiter_id,
        vacancy_count: args.vacancy_count,
        company_name: args.company_name,
        company_description: args.company_description,
        location: args.location,
        role: args.role,
        job_description: args.job_description
      });

      return { value: true, message: "Job Created" };
    },

    reviewApplication: async (_, args, context) => {
      if (!context.recruiter_id) {
        throw new AuthenticationError("UNAUTHENTICATED");
      }

      try {
        ObjectId(args.id);
      } catch (e) {
        return { value: false, message: "No such application found" };
      }

      const app = await Application.findOne({
        _id: args.id,
        stage: "PUBLISHED",
        status: "PENDING"
      });

      if (!app) {
        return {
          value: false,
          message: "No such application status is already PENDING."
        };
      }

      const job = await Job.findOne({
        _id: app.job_id,
        recruiter_id: context.recruiter_id,
        vacancy_count: { $gt: 0 }
      });

      if (!job) {
        return {
          value: false,
          message:
            "The job has already expired or you don't have access to review this application"
        };
      }

      if (args.status === "PENDING") {
        return {
          value: true,
          message: "Application found or the application already resolved."
        };
      }

      await Application.updateOne(
        { _id: args.id, stage: "PUBLISHED", status: "PENDING" },
        { $set: { status: args.status } },
        { upsert: false, runValidators: true, context: "query" }
      );
      await Job.updateOne(
        {
          _id: app.job_id,
          recruiter_id: context.recruiter_id,
          vacancy_count: { $gt: 0 }
        },
        { $inc: { vacancy_count: -1 } },
        { upsert: false, runValidators: true, context: "query" }
      );

      const cand = await Candidate.findById(app.candidate_id);
      const wake = sendMail(cand.email, false, args.status);

      if (job.vacancy_count <= 1 && args.status === "ACCEPTED") {
        console.log("YESSSS", job.vacancy_count, args.status);

        const nApp = await Application.find({
          status: "PENDING",
          job_id: job.id,
          stage: "PUBLISHED"
        });
        await Application.updateMany(
          { status: "PENDING", job_id: job.id, stage: "PUBLISHED" },
          { $set: { status: "REJECTED" } },
          { upsert: false, runValidators: true, context: "query" }
        );

        const nId = nApp.map(e => {
          return e["candidate_id"];
        });

        console.log("nid", nId);

        const email = await solve(nId);

        // console.log("nCand", nCand);
        console.log("email", email);

        const asleep = sendMail(email, true, "REJECTED");

        return asleep;
      }

      return wake;
    },

    applyJobApplication: async (_, args, context) => {
      if (!context.candidate_id) {
        throw new AuthenticationError("UNAUTHENTICATED");
      }

      try {
        ObjectId(args.id);
      } catch (e) {
        return { value: false, message: "No such job found" };
      }

      const app = await Application.create({
        candidate_id: context.candidate_id,
        job_id: args.id,
        status: "PENDING",
        stage: args.stage,
        current_ctc: args.current_ctc,
        expected_ctc: args.expected_ctc,
        years_of_experience: args.years_of_experience,
        skillset: args.skillset
      });

      if (args.stage === "PUBLISHED") {
        const job = await Job.findById(args.id);
        const rec = await Recruiter.findById(job.recruiter_id);

        const asleep = sendMail(rec.email);
        return asleep;
      }

      return { value: true, message: "Application created" };
    },

    removeJobApplication: async (_, args, context) => {
      if (!context.candidate_id) {
        throw new AuthenticationError("UNAUTHENTICATED");
      }

      try {
        ObjectId(args.id);
      } catch (e) {
        return { value: false, message: "No such application found" };
      }

      const app = await Application.findOne({
        _id: args.id,
        candidate_id: context.candidate_id,
        status: "PENDING"
      });

      if (!app) {
        return {
          value: false,
          message:
            "No such application found or the application has already been submitted"
        };
      }

      await Application.deleteOne({
        _id: args.id,
        candidate_id: context.candidate_id,
        status: "PENDING"
      });

      return { value: true, message: "Application deleted" };
    },

    updateJobApplication: async (_, args, context) => {
      if (!context.candidate_id) {
        throw new AuthenticationError("UNAUTHENTICATED");
      }

      try {
        ObjectId(args.id);
      } catch (e) {
        return { value: false, message: "No such application found" };
      }

      const app = await Application.findOne({
        _id: args.id,
        candidate_id: context.candidate_id,
        stage: "DRAFT"
      });

      if (!app) {
        return {
          value: false,
          message:
            "No such application found or the application has already been submitted"
        };
      }

      await Application.updateOne(
        {
          _id: args.id,
          candidate_id: context.candidate_id,
          stage: "DRAFT"
        },
        { $set: args }, //change
        { upsert: false, runValidators: true, context: "query" }
      );

      if (args.stage === "PUBLISHED") {
        const app = await Application.findById(args.id);
        const job = await Job.findById(app.job_id);
        const rec = await Recruiter.findById(job.recruiter_id);

        const asleep = sendMail(rec.email);
        return asleep;
      }

      return { value: true, message: "Application deleted" };
    }
  }
};

module.exports = resolvers;
