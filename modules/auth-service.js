const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config(); 
const Schema = mongoose.Schema;

// Define the user schema
const userSchema = new Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [{
    dateTime: { type: Date, default: Date.now },
    userAgent: String
  }]
});

// Define the User model
let User;

// Exported functions
module.exports = {
  initialize: function () {
    return new Promise(function (resolve, reject) {
const db = mongoose.createConnection('mongodb+srv://dev123patel01:Kddn_11177@cluster0.u4t63ft.mongodb.net/web322?retryWrites=true&w=majority&appName=Cluster0', {
          useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      db.on('error', (err) => {
        reject(err);
      });
      db.once('open', () => {
        User = db.model("users", userSchema);
        resolve();
      });
    });
  },

  registerUser: function (userData) {
    return new Promise((resolve, reject) => {
      // Hash the password using bcrypt
      bcrypt.hash(userData.password, 10)
        .then(hash => {
          // Update userData with the hashed password
          userData.password = hash;
          // Create a new user document
          const newUser = new User(userData);
          // Save the new user to the database
          newUser.save()
            .then(() => resolve('User registered successfully'))
            .catch(err => reject(err));
        })
        .catch(err => {
          console.log(err);
          // If there was an error hashing the password, reject the promise
          reject('There was an error encrypting the password');
        });
    });
  },

  checkUser: function (userData) {
    return new Promise((resolve, reject) => {
      // Find the user by username in the database
      User.findOne({ userName: userData.userName })
        .then(user => {
          if (!user) {
            // If user is not found, reject the promise
            reject('User not found');
          } else {
            // Compare the hashed password with the provided password
            bcrypt.compare(userData.password, user.password)
              .then(result => {
                if (result) {
                  // If passwords match, resolve the promise
                  resolve('Password correct');
                } else {
                  // If passwords don't match, reject the promise
                  reject('Incorrect password for user: ' + userData.userName);
                }
              })
              .catch(err => {
                console.log(err);
                // If there was an error comparing passwords, reject the promise
                reject('Error comparing passwords');
              });
          }
        })
        .catch(err => {
          console.log(err);
          // If there was an error retrieving user data, reject the promise
          reject('Error retrieving user data');
        });
    });
  }
};
