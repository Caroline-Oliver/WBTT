// #region authenticate middleware

/*
{
	token: "tokenjadkfljds"
}
*/

//   pool.query("SELECT * FROM test_table1", function (err, result, fields) {
//         if (err) throw err;
//         res.end(JSON.stringify(result));
//   });

function authenticate(req, res, next) {
	if (req.body.token == null) {
		res.sendStatus(400).send("Token not present");
    }
    else {
        pool.query("SELECT * FROM user WHERE user_id = " + req.body.token + ";", function(err, result, fields) {
            if (err) throw err;
            if (result.length == 0) {
                res.sendStatus(404).send("Token not valid");
            }
            else {
                if (req.url.includes("/my/")) {
                    next();
                }
                else if (req.url.includes("/admin/") && result.type == 0) {
                    next();
                }
                res.redirect(403, "/");
            }
        });
    }
}
// #endregion

// #region require
const express = require('express');
const mysql = require('mysql');
const login = require('./middleware/login');
// #endregion

// #region init
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use( express.static( "src/public" ) );
app.use(express.json());

const pool = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "UTSACSgroup7",
    database: "wbtt",
});
// #endregion

// #region basic pages

// TODO: if statements in ejs
app.get('/', (req, res) => {
    /*
    var mascots = [
      { name: 'Sammy', organization: "DigitalOcean", birth_year: 2012},
      { name: 'Tux', organization: "Linux", birth_year: 1996},
      { name: 'Moby Dock', organization: "Docker", birth_year: 2013}
    ];
    */

    var events = [
        {
            name: 'Event 1',
            desc: '1 Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quas, voluptates, soluta velit nostrum ut iste exercitationem vitae ipsum repellendus laudantium ab possimus nemo odio cumque illum nulla laborum blanditiis unde.',
            imgSrc: '/images/event-singer.jpg'
        },
        {
            name: 'Event 2',
            desc: '2 Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quas, voluptates, soluta velit nostrum ut iste exercitationem vitae ipsum repellendus laudantium ab possimus nemo odio cumque illum nulla laborum blanditiis unde.',
            imgSrc: '/images/event-field.jpg'
        }
    ]
    res.render('pages/index', {
        events: events
    });
});
// #endregion

// #region user account api
app.get('/my/auth', authenticate, (req, res) => {
    res.sendStatus(400).send("hello world");
});

const users = [{user: "admin", password: "password123"}];

app.post('/my/create', (req, res) => {
    // make sure request contains all elements of a user account
    if (req.body.username == null || req.body.password == null
        || req.body.email == null || req.body.first_name == null
        || req.body.last_name == null) {
        res.status(403).send("Missing body parts");
        return;
    }
    
    // make sure user account doesn't already exist
    if ( (users.some( ({user}) => user === req.body.username ) ) ) {
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

// #region listen on port
app.listen(port, () => {
    console.log('WBTT server listening at 3.141.202.74:3000');
});
// #endregion
