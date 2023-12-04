/**
 * Hayden Roberts, Max Tung, Ethan Wong, Angelina Altunyan
 * This file acts as the server for the website.
 */

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

const db = mongoose.Schema;
const mongoDBURL = "mongodb://127.0.0.1/social";
mongoose.connect(mongoDBURL, { useNewURLParser: true });

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

const postSchema = new mongoose.Schema({
  user: String,
  image: String,
  caption: String,
  likes: Number,
  comments: [String],
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);

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
  next();
});

app.use("/post.html/", authenticate);
app.get("/post.html/", (req, res, next) => {
  next();
});

app.use("/account.html/", authenticate);
app.get("/account.html/", (req, res, next) => {
  next();
});

app.use("/help.html/", authenticate);
app.get("/help.html/", (req, res, next) => {
  next();
});

app.use(express.static(__dirname + "/public_html"));

let sessions = {};

function authenticate(req, res, next) {
  let c = req.cookies;
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
    if (last + 6000000 < now) {
      delete sessions[usernames[i]];
    }
  }
  console.log(sessions);
}

setInterval(removeSessions, 2000);

app.post("/account/login", async (req, res) => {
  let u = req.body;

  try {
    let user = await User.findOne({ username: u.username }).exec();

    if (!user) {
      res.end("Could not find account");
    } else {
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

app.post("/account/logout", (req, res) => {
  const cookies = req.cookies;
  if (cookies && cookies.login) {
    const username = cookies.login.username;
    if (sessions[username]) {
      delete sessions[username];
      res.clearCookie("login");
      res.end("Logged out successfully");
    } else {
      res.status(400).end("No active session");
    }
  } else {
    res.status(400).end("No active session");
  }
});

app.get("/get/users", (req, res) => {
  let users = User.find({}).exec();
  users.then((results) => {
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(results, null, 2));
  });
});

app.get("/get/posts/", (req, res) => {
  let items = Post.find({}).exec();
  items.then((results) => {
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(results, null, 2));
  });
});

app.post("/add/user", (req, res) => {
  const { username, password } = req.body;
  User.findOne({ username })
    .then((existingUser) => {
      if (existingUser) {
        res.status(400).json({ message: "Username already exists" });
      } else {
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
    .populate("posts")
    .exec()
    .then((user) => {
      if (user) {
        const posts = user.posts.map((post) => ({
          user: post.user,
          image: post.image,
          caption: post.caption,
          comments: post.comments,
          date: post.createdAt,
          _id: post._id,
          likes: post.likes,
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

const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/upload/post", upload.single("photo"), async (req, res) => {
  const caption = req.body.caption;
  const username = req.body.username;

  if (req.file) {
    const imagePath = req.file.path;
    const newPost = new Post({
      user: username,
      image: imagePath,
      caption: caption,
    });
    newPost.save();

    User.findOne({ username: username }).then((user) => {
      user.posts.push(newPost._id);
      let p = user.save();
      p.then((result) => {
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

app.get("/search/users/:KEYWORD", (req, res) => {
  var keyword = req.params.KEYWORD;

  const users = User.find({
    username: { $regex: keyword, $options: "i" }, 
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
    const user = await User.findOne({ username });
    const accUser = await User.findOne({ username: accUsername });

    if (!user || !accUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const isFollowing = user.following.includes(accUser._id);

    res.json(isFollowing);
  } catch (error) {
    console.error(error);
    res.status(500).json(false);
  }
});

app.post("/follow/:username/:accUsername", async (req, res) => {
  try {
    const accUsername = req.params.accUsername;
    const username = req.params.username;
    const user = await User.findOne({ username });
    const accUser = await User.findOne({ username: accUsername });

    if (!user || !accUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.following.includes(accUser._id)) {
      user.following.push(accUser._id);
      accUser.followers.push(user._id);

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
    const user = await User.findOne({ username });
    const accUser = await User.findOne({ username: accUsername });

    if (!user || !accUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.following.includes(accUser._id)) {
      user.following = user.following.filter(
        (id) => id.toString() !== accUser._id.toString()
      );
      accUser.followers = accUser.followers.filter(
        (id) => id.toString() !== user._id.toString()
      );

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

app.post("/likePost/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    if (post) {
      if (!post.likes) {
        post.likes = 0;
      }
      post.likes += 1;
      await post.save();
      res.json({ success: true, newLikeCount: post.likes });
    } else {
      res.status(404).json({ success: false, message: "Post not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

app.post("/likeComment/:commentId", async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const com = await Comment.findById(commentId);
    if (com) {
      if (!com.likes) {
        com.likes = 0;
      }
      com.likes += 1;
      await com.save();
      res.json({ success: true, newLikeCount: com.likes });
    } else {
      res.status(404).json({ success: false, message: "Post not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

app.use("/uploads", express.static("./uploads"));

app.get("/get/posts/:username", function (req, res) {
  User.findOne({ username: req.params.username })
    .select("posts")
    .then((user) => {
      if (!user) {
        return res.status(404).send("User not found");
      }
      return Promise.all(user.posts.map((postId) => Post.findById(postId)));
    })
    .then((posts) => {
      res.json(posts);
    })
    .catch((error) => {
      res.status(500).send("Server error");
    });
});

app.delete("/delete/post/:postId", async (req, res) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    await Post.deleteOne({ _id: postId });

    await User.updateOne({ posts: postId }, { $pull: { posts: postId } });
    await Comment.deleteMany({ post: postId });

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.post("/update/post/:postId", async (req, res) => {
  const postId = req.params.postId;
  const { caption } = req.body;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    post.caption = caption;
    await post.save();

    res.json({ success: true, message: "Caption updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.post("/upload/comment", async (req, res) => {
  const { post, text, user } = req.body;
  try {
    let newComment = new Comment({
      user: user,
      text: text,
      post: post,
    });
    await newComment.save();
    let postToUpdate = await Post.findOne({ _id: post });
    if (!postToUpdate) {
      console.log("Post not found for ID:", post);
      return res.status(404).send("Post not found");
    }
    postToUpdate.comments.push(newComment._id);
    await postToUpdate.save();
    res.status(201).json({ success: true, message: "Comment created", comment: newComment });
  } catch (error) {
    console.error("Error in /upload/comment:", error);
    res.status(500).send("DATABASE SAVE ISSUE");
  }
});

app.get('/get/comments/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const comments = await Comment.find({ post: postId });

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/delete/comment/:commentId", async (req, res) => {
  const commentId = req.params.commentId;

  try {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    await Comment.deleteOne({ _id: commentId });
    await Post.updateOne({ comments: commentId }, { $pull: { comments: commentId } });

    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});
