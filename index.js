const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.connect(process.env.DB_URL);

const UserSchema = new Schema({
  username: String,
});
const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new Schema({
  userid: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Route to get all users
app.get('/api/users', async (req, res) => {
  try {
    // Find all users in the database
    const users = await User.find({}, { username: 1 }); // Return only the username field

    // Return the list of users
    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).send("There was an error fetching users");
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', async (req, res) => {
  console.log(req.body);
  const userObj = new User({
    username: req.body.username,
  });

  try {
    const user = await userObj.save();
    console.log(user);
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error saving user");
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).send("Could not find user");
    } else {
      const exerciseObj = new Exercise({
        userid: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date(),
      });
      const exercise = await exerciseObj.save();
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString(),
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("There was an error saving the exercise");
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send("Invalid user ID");
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).send("Could not find user");
  }

  let dateObj = {};
  if (from) {
    dateObj["$gte"] = new Date(from);
  }
  if (to) {
    dateObj["$lte"] = new Date(to);
  }

  let filter = { userid: id };

  if (from, to) {
    filter.date = dateObj;
  }

  const exercises = await Exercise.find(filter).limit(limit ? +limit : 500);

  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString(),
  }));

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  });
});

const listener = app.listen(process.env.PORT,  3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});