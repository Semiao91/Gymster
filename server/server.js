const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const Exercise = require('./models/exercise');
const User = require('./models/user');
const session = require('express-session');

const connectionString = 'mongodb+srv://berna19911:917242335@gymster.rmw6fzr.mongodb.net/?retryWrites=true&w=majority';



mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error(error);
  });

app.use(express.static(path.join(__dirname, '../public')));

app.use(bodyParser.json());

app.use(
  session({
    secret: 'Maxigrula9194', // Replace this with your own secret key // implement EV file
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

const requireLogin = (req, res, next) => {
  
  if (!req.session.userId) {
    return res.status(401).json({ message: 'You must be logged in to access this resource.' });
  }
  next();
};

app.get('/', requireLogin, (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Expires', '-1');
  res.setHeader('Pragma', 'no-cache');
  res.sendFile(path.join(__dirname, '../public/index.html'));
});


app.post('/api/submit-exercise', requireLogin, async (req, res) => {
  const { date, exercise } = req.body;
  const userId = req.session.userId;
  
    // Save the exercise information to MongoDB
    const newExercise = new Exercise({
      userId: req.session.userId, // Add the userId from the session
      type: exercise,
      date: new Date(date),
    });
  
    try {
      const savedExercise = await newExercise.save();
      res.status(200).json({ message: 'Exercise submitted successfully.', exercise: savedExercise });
    } catch (error) {
      res.status(500).json({ message: 'Error submitting exercise.', error });
    }
  });

  app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Create a new user
    const newUser = new User({ username, email, password });

    try {
        const savedUser = await newUser.save();
        res.status(200).json({ message: 'User registered successfully.', user: savedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user.', error });
    }
});


app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
          return res.status(401).json({ message: 'Invalid email or password.' });
      }

      req.session.userId = user._id;
      console.log('User logged in:', req.session); // Add this line

      res.status(200).json({ message: 'User logged in successfully.' });
  } catch (error) {
      res.status(500).json({ message: 'Error logging in user.', error });
  }
});

app.get('/api/check-login', (req, res) => {
  if (req.session.userId) {
    res.status(200).json({ message: 'User is logged in.' });
  } else {
    res.status(401).json({ message: 'User is not logged in.' });
  }
});

  app.get('/api/fetch-exercise', async (req, res) => {
    const date = req.query.date;
    console.log(req.session.userId);
  
    try {
      const exercise = await Exercise.findOne({ date: new Date(date), userId: req.session.userId });
      
      res.status(200).json({ exercise });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching exercise.' });
    }
  });
  
  app.get('/api/fetch-exercises', async (req, res) => {
    const month = parseInt(req.query.month);
    const year = parseInt(req.query.year);
    console.log(req.session.userId);
  
    if (isNaN(month) || isNaN(year)) {
      res.status(400).json({ message: 'Invalid query parameters.' });
      return;
    }
  
    try {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 1);
  
      const exercises = await Exercise.find({
        date: {
          $gte: startDate,
          $lt: endDate,
        },
        userId: req.session.userId
      });
  
      res.status(200).json({ exercises });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching exercises.' });
    }
  });

  app.delete('/api/delete-exercise', async (req, res) => {
    const date = req.body.date;

  
    try {
      await Exercise.deleteOne({ date: new Date(date), userId: req.session.userId });
      res.status(200).json({ message: 'Exercise deleted successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error deleting exercise.' });
    }
  });

  app.get('/logout', (req, res) => {
    console.log('Before session destroy:', req.session);

    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error logging out user.' });
      }

      console.log('After session destroy:', req.session); // Add this line
  
      // Clear browser cache
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
  
      // After destroying the session, redirect the user to the login page
      res.redirect('/login');
    });
  });

//Set the folder where all the static files are located so they can be rendered

  


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});