const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cookieParser());
PORT = 80;

mongoose.connection.on("error", () => {
  console.log("MongoDB connection error");
});

//DB stuff
const db = mongoose.Schema;
const mongoDBURL = "mongodb://127.0.0.1/social";
mongoose.connect(mongoDBURL, { useNewURLParser: true });

// USER Schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;

// POSTS Schema
const postSchema = new mongoose.Schema({
  user: String,
  image: String,
  caption: String,
  likes: Number,
  comments: [String],
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;

// COMMENTS Schema
const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  user: String,
  text: String,
  likes: Number,
  createdAt: { type: Date, default: Date.now },
});

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;

// For use when fetching user's posts on their homepage
//User.findById(userId).populate('posts').exec((err, userWithPosts) => {
//if (err) return handleError(err);
//// userWithPosts will contain user data w posts
//});

let sessions = {};

// This function adds a session to sessions when a user logs in successfully
function addSession(username) {
  let sid = Math.floor(Math.random() * 1000000000);
  let now = Date.now();
  sessions[username] = { id: sid, time: now };
  return sid;
}

// This function removes a session after a certain amount of time that the user has been logged in.
function removeSessions() {
  let now = Date.now();
  let usernames = Object.keys(sessions);
  for (let i = 0; i < usernames.length; i++) {
    let last = sessions[usernames[i]].time;
    if (last + 600000 < now) {
      delete sessions[usernames[i]];
    }
  }
  console.log(sessions);
}

setInterval(removeSessions, 2000);

// This function authenticates whether someone has logged in or not.
// If they have not and they try to access home or post, they will be redirected back to login.
function authenticate(req, res, next) {
  let c = req.cookies;
  console.log("auth request");
  console.log(req.cookies);
  if (c != undefined) {
    if (
      sessions[c.login.username] != undefined &&
      sessions[c.login.username].id == c.login.sessionID
    ) {
      next();
    } else {
      res.redirect("/index.html");
    }
  } else {
    res.redirect("/index.html");
  }
}


app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public_html/index.html");
});

app.use("/feed.html/", authenticate);
app.get("/feed.html/", (req, res, next) => {
  console.log("another");
  next();
});

app.use("/post.html/", authenticate);
app.get("/post.html/", (req, res, next) => {
  console.log("another");
  next();
});

app.use("/account.html/", authenticate);
app.get("/account.html/", (req, res, next) => {
  console.log("another");
  next();
});

// Statically sends the html, css, and js to the server
app.use(express.static(__dirname + "/public_html"));

app.post("/account/login", (req, res) => {
  console.log(sessions);
  let u = req.body;
  let p1 = User.find({ username: u.username, password: u.password }).exec(); // hashed password
  p1.then((results) => {
    if (results.length == 0) {
      res.end("Could not find account");
    } else {
      let sid = addSession(u.username);
      res.cookie(
        "login",
        { username: u.username, sessionID: sid },
        { maxAge: 60000 * 2 }
      );
      res.end("SUCCESS");
    }
  });
});

// GET request for getting all the users from the database
app.get("/get/users", (req, res) => {
  let users = User.find({}).exec();
  users.then((results) => {
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(results, null, 2));
  });
});

// GET request for getting all the posts from the database
app.get("/get/posts/", (req, res) => {
  let items = Post.find({}).exec();
  items.then((results) => {
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(results, null, 2));
  });
});


// POST: Add a user
app.post("/add/user", (req, res) => {
  const { username, password } = req.body;
  // Check if a user with the same username already exists
  User.findOne({ username })
    .then((existingUser) => {
      if (existingUser) {
        res.status(400).json({ message: "Username already exists" });
      } else {
        // If the username is not found, create a new user
        const newUser = new User({ username, password });
        newUser
          .save()
          .then(() => res.status(201).json(newUser))
          .catch((err) => handleError(res, err));
      }
    })
    .catch((err) => handleError(res, err));
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});


