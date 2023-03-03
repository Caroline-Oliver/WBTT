// #region authenticate middleware
function authenticate(req, res, next) {
	if (req.body.token == null) {
		res.status(400).send("Token not present");
    }
    else {
        // parameterized MySQL requests are immune to SQL injection
        var sql = "SELECT * FROM user WHERE user_id = ?;"
        sqlParams = [req.body.token];
        pool.query(sql, sqlParams, function(err, result) {
            // parameterized MySQL requests are immune to SQL injection
            var sql = "SELECT * FROM user WHERE user_id = ?;"
            sqlParams = [req.body.token];
            pool.query(sql, sqlParams, function(err, result) {
                if (err) throw err;
                else if (result.length == 0) {
                    res.status(404).send("Token not valid");
                }
                else {
                    if (req.url.includes("/my/")) {
                        next();
                    }
                    else if (req.url.includes("/admin/") && result.type == 0) {
                        next();
                    }
                    else {
                        res.redirect(403, "/");
                    }
                    
                }
            });
        });
    }
}
// #endregion

// #region require
const express = require('express');
const mysql = require('mysql');
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
app.post('/my/create', (req, res) => {
    // make sure request contains all elements of a user account
    if (req.body.username == null || req.body.password == null
        || req.body.email == null || req.body.first_name == null
        || req.body.last_name == null) {
        res.status(403).send("Missing body parts");
        return;
    }
    // make sure user account doesn't already exist
    var sql = "SELECT * FROM user WHERE user_name = ?;"
    sqlParams = [req.body.username];
    pool.query(sql, sqlParams, function(err_01, result_01) {
        if (err_01) throw err_01;
        else if (result_01.length != 0) {
            res.status(400).send("Username already in user");
        }
        else {
            var max_id = null;
            var sql = "SELECT MAX(user_id) AS max_id FROM user";
            sqlParams = [];
            pool.query(sql, sqlParams, function(err_0, result_0) {
                if (err_0) throw err;
        
                max_id = result_0[0].max_id + 1;
        
                // inserts new user into user table
                sql = "INSERT INTO user (user_id, user_name, first_name, last_name, email, type) values (?, ?, ?, ?, ?, 1)";
                sqlParams = [max_id, req.body.username, req.body.first_name, req.body.last_name, req.body.email];
                pool.query(sql, sqlParams, function(err_1, result_1) {
                    if (err_1) throw err_1;
        
                    sql = "INSERT INTO password (password_id, user_name, password) values (?, ?, ?)";
                    sqlParams = [max_id, req.body.username, req.body.password];
                    pool.query(sql, sqlParams, function(err_2, result_2) {
                        if (err_2) throw err_2;
        
                        res.status(200).send("Account successfully created!");
                    });
                });
            });
        }
    });
    
    var sql = "SELECT * FROM user WHERE user_name = ?;"
    sqlParams = [req.body.username];
    pool.query(sql, sqlParams, function(err_01, result_01) {
        if (err_01) throw err_01;
        else if (result_01.length != 0) {
            res.status(400).send("Username already in user");
        }
        else {
            var max_id = null;
            var sql = "SELECT MAX(user_id) AS max_id FROM user";
            sqlParams = [];
            pool.query(sql, sqlParams, function(err_0, result_0) {
                if (err_0) throw err;
        
                max_id = result_0[0].max_id + 1;
        
                // inserts new user into user table
                sql = "INSERT INTO user (user_id, user_name, first_name, last_name, email, type) values (?, ?, ?, ?, ?, 1)";
                sqlParams = [max_id, req.body.username, req.body.first_name, req.body.last_name, req.body.email];
                pool.query(sql, sqlParams, function(err_1, result_1) {
                    if (err_1) throw err_1;
        
                    sql = "INSERT INTO password (password_id, user_name, password) values (?, ?, ?)";
                    sqlParams = [max_id, req.body.username, req.body.password];
                    pool.query(sql, sqlParams, function(err_2, result_2) {
                        if (err_2) throw err_2;
        
                        res.status(200).send("Account successfully created!");
                    });
                });
            });
        }
    });
    
});

// TODO change to async & promises to have more readable code
app.get('/my/login', (req, res) => {
    // make sure request contains all elements of a user account
    if (req.body.username == null || req.body.password == null) {
        res.status(403).send("Missing body parts");
        return;
    }

    // checks to see if username/password pair exist
    var sql = "SELECT * FROM password WHERE user_name = ? AND password = ?"
    var sqlParams = [req.body.username, req.body.password];
    var sqlResult = null;
    pool.query(sql, sqlParams, function(err_1, result_1) {
        if (err_1) {
            throw err_1;
        }
        else if (result_1.length == 0) {
            res.status(400).send("Invalid username/password combination.");
        }
        else {
            var sql = "SELECT * FROM user WHERE user_name = ?"
            var sqlParams = [req.body.username];
            pool.query(sql, sqlParams, function(err_2, result_2) {
                if (err_2) throw err_2;
                else if (result_2.length == 0) {
                    res.status(403).send("DB Error. Please contact an administrator.");
                }
                else {
                    res.status(200).send({token: result_2[0].user_id});
                }
            });
        }
    });

});
// #endregion

// #region admin
app.post('/admin/upload', authenticate, (req, res) => {
    fs.writeFile(`venues/${req.body.name}.html`, req.body.html, (err) => {
        if (err) return console.log(err);
    });
});
//#endregion

// #region listen on port
app.listen(port, () => {
    console.log('WBTT server listening at 3.141.202.74:3000');
});
// #endregion
