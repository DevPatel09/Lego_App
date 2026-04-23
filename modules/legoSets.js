/********************************************************************************
* WEB322 – Assignment 06
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
*
* Name: Dev Kshitij Patel    Student ID: 142979228     Date: 2024-4-21
*
********************************************************************************/
require("dotenv").config();
const Sequelize = require("sequelize");

// const setData = require("../data/setData.json");
// const themeData = require("../data/themeData.json");

const sequelize = new Sequelize({
  host: 'ep-cold-bar-a5slh5cy.us-east-2.aws.neon.tech',
  database:'SenecaDB',
  username: 'SenecaDB_owner',
  password: 'tvbg9l3CIVMJ',
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

const Theme = sequelize.define("Theme", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: Sequelize.STRING,
});

const Set = sequelize.define("Set", {
  set_num: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  name: Sequelize.STRING,
  year: Sequelize.INTEGER,
  num_parts: Sequelize.INTEGER,
  theme_id: Sequelize.INTEGER,
  img_url: Sequelize.STRING,
});

Set.belongsTo(Theme, { foreignKey: "theme_id" });

async function initialize() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await sequelize.sync();
    console.log("Database synchronized successfully.");
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

async function getAllSets() {
  try {
    const sets = await Set.findAll({ include: [Theme] });
    return sets;
  } catch (error) {
    console.error("Error getting all sets:", error);
    throw error;
  }
}

async function getSetByNum(setNum) {
  try {
    const set = await Set.findOne({
      where: { set_num: setNum },
      include: [Theme],
    });
    if (set) {
      return set;
    } else {
      throw `Set not found with set_num: ${setNum}`;
    }
  } catch (error) {
    console.error("Error getting set by set_num:", error);
    throw error;
  }
}

async function getSetsByTheme(theme) {
  try {
    const sets = await Set.findAll({
      include: [Theme],
      where: {
        "$Theme.name$": {
          [Sequelize.Op.iLike]: `%${theme}%`,
        },
      },
    });

    if (sets.length > 0) {
      return sets;
    } else {
      throw `No sets found for theme: ${theme}`;
    }
  } catch (error) {
    console.error("Error getting sets by theme:", error);
    throw error;
  }
};
async function addSet(setData) {
  try {
    const newSet = await Set.create(setData);
    return newSet;
  } catch (error) {
    throw new Error('Error adding set: ' + error.message);
  }
}

async function getAllThemes() {
  try {
    const themes = await Theme.findAll();
    return themes;
  } catch (error) {
    throw new Error('Error fetching themes: ' + error.message);
  }
}

async function editSet(set_num, setData) {
  try {
    const set = await Set.findOne({ where: { set_num: set_num } }); 
    if (set) {
      await set.update(setData);
      console.log('Set updated successfully');
      return set;
    } else {
      throw new Error(`Set with set number ${set_num} not found`);
    }
  } catch (error) {
    throw new Error(`Error updating set: ${error}`);
  }
}


async function deleteSet(setNum) {
  try {
    const deletedSetCount = await Set.destroy({ where: { set_num: setNum } });
    if (deletedSetCount === 0) {
      throw new Error('Set not found');
    }
  } catch (error) {
    throw new Error('Error deleting set: ' + error.message);
  }
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, addSet, getAllThemes, editSet, deleteSet };

//module.exports = { Theme, Set, sequelize };
// Code Snippet to insert existing data from Set / Themes
// sequelize
//   .sync()
//   .then( async () => {
//     try{
//       await Theme.bulkCreate(themeData);
//       await Set.bulkCreate(setData); 
//       console.log("-----");
//       console.log("data inserted successfully");
//     }catch(err){
//       console.log("-----");
//       console.log(err.message);

//       // NOTE: If you receive the error:

//       // insert or update on table "Sets" violates foreign key constraint "Sets_theme_id_fkey"

//       // it is because you have a "set" in your collection that has a "theme_id" that does not exist in the "themeData".   

//       // To fix this, use PgAdmin to delete the newly created "Themes" and "Sets" tables, fix the error in your .json files and re-run this code
//     }

//     process.exit();
//   })
//   .catch((err) => {
//     console.log('Unable to connect to the database:', err);
//   });