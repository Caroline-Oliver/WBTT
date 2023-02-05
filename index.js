const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.end("Hello world!");
});

app.listen(port, () => {
    console.log('WBTT server listening at 172.31.11.98:3000')
});
