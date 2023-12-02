const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const express = require("express");
const cookieParser = require("cookie-parser");
const parser = require("body-parser");

const app = express();
app.use(parser.json());
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

// COMMENTS Schema
const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  user: String,
  text: String,
  likes: Number,
  createdAt: { type: Date, default: Date.now },
});

const Comment = mongoose.model("Comment", commentSchema);

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

let sessions = {};

function authenticate(req, res, next) {
  let c = req.cookies;
  console.log("auth request:");
  console.log(req.cookies);
  if (c != undefined && c.login != undefined) {
    if (
      sessions[c.login.username] != undefined &&
      sessions[c.login.username].id == c.login.sessionID
    ) {
      next();
    } else {
      res.redirect("/");
    }
  } else {
    res.redirect("/");
  }
}

function addSession(username) {
  let sid = Math.floor(Math.random() * 1000000000);
  let now = Date.now();
  sessions[username] = { id: sid, time: now };
  return sid;
}

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

setInterval(removeSessions, 600000);

app.post("/account/login", async (req, res) => {
  console.log(sessions);
  let u = req.body;

  try {
    let hashed = await bcrypt.hash(u.password, 10);
    console.log(hashed);

    let user = await User.findOne({ username: u.username }).exec();

    if (!user) {
      res.end("Could not find account");
    } else {
      // Use bcrypt.compare to compare hashed password
      const match = await bcrypt.compare(u.password, user.password);

      if (match) {
        let sid = addSession(u.username);
        res.cookie(
          "login",
          { username: u.username, sessionID: sid },
          { maxAge: 600000 }
        );
        res.end("SUCCESS");
      } else {
        res.end("Invalid password");
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).end("Internal Server Error");
  }
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

app.get("/get/getFollowingList", (req, res) => {
  const username = req.query.username;

  User.findOne({ username: username })
    .populate("following", "username")
    .exec()
    .then((user) => {
      if (user) {
        const followingList = user.following.map(
          (followedUser) => followedUser.username
        );
        res.json(followingList);
      } else {
        res.json([]);
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    });
});

app.get("/get/getPostsFromUser", (req, res) => {
  const username = req.query.username;

  User.findOne({ username: username })
    .populate("posts") // Assuming 'posts' is an array of post documents
    .exec()
    .then((user) => {
      if (user) {
        const posts = user.posts.map((post) => ({
          username: post.username,
          imageUrl: post.imageUrl,
          caption: post.caption,
        }));
        res.json(posts);
      } else {
        res.json([]);
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    });
});

app.get("/get/usernameFromCookie", (req, res, next) => {
  const cookies = req.cookies;

  if (cookies && cookies.login && sessions[cookies.login.username]) {
    const username = cookies.login.username;
    res.send(username);
  } else {
    res.send(null);
  }
});

const handleError = (res, err) => {
  console.error(err);
  res.status(500).send(err);
};

// IMAGE UPLOADING CODE
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // 'uploads/' is the folder where images will be saved
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/upload/post", upload.single("photo"), async (req, res) => {
  const caption = req.body.caption;
  const username = req.body.username; // Assuming username is sent along with the form

  if (req.file) {
    const imagePath = req.file.path; // The path where the image is saved

    // Create a new post
    const newPost = new Post({
      user: username,
      imagePath: imagePath,
      caption: caption,
    });

    newPost.save();
    console.log("CHECKPOINT ALPHA");

    User.findOne({ username: username }).then((user) => {
      user.posts.push(newPost._id);
      let p = user.save();
      console.log("CHECKPOINT BRAVO");
      p.then((result) => {
        console.log("CHECKPOINT CHARLIE");
        res.redirect("/feed.html");
      });
    });
  } else {
    res.status(400).send("No image uploaded");
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// GET request for getting all the users with the substring KEYWORD
app.get("/search/users/:KEYWORD", (req, res) => {
  var keyword = req.params.KEYWORD;

  const users = User.find({
    username: { $regex: keyword, $options: "i" }, // Using regex for substring search, 'i' for case-insensitive search
  }).exec();

  users
    .then((document) => res.json(document))
    .catch((error) => {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});

app.get("/check-follow/:username/:accUsername", async (req, res) => {
  try {
    const { username, accUsername } = req.params;

    // Find the user and the user they want to check
    const user = await User.findOne({ username });
    const accUser = await User.findOne({ username: accUsername });

    if (!user || !accUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user is following accUser
    const isFollowing = user.following.includes(accUser._id);

    res.json(isFollowing);
  } catch (error) {
    console.error(error);
    res.status(500).json(false); // Return false in case of an error
  }
});

app.post("/follow/:username/:accUsername", async (req, res) => {
  try {
    const accUsername = req.params.accUsername;
    const username = req.params.username;

    // Find the user and the user they want to follow
    const user = await User.findOne({ username });
    const accUser = await User.findOne({ username: accUsername });

    if (!user || !accUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user is not already following the other user
    if (!user.following.includes(accUser._id)) {
      // If not, follow the user
      user.following.push(accUser._id);
      accUser.followers.push(user._id);

      // Use findOneAndUpdate with the document's current version
      await User.findOneAndUpdate(
        { _id: user._id, __v: user.__v },
        { following: user.following },
        { new: true, lean: true }
      );

      await User.findOneAndUpdate(
        { _id: accUser._id, __v: accUser.__v },
        { followers: accUser.followers },
        { new: true, lean: true }
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/unfollow/:username/:accUsername", async (req, res) => {
  try {
    const accUsername = req.params.accUsername;
    const username = req.params.username;

    // Find the user and the user they want to unfollow
    const user = await User.findOne({ username });
    const accUser = await User.findOne({ username: accUsername });

    if (!user || !accUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user is following the other user
    if (user.following.includes(accUser._id)) {
      // If yes, unfollow the user
      user.following = user.following.filter((id) => id.toString() !== accUser._id.toString());
      accUser.followers = accUser.followers.filter((id) => id.toString() !== user._id.toString());

      // Use findOneAndUpdate with the document's current version
      await User.findOneAndUpdate(
        { _id: user._id, __v: user.__v },
        { following: user.following },
        { new: true, lean: true }
      );

      await User.findOneAndUpdate(
        { _id: accUser._id, __v: accUser.__v },
        { followers: accUser.followers },
        { new: true, lean: true }
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
