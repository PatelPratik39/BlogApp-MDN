const mongoose = require("mongoose");
const blogSchema = new mongoose.Schema({
  slug: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  tags: [
    {
      type: String
    }
  ],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  state: {
    type: String,
    enum: ["draft", "published"],
    default: "draft"
  },
  read_count: {
    type: Number,
    default: 0
  },
  reading_time: {
    type: Number,
    required: true
  }
});

blogSchema.index({ timestamp: -1 });
const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;
