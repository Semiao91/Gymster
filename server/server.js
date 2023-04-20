const pather = require('path');
require('dotenv').config({ path: pather.resolve(__dirname, '.env') });
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const Exercise = require('./models/exercise');
const User = require('./models/user');
const Goal = require('./models/goals');
const List = require('./models/list');
const session = require('express-session');

const connectionString = process.env.MONGODB_URI;

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
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

const requireLogin = (req, res, next) => {
  console.log("Checking login:", req.session); // Add this line
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

app.get('/arms', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/arms.html'));
});

app.get('/legs', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/legs.html'));
});

app.get('/chest', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/chest.html'));
});

app.get('/back', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/back.html'));
});

app.get('/shoulders', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/shoulders.html'));
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
    console.log('Registration request received:', req.body);

    const { firstname, lastname, email, password } = req.body;

    // Check if the user already exists
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }
    } catch (error) {
        console.error('Error checking for existing user:', error);
        return res.status(500).json({ message: 'Error checking for existing user.', error });
    }

    // Create a new user
    const newUser = new User({ firstname, lastname, email, password });

    try {
        const savedUser = await newUser.save();
        console.log('User registered successfully:', savedUser);
        res.status(200).json({ message: 'User registered successfully.', user: savedUser });
    } catch (error) {
        console.error('Error registering user:', error);
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

  app.get('/api/userinfo', requireLogin, async (req, res) => {
    try {
      const user = await User.findById(req.session.userId).select('-password');
      res.status(200).json({ user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching user information.' });
    }
  });

  app.put('/api/update-user-details', requireLogin, async (req, res) => {
    const { height, weight, age} = req.body;
  
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.session.userId,
        { height, weight, age},
        { new: true, runValidators: true, select: '-password' }
      );
  
      res.status(200).json({ message: 'User details updated successfully.', user: updatedUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating user details.' });
    }
  });

  app.get('/api/get-exercises', async (req, res) => {
    const exerciseType = req.query.type;

    console.log(`Fetching exercises of type: ${exerciseType}`); 
  
    try {
      const exercises = await List.find({ type: exerciseType });
      res.status(200).json(exercises);
      console.log(`Fetched exercises: ${JSON.stringify(exercises)}`); 
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch exercises' });
    }
  });

  app.post('/api/submit-list-exercise', requireLogin, async (req, res) => {
    const { name, weight, reps, type } = req.body;
  
    const listExercise = new List({
      userId: req.session.userId,
      name,
      weight,
      reps,
      type,
    });
  
    try {
      const savedListExercise = await listExercise.save();
      res.status(200).json({ message: 'Arms exercise submitted successfully.', exercise: savedListExercise });
    } catch (error) {
      res.status(500).json({ message: 'Error submitting arms exercise.', error });
    }
  });

  app.get('/api/most-submitted-muscle-group', requireLogin, async (req, res) => {
    const userId = req.session.userId;
    console.log("User ID:", userId); // Add this li
  
    try {
      const mostSubmittedMuscleGroup = await getMostSubmittedMuscleGroup(userId);
      res.status(200).json({ muscleGroup: mostSubmittedMuscleGroup });
    } catch (error) {
      console.error("Error in /api/most-submitted-muscle-group:", error); // Add this line
      res.status(500).json({ message: 'Error fetching most submitted muscle group.', error });
    }
  });

  async function getMostSubmittedMuscleGroup(userId) {
    const muscleGroupCounts = await Exercise.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  
    if (muscleGroupCounts.length > 0) {
      return muscleGroupCounts[0]._id;
    }
  
    return null;
  }
  
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

  // DO NOT TOUCH THIS
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
    // DO NOT TOUCH THIS

    app.delete('/api/delete-list-item/:id', async (req, res) => {
      const exerciseId = req.params.id;
    
      try {
        await List.deleteOne({ _id: exerciseId, userId: req.session.userId });
        res.status(200).json({ message: 'Exercise deleted successfully.' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting exercise.' });
      }
    });
    
  app.get('/api/get-user-weight', requireLogin, async (req, res) => {
    const user = await User.findById(req.session.userId);
    res.json({ weight: user.weight });
  });

  app.get('/api/get-latest-goal', requireLogin, async (req, res) => {
    try {
      const goal = await Goal.findOne({ userId: req.session.userId }).sort({ createdAt: -1 });
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving latest goal', error });
    }
  });

  app.post('/api/save-goal', requireLogin, async (req, res) => {
    try {
      const { weightDifference } = req.body;
  
      // Check if there's an existing Goal document for the current user
      let goal = await Goal.findOne({ userId: req.session.userId });
  
      if (goal) {
        // If a Goal document exists, update the weightDifference
        goal.weightDifference = weightDifference;
      } else {
        // If no Goal document exists, create a new one
        goal = new Goal({
          userId: req.session.userId,
          weightDifference,
        });
      }
  
      // Save the Goal document
      await goal.save();
      res.json({ message: 'Goal saved successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error saving goal', error });
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