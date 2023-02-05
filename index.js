const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 3000;

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "replace-manually"
});

app.get('/', (req, res) => {
    res.end("Hello world!");
});

app.listen(port, () => {
    console.log('WBTT server listening at 3.141.202.74:3000')
});

con.connect( (err) => {
    if (err) throw err;
    console.log("Connected to MySQL Server.");
});
