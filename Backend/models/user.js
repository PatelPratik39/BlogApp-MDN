const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Schema = mongoose.Schema;
const UserSchema = new Schema({
  firstname: {
    type: String,
    required: true
  },
  lastname: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    unique: true
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user"
  },
  active: {
    type: Boolean,
    default: false
  },
  activationToken: {
    type: String
  }
});

UserSchema.pre("save", async function (next) {
  const hashPassword = await bcrypt.hash(this.password, 10);
  this.password = hashPassword;
  next();
});

UserSchema.methods.isValidPassword = async function (password) {
  const user = this;
  const compare = await bcrypt.compare(password, user.password);
  return compare;
};

UserSchema.methods.isAdmin = async function () {
  const user = this;
  if (user.role == "admin") {
    return true;
  }
  return false;
};

const UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel;
