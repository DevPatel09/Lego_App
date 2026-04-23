/********************************************************************************
* WEB322 – Assignment 06
********************************************************************************/

const express = require('express');
const path = require("path");
const mongoose = require('mongoose');

const legoData = require("./modules/legoSets");
const authData = require("./modules/auth-service");
const clientSessions = require("client-sessions");

const app = express();

const HTTP_PORT = process.env.PORT || 8080;

/* -------------------- DATABASE CONNECTION -------------------- */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.log("MongoDB connection error:", err));

/* -------------------- MIDDLEWARE -------------------- */
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(clientSessions({
  cookieName: 'session',
  secret: process.env.SESSION_SECRET || 'random_secret_string',
  duration: 24 * 60 * 60 * 1000,
  activeDuration: 1000 * 60 * 5
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.set('view engine', 'ejs');

/* -------------------- ROUTES -------------------- */

// Home & About
app.get("/", (req, res) => res.render("home"));
app.get("/about", (req, res) => res.render("about"));

/* -------------------- LEGO ROUTES -------------------- */

app.get("/lego/sets/", async (req, res) => {
  try {
    const theme = req.query.theme;
    const sets = theme
      ? await legoData.getSetsByTheme(theme)
      : await legoData.getAllSets();

    if (sets.length === 0) {
      return res.status(404).render("404", {
        message: "No sets found for a matching theme"
      });
    }

    res.render("sets", { sets });
  } catch (error) {
    res.status(500).render("500", { message: "Internal Server Error" });
  }
});

app.get("/lego/sets/:num", async (req, res) => {
  try {
    const set = await legoData.getSetByNum(req.params.num);

    if (!set) {
      return res.status(404).render("404", {
        message: "The requested Lego set was not found"
      });
    }

    res.render("set", { set });
  } catch (error) {
    res.status(500).render("500", { message: "Internal Server Error" });
  }
});

/* -------------------- ADD SET -------------------- */

app.get('/lego/addSet', async (req, res) => {
  try {
    const themes = await legoData.getAllThemes();
    res.render('addSet', { themes });
  } catch (error) {
    res.render('500', { message: error });
  }
});

app.post('/lego/addSet', async (req, res) => {
  try {
    await legoData.addSet(req.body);
    res.redirect('/lego/sets');
  } catch (error) {
    res.render('500', { message: error });
  }
});

/* -------------------- EDIT SET -------------------- */

app.get('/lego/editSet/:num', async (req, res) => {
  try {
    const set = await legoData.getSetByNum(req.params.num);
    const themes = await legoData.getAllThemes();
    res.render('editSet', { set, themes });
  } catch (error) {
    res.status(404).send("Set not found");
  }
});

app.post('/lego/editSet', async (req, res) => {
  try {
    await legoData.editSet(req.body.set_num, req.body);
    res.redirect(`/lego/sets/${req.body.set_num}`);
  } catch (error) {
    res.render('500', { message: error });
  }
});

/* -------------------- DELETE SET -------------------- */

app.get('/lego/deleteSet/:num', async (req, res) => {
  try {
    await legoData.deleteSet(req.params.num);
    res.redirect('/lego/sets');
  } catch (error) {
    res.render('500', { message: error });
  }
});

/* -------------------- AUTH ROUTES -------------------- */

app.get('/login', (req, res) => {
  res.render('login', { errorMessage: null });
});

app.get('/register', (req, res) => {
  res.render('register', { errorMessage: null });
});

app.post('/register', async (req, res) => {
  try {
    await authData.registerUser(req.body);
    res.render('register', { successMessage: "User created successfully" });
  } catch (error) {
    res.render('register', { errorMessage: error });
  }
});

app.post('/login', async (req, res) => {
  try {
    req.body.userAgent = req.get('User-Agent');

    const user = await authData.checkUser(req.body);

    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory
    };

    res.redirect('/lego/sets');
  } catch (error) {
    res.render('login', { errorMessage: error });
  }
});

app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

/* -------------------- AUTH MIDDLEWARE -------------------- */

function ensureLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
}

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

/* -------------------- 404 HANDLER -------------------- */

app.use((req, res) => {
  res.status(404).render("404", {
    message: "Page not found"
  });
});

/* -------------------- START SERVER -------------------- */

app.listen(HTTP_PORT, () => {
  console.log(`Server running on port ${HTTP_PORT}`);
});

module.exports = app;