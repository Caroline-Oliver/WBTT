const express = require('express');
const mysql = require('mysql');
const auth = require('./middleware/auth');
const app = express();
const port = 3000;

// #region init
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use( express.static( "src/public" ) );
app.use(express.json());

const pool = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "UTSACSgroup7",
    database: "mysql_test",
});
//#endregion

// #region basic pages
app.get('/', (req, res) => {
    res.render('pages/index');
});
// #endregion

// #region user account api
const users = [{user: "admin", password: "password123"}];

app.post('/user/create', (req, res) => {
    // make sure request contains all elements of a user account
    if (req.body.username == null || req.body.password == null
        || req.body.email == null || req.body.first_name == null
        || req.body.last_name == null) {
        res.status(403).send("Missing body parts");
        return;
    }
    
    // make sure user account doesn't already exist
    if (! (users.some( ({user}) => user === req.body.username ) ) ) {
        res.status(403).send("Username already exists");
        return;
    }

    users.push({user: req.body.username, password: req.body.password});
});

app.get('/user/login', (req, res) => {
    // make sure request contains all elements of a user account
    if (req.body.username == null || req.body.password == null) {
        res.status(403).send("Missing body parts");
        return;
    }

    // checks to see if username/password pair exist
    if (!users.some( ({user,password}) => user === req.body.username && password === req.body.password)) {
        res.status(403).send("Username/password pair does not exist: " + req.body.username + ", " + req.body.password);
        return;
    }

    // provide access and refresh tokens
    // TODO: convert to prod code
    res.status(200).send("Success! Logged in.");
});
// #endregion

// #region admin
app.post('/admin/upload', /*validateToken,*/ (req, res) => {
    fs.writeFile(`venues/${req.body.name}.html`, req.body.html, (err) => {
        if (err) return console.log(err);
    });
});
//#endregion


// #region example query
// app.get('/getall', (req, res) => {
//     pool.query("SELECT * FROM test_table1", function (err, result, fields) {
//         if (err) throw err;
//         res.end(JSON.stringify(result));
//   });
// });
// #endregion

app.listen(port, () => {
    console.log('WBTT server listening at 3.141.202.74:3000');
});

