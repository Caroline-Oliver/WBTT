const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 3000;

// set the view engine to ejs
app.set('view engine', 'ejs');

// use static
app.use( express.static( "public" ) );

/*
const pool = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "UTSACSgroup7",
    database: "mysql_test",
});
*/
app.get('/', (req, res) => {
    res.render('pages/index');
});

app.use('/static', express.static('html'));
/*
app.get('/getall', (req, res) => {
    pool.query("SELECT * FROM test_table1", function (err, result, fields) {
        if (err) throw err;
        res.end(JSON.stringify(result));
  });
});
*/
app.listen(port, () => {
    console.log('WBTT server listening at 3.141.202.74:3000')
});

