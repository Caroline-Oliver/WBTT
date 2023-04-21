// #region helper functions

// #region authenticate middleware
function authenticate(req, res, next) {
    if (req.cookies.token == null) {
        res.status(400).redirect('/');
    }
    else {
        // parameterized MySQL requests are immune to SQL injection
        var sql = "SELECT * FROM user WHERE user_id = ?;"
        sqlParams = [req.cookies.token];
        pool.query(sql, sqlParams, function (err, result) {
            if (err) throw err;
            else if (result.length == 0) {
                res.status(404).send("Token not valid");
            }
            else {
                if (req.url.includes("/my/")) {
                    next();
                }
                else if (req.url.includes("/admin/") && result[0].type == 0) {
                    next();
                }
                else if (!req.url.includes("/my/") && !req.url.includes("/admin/")) {
                    next();
                }

            }
        });
    }
}
// #endregion

// #region db helper functions
function checkTimestamps(search_terms_A, search_terms_B) {
    const dt = new Date();
    const padL = (nr, len = 2, chr = `0`) => `${nr}`.padStart(2, chr);

    // YYYY-MM-DD HH:MM:SS format
    const datetime = `${padL(dt.getFullYear())}-${padL(dt.getMonth() + 1)}-${dt.getDate()} ${padL(dt.getHours())}:${padL(dt.getMinutes())}:${padL(dt.getSeconds())}`

    var updateSql = "UPDATE ticket\nSET hold = 0, hold_time = null, user_id = null" + '\n' +
        `WHERE (${search_terms_A}) AND hold=1 AND hold_time < '${datetime}';` + '\n';
    var deleteSql = `DELETE cart FROM cart
        JOIN ticket as t ON cart.ticket_id = t.ticket_id
        WHERE (${search_terms_B}) AND t.hold = 0;`

    return new Promise((resolve, reject) => {
        query(deleteSql, [])
            .catch((err) => {
                console.log('error in delete sql in checktimestamps');
                console.log(err.message);
                reject(err);
            })
            .then((result) => {
                query(updateSql, [])
                    .catch((err) => {
                        console.log('error in update sql in checktimestamps');
                        console.log(err.message);
                        reject(err);
                    })
                    .then(async (result) => {
                        if (result.affectedRows != 0)
                            await new Promise(resolve => setTimeout(resolve, 500));
                        resolve(result);
                    })
            })
    })
}

function searchEvents(search_terms) {
    const generateSQL = (sort_search = '', normal_search = '', special_search, ordering, limit) => {
        if (sort_search != '') sort_search = `, (${sort_search}) AS count_words`;
        if (normal_search != '') normal_search = `AND (${normal_search})`;
        if (special_search != '') special_search = `AND (${special_search})`;

        return `SELECT e.event_id, e.event_name, e.event_description, e.image_url, e.base_price, e.date, e.time, COUNT(*)/e.max_tickets as percent
        ${sort_search}
        FROM \`event\` as e
        JOIN \`ticket\` as t ON e.event_id = t.event_id
        WHERE (t.hold = 0 AND t.sold = 0)
        ${normal_search}
        ${special_search}
        GROUP BY e.event_id, e.event_name, e.event_description, e.image_url, e.base_price, e.date, e.time
        ORDER BY
        ${ordering}
        ${limit}`
    }
    const special = (sql) => {
        if (special_search != '')
            special_search += ' AND ';
        special_search += sql;
    }
    var count_search = '', normal_search = '', special_search = '', ordering = 'DATE ASC', limit = '';

    return new Promise((resolve, reject) => {
        if (search_terms == '') {
            resolve([]);
        }
        else if (search_terms.includes('--') || search_terms.includes(';')) {
            reject(new Error('attempted SQL injection in search function'));
        }
        else {
            search_terms = ((search_terms + '').replace("'", "\\'")).split(' ');

            search_terms.forEach((token) => {
                if (token.includes(':')) {
                    let type = token.substring(0, token.indexOf(':')).toLowerCase();
                    let term = token.substring(token.indexOf(':') + 1);

                    if (type != '' && term != '') {
                        switch (type) {
                            case 'category':
                            case 'cat':
                                special(`category='${term}'`);
                                break;
                            case 'befored':
                            case 'beforedate':
                                special(`date < '${term}'`);
                                break;
                            case 'afterd':
                            case 'afterdate':
                                special(`date > '${term}'`);
                                break;
                            case 'ond':
                            case 'ondate':
                                special(`date = '${term}'`);
                                break;
                            case 'dotw':
                            case 'dayoftheweek':
                                special(`day = '${term}'`);
                                break;
                            case 'venue':
                            case 'ven':
                                special(`venue = '${term}'`);
                                break;
                            case 'costbelow':
                            case 'costb':
                                special(`base_price < '${term}'`);
                                break;
                            case 'costabove':
                            case 'costa':
                                special(`base_price > '${term}'`);
                                break;
                            case 'availibility':
                            case 'avail':
                                if (term.toLowerCase() == 'desc' || term.toLowerCase() == 'asc')
                                    ordering = `percent ${term}`;
                                break;
                            case 'cost':
                                if (term.toLowerCase() == 'desc' || term.toLowerCase() == 'asc')
                                    ordering = `base_price ${term}`;
                                break;
                            case 'limit':
                                limit = `LIMIT ${term}`;
                                break;
                        }
                    }
                }
                else {
                    // handle default sort
                    if (normal_search == '' && ordering == 'DATE ASC')
                        ordering = 'count_words DESC, date ASC';

                    // build normal search & count search strings
                    if (normal_search != '')
                        normal_search += 'OR ';
                    normal_search += `e.event_name LIKE '%${token}%' OR e.event_description LIKE '%${token}%'`;
                    if (count_search != '')
                        count_search += ' + ';
                    count_search += `(e.event_name LIKE '%${token}%') + (e.event_name LIKE '${token}%') + (e.event_name LIKE '%${token}') + (e.event_name LIKE '${token}') + (e.event_name LIKE '${token}')`
                }
            });

            let sql = generateSQL(count_search, normal_search, special_search, ordering, limit);

            query(sql, [])
                .catch((err) => {
                    console.log('errored in sql in search events');
                    console.log(err.message);
                    reject(err);
                })
                .then((result) => {
                    resolve(result);
                })
        }
    });
}

function accountStatus(token) {
    var sql = "SELECT * FROM user WHERE user_id = ?";
    var sqlParams = [token];
    return new Promise((resolve, reject) => {
        if (token == null) {
            resolve('na');
        }
        else {
            pool.query(sql, sqlParams, function (err, result) {
                if (err) {
                    console.log('errored in accountStatus');
                    console.log(err.message);
                    reject(err);
                }
                else {
                    if (result.length == 0) {
                        resolve('na');
                    }
                    else if (result[0].type == 0) {
                        resolve('admin');
                    }
                    else {
                        resolve('user');
                    }
                }
            });
        }
    });
}

function getCart(token) {
    let sql = `SELECT e.event_name, e.event_description, e.image_url, t.price, COUNT(*) as quanitity
    FROM wbtt.ticket AS t
    JOIN wbtt.cart AS c ON c.ticket_id = t.ticket_id
    JOIN event AS e ON t.event_id = e.event_id
    WHERE c.user_id = ?
    GROUP BY e.event_name, e.event_description, e.image_url, t.price`

    return new Promise((resolve, reject) => {
        checkTimestamps(`user_id = ${token}`, `cart.user_id = ${token}`)
            .catch((err) => {
                reject(err);
            })
            .then((results) => {
                query(sql, [token])
                    .catch((err) => {
                        reject(err);
                    })
                    .then((results) => {
                        resolve(results);
                    })
            })
    });
}

function query(sql, params) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

function adminDashboard(filters) {
    return new Promise((resolve, reject) => {
        // check if ad_current_date has elapsed, if not, use cached data
        const dt = new Date();
        const padL = (nr, len = 2, chr = `0`) => `${nr}`.padStart(2, chr);

        // YYYY-MM-DD format
        const date = `${padL(dt.getFullYear())}-${padL(dt.getMonth() + 1)}-${dt.getDate()}`

        events = [];
        query('SELECT * FROM event', [])
            .catch((err) => {
                reject(err);
            })
            .then((result) => {
                events = result;
            })
            .finally(() => {
                var cur_event_ids = [];
                events.forEach(event => {
                    if (event.date >= date)
                        cur_event_ids.push(event.event_id)
                })
                cur_event_ids = cur_event_ids.toString();
                /*var tickets_date_promise = query(`SELECT u.user_name, e.event_name, e.venue, e.date, COUNT(*) as quantity
                    FROM ticket AS t
                    JOIN user AS u ON u.user_id = t.user_id
                    JOIN event AS e ON e.event_id = t.event_id
                    WHERE sold=1
                    GROUP BY u.user_name, e.event_name, e.venue, e.date;
                    ORDER BY e.date DESC`, date);*/
                var order_date_promise = query(`SELECT * FROM \`order\` ORDER BY order_date DESC`, []);
                var order_customer_promise = query(`SELECT * FROM \`order\` ORDER BY user_id ASC`, []);
                var order_dollar_promise = query(`SELECT * FROM \`order\`r ORDER BY total_cost DESC`, []);

                var u_promise = query("SELECT * FROM user", []);
                var d_promise = query("SELECT * FROM discount_code", []);
                Promise.all([order_date_promise, order_customer_promise, order_dollar_promise, u_promise, d_promise])
                    .then((values) => {
                        // events, orders by date, orders by customer, orders by dollar, users, discount codes
                        resolve([events, values[0], values[1], values[2], values[3], values[4]]);
                    });
            });
    });
}

function getEvent(id) {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM event WHERE event_id = ?;";
        pool.query(sql, id, (err, res) => {
            if (err) {
                console.log('errored in getEvent');
                reject(err);
            }
            else {
                if (res.length >= 1) {
                    resolve(res[0]);
                }
                else {
                    reject(new Error('no such event found'));
                }
            }
        });
    });
}
// #endregion

// #endregion

// #region initialization

// #region require
const express = require('express');
const mysql = require('mysql');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const http = require('http');
const https = require('https');
// #endregion

// #region config
const app = express();

const privateKey = fs.readFileSync('/etc/letsencrypt/live/wbtt.us/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/wbtt.us/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/wbtt.us/chain.pem', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static("src/public"));
app.use(express.static("src/views/pages"));
app.use(cookieParser());
app.use(express.json());

const pool = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "UTSACSgroup7",
    database: "wbtt",
    dateStrings: true
});

// #endregion

// #endregion

// #region public pages

// #region basic pages
app.get('/', (req, res) => {
    searchEvents('limit:5')
        .catch((err) => {
            console.log(err);
        })
        .then((current_events) => {
            events = current_events;
        })
        .finally(() => {
            var loggedIn = '';
            accountStatus(req.cookies.token)
                .catch((err) => {
                    loggedIn = 'na';
                })
                .then((status) => {
                    loggedIn = status;
                })
                .finally(() => {
                    res.render('pages/index', {
                        events: events,
                        status: loggedIn
                    });
                });
        });
});

app.get('/about', (req, res) => {
    var loggedIn = '';
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            res.render('pages/about', {
                status: loggedIn
            });
        });
});

app.get('/contact', (req, res) => {
    var loggedIn = '';
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            res.render('pages/contact', {
                status: loggedIn
            });
        });
});

app.get('/faq', (req, res) => {
    var loggedIn = '';
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            res.render('pages/faq', {
                status: loggedIn
            });
        });
})
// #endregion

// #region event pages
app.get('/search', (req, res) => {
    var loggedIn = '';
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            event_list = []

            searchEvents(req.query.s)
                .catch((err) => {
                    console.log('errored in search');
                    console.log(err.message);
                })
                .then((events) => {
                    event_list = events;
                })
                .finally(() => {
                    res.render('pages/search', {
                        status: loggedIn,
                        events: event_list,
                        search: req.query.s
                    });
                });
        });
})

app.get('/event/:event_id', (req, res) => {
    var loggedIn = '';
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            getEvent(req.params.event_id)
                .catch((err) => {
                    res.redirect('/');
                })
                .then((this_event) => {
                    if (loggedIn == 'na')
                        res.render(`pages/event`, {
                            status: loggedIn,
                            event: this_event
                        });
                    else
                        res.render(`pages/${this_event.configuration}-configuration`, {
                            status: loggedIn,
                            event: this_event
                        });

                });
        });
});

app.get('/events/:category', (req, res) => {
    var loggedIn = '';
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            if (req.params.category != null) {
                let event_list = []
                searchEvents(`cat:${req.params.category.toLowerCase()}`)
                    .catch((err) => {
                        console.log(err);
                    })
                    .then((results) => {
                        event_list = results;
                    })
                    .finally(() => {
                        res.render('pages/category', {
                            category: req.params.category.toLowerCase(),
                            events: event_list,
                            status: loggedIn
                        });
                    });
            }
        });
});
// #endregion

// #endregion

// #region user

// #region user account pages
app.get('/my/register', (req, res) => {
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((result) => {
            loggedIn = result
        })
        .finally(() => {
            if (loggedIn == 'na') {
                res.render('pages/register', {
                    status: loggedIn
                })
            }
            else {
                res.redirect('/');
            }
        })
});

app.get('/my/account', authenticate, (req, res) => {
    var sql = "SELECT * FROM user WHERE user_id = ?;"
    sqlParams = [req.cookies.token];
    pool.query(sql, sqlParams, function (err, result) {
        if (err) throw err;

        var loggedIn = '';
        if (result[0].type == 1) loggedIn = 'user';
        if (result[0].type == 0) loggedIn = 'admin';

        if (result.length != 0) {
            res.render('pages/customer', {
                username: result[0].user_name,
                first_name: result[0].first_name,
                last_name: result[0].last_name,
                status: loggedIn
            });
        }
        else {
            res.status(404).send("Error, authenticated but not able to log in.");
        }
    });
});

app.get('/my/tickets', authenticate, (req, res) => {
    var sql = 
    `SELECT * 
    FROM ticket as t
    JOIN event as e ON t.event_id = e.event_id
    JOIN venue_sections as v ON t.section_name = v.section_name
    WHERE sold=1 AND user_id=${req.cookies.token} AND e.configuration = v.venue_configuration`;
    var promises = [accountStatus(req.cookies.token), query(sql, [])]
    Promise.all(promises)
        .catch((err) => {
            loggedIn = 'na';
            tickets = [];
        })
        .then((results) => {
            loggedIn = results[0]
            ticketList = results[1];
        })
        .finally(() => {
            res.render('pages/tickets', {
                status: loggedIn,
                tickets: ticketList
            })

        })
});

app.get('/my/cart', authenticate, (req, res) => {
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            checkTimestamps(`user_id = ${req.cookies.token}`, `cart.user_id = ${req.cookies.token}`)
                .catch((err) => {
                    console.log('error in check timestamps in my/cart');
                    console.log(err.message);
                })
                .then((result) => {
                    if (result == null)
                        result = null;
                })
                .finally(() => {
                    let sql =
                        `SELECT *
                        FROM wbtt.cart as c
                        JOIN wbtt.ticket as t ON t.ticket_id = c.ticket_id
                        JOIN wbtt.event as e ON t.event_id = e.event_id
                        JOIN wbtt.venue_sections as v ON t.section_name = v.section_name
                        WHERE e.configuration = v.venue_configuration AND c.user_id = ${req.cookies.token};`;
                    query(sql, [])
                        .catch((err) => {
                            console.log('error in big sql query in my/cart');
                            console.log(err.message);
                        })
                        .then((results) => {
                            let tickets = results;
                            query('SELECT * FROM discount_code WHERE code IN (SELECT promocode FROM user WHERE user_id=?)', [req.cookies.token])
                                .catch((err) => {
                                    console.log('error in discount query in my/cart');
                                    console.log(err.message);
                                })
                                .then((results) => {
                                    res.render('pages/cart', {
                                        status: loggedIn,
                                        items: tickets,
                                        promocode: results[0]
                                    });
                                })

                        })
                });
        });
});

app.get('/my/confirmation', authenticate, (req, res) => {
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((result) => {
            loggedIn = result
        })
        .finally(() => {
            const dt = new Date();
            const padL = (nr, len = 2, chr = `0`) => `${nr}`.padStart(2, chr);

            // YYYY-MM-DD HH:MM:SS format
            const datetime = `${padL(dt.getFullYear())}-${padL(dt.getMonth() + 1)}-${dt.getDate()} ${padL(dt.getHours())}:${padL(dt.getMinutes())}:${padL(dt.getSeconds())}`

            // gets the total cost of the order
            let total_cost_sql = `SELECT SUM(price) as total FROM ticket WHERE ticket_id IN (SELECT ticket_id FROM cart WHERE user_id=${req.cookies.token})`;
            query(total_cost_sql, [])
                .catch((err) => {
                    console.log('errored in confirmation sum')
                    console.log(err.message);
                })
                .then((result) => {
                    // creates new order
                    if (result.length == 0) {
                        res.render('pages/confirmation', {
                            status: loggedIn
                        });
                        return;
                    }
                    let order_sql = `INSERT INTO \`order\` SET user_id=${req.cookies.token}, total_cost=${result[0].total}, order_date='${datetime}'`
                    query(order_sql, [])
                        .catch((err) => {
                            console.log('errored in confirmation insert')
                            console.log(err.message);
                        })
                        .then((result) => {
                            // gets order id from previously created order
                            let order_num_sql = `SELECT MAX(order_id) as max FROM \`order\` WHERE user_id=${req.cookies.token}`;
                            query(order_num_sql)
                                .catch((err) => {
                                    console.log('errored in confirmation max')
                                    console.log(err.message);
                                })
                                .then((result) => {
                                    // updates tickets with info from order
                                    let buy_sql = `UPDATE ticket
                                    SET user_id = ${req.cookies.token}, hold=0, sold=1, hold_time=null, sold_date='${datetime}', order_id=${result[0].max}
                                    WHERE ticket_id IN (SELECT ticket_id FROM cart WHERE user_id=${req.cookies.token});`
                                    query(buy_sql, [])
                                        .catch((err) => {
                                            console.log('error in /my/confirmation in buysql');
                                            console.log(err.message);
                                        })
                                        .then((result) => {
                                            // removes tickets from cart
                                            let rem_sql = `DELETE FROM cart WHERE user_id=${req.cookies.token}`
                                            query(rem_sql, [])
                                                .catch((err) => {
                                                    console.log('error in /my/confirmation in remsql');
                                                    console.log(err.message);
                                                })
                                                .then((result) => {
                                                    query(`UPDATE user SET promocode=null WHERE user_id=${req.cookies.token}`, [])
                                                        .catch((err) => {
                                                            console.log('error in /my/confirmation in update user');
                                                            console.log(err.message);
                                                        })
                                                        .then((result) => {
                                                            res.render('pages/confirmation', {
                                                                status: loggedIn
                                                            })
                                                        })
                                                })
                                        })
                                })

                        })
                })
        })

});
// #endregion

// #region user account api
app.get('/api/my/create', (req, res) => {
    var username, password, email, first_name, last_name;
    // make sure request contains all elements of a user account
    if (req.body.username != null && req.body.password != null
        && req.body.email != null && req.body.first_name != null
        && req.body.last_name != null) {
        username = req.body.username;
        password = req.body.password;
        email = req.body.email;
        first_name = req.body.first_name;
        last_name = req.body.last_name;
    }
    else {
        var req_query;
        if (Object.keys(req.query).length == 1)
            req_query = JSON.parse(Object.keys(req.query)[0]);
        else {
            var keys_string = '';
            Object.keys(req.query).forEach( obj => {
                keys_string += obj;
            });
            req_query = JSON.parse(keys_string);
        }
        if (req_query.username != null && req_query.password != null
            && req_query.email != null && req_query.first_name != null
            && req_query.last_name != null) {
            username = req_query.username;
            password = req_query.password;
            email = req_query.email;
            first_name = req_query.first_name;
            last_name = req_query.last_name;
        }
        else {
            res.status(403).send("Missing body parts");
            return;
        }
    }

    // checks to make sure username isn't already in use
    query("SELECT * FROM user WHERE user_name = ?;", [username])
        .catch((err) => {
            console.log('errored in /api/my/create in check query')
            console.log(err.message);
            res.send("db error");
        })
        .then((result) => {
            if (result.length != 0) {
                res.send("Username already in use");
                return;
            }

            // gets the max id
            query("SELECT MAX(user_id) AS max_id FROM user", [])
                .catch((err) => {
                    console.log('errored in /api/my/create in max_id query');
                    console.log(err.message);
                    res.send('db error');
                })
                .then((result) => {
                    var max_id = result[0].max_id + 1;
                    let user_sql = "INSERT INTO user (user_id, user_name, first_name, last_name, email, type) values (?, ?, ?, ?, ?, 1)";
                    let user_sqlParams = [max_id, username, first_name, last_name, email];

                    let pass_sql = "INSERT INTO password (password_id, user_name, password) values (?, ?, ?)";
                    let pass_sqlParams = [max_id, username, password];

                    // insert user info into tables
                    Promise.all([query(user_sql, user_sqlParams), query(pass_sql, pass_sqlParams)])
                        .catch((err) => {
                            console.log('error in /api/my/create in insertion queries');
                            console.log(err.message);
                        })
                        .then((result) => {
                            res.status(200).send("Account successfully created!");
                        })
                })
        })
});

app.get('/api/my/login', (req, res) => {
    var user;
    // make sure request contains all elements of a user account
    if (req.body.username != null && req.body.password != null) {
        user = req.body;
    }
    else {
        var req_query;
        if (Object.keys(req.query).length == 1)
            req_query = JSON.parse(Object.keys(req.query)[0]);
        else {
            var keys_string = '';
            Object.keys(req.query).forEach( obj => {
                keys_string += obj;
            });
            req_query = JSON.parse(keys_string);
        }

        if (req_query.username != null && req_query.password != null) {
            user = req_query;
        }

        else {
            res.status(403).send(`Missing body parts`);
            return;
        }
    }


    // checks to see if username/password pair exist
    var sql = "SELECT * FROM password WHERE user_name = ? AND password = ?"
    var sqlParams = [user.username, user.password];
    pool.query(sql, sqlParams, function (err, result) {
        if (err) {
            throw err;
        }
        else if (result.length == 0) {
            res.status(400).send("Invalid username/password combination.");
        }
        else {
            res.cookie(`token`, `${result[0].password_id}`);
            res.status(200).send('successfully logged in');
        }
    });

});

app.post('/api/my/addToCart', authenticate, (req, res) => {
    const padL = (nr, len = 2, chr = `0`) => `${nr}`.padStart(2, chr);
    const min = 5;

    let holdTime = (minutes) => {
        const dt = new Date((new Date()).getTime() + minutes * 60000);

        // 'YYYY-MM-DD HH:MM:SS' format
        return `${padL(dt.getFullYear())}-${padL(dt.getMonth() + 1)}-${dt.getDate()} ${padL(dt.getHours())}:${padL(dt.getMinutes())}:${padL(dt.getSeconds())}`

    }

    // e.g., ['section-name_ticket-number', ...] (referencing the ticket table)
    var tickets_str;
    // e.g., 1 (referencing the event table)
    var event_id;
    // e.g., 1 (referencing the user table)
    var user_id = req.cookies.token;

    if (req.body.tickets != null && req.body.event_id != null) {
        tickets_str = req.body.tickets;
        event_id = req.body.event_id;
    }
    else {
        var req_query;
        if (Object.keys(req.query).length == 1)
            req_query = JSON.parse(Object.keys(req.query)[0]);
        else {
            var keys_string = '';
            Object.keys(req.query).forEach( obj => {
                keys_string += obj;
            });
            req_query = JSON.parse(keys_string);
        }

        if (json_query.tickets != null && json_query.event_id != null) {
            tickets_str = json_query.tickets;
            event_id = json_query.event_id;
        }

        else {
            res.status(403).send(`Missing body parts`);
            return;
        }
    }
    // e.g., INSERT INTO `wbtt`.`cart` (`user_id`, `ticket_id`, `age`) VALUES ('1', '2', '2023-04-10');
    var cartSQL = 'INSERT INTO cart (user_id, ticket_id, age) VALUES ';
    // e.g., UPDATE `wbtt`.`ticket` SET `user_id` = '2', `hold` = '1', `hold_time` = '2023-04-08 14:00:00' WHERE (`ticket_id` = '4');
    var holdSQL = `UPDATE ticket SET user_id = ${user_id}, hold = 1, hold_time = '${holdTime(min)}' WHERE (`;

    var getTicketIds = `SELECT ticket_id FROM ticket WHERE (`;

    var updateHoldsSQL = `UPDATE ticket SET hold_time = '${holdTime(min)}' WHERE user_id = ${user_id} AND hold = 1;`

    // convert tickets from string to array
    var idx = 0;
    var tickets = [];
    tickets_str.split(",").forEach((token) => {
        tickets.push(token);
    })

    if (tickets.length == 0) {
        res.status(403).send('no tickets provided');
        return;
    }

    tickets.forEach((ticket) => {
        let tokens = ticket.split('_');
        let section_name = tokens[0];
        let seat_number = tokens[1];

        getTicketIds += `(section_name = '${section_name}' AND seat = ${seat_number} AND event_id = ${event_id} AND sold = 0 AND hold = 0) OR `
    })

    getTicketIds = getTicketIds.substring(0, getTicketIds.length - 4) + ');'

    query(getTicketIds, [])
        .catch((err) => {
            console.log('errored in /api/my/addToCart getTicketIds');
            console.log(err.message);
            res.send('failed :(');
        })
        .then((results) => {
            if (results.length == 0) {
                res.send('no tickets added');
                return;
            }
            var tickets = [];

            results.forEach((ticket) => {
                tickets.push(ticket.ticket_id)
                cartSQL += `(${user_id}, ?, '${holdTime(10)}'), `
                holdSQL += `ticket_id = ? OR `
            });

            cartSQL = cartSQL.substring(0, cartSQL.length - 2) + ';'
            holdSQL = holdSQL.substring(0, holdSQL.length - 4) + ');'

            if (cartSQL == '' || holdSQL == '') {
                res.status(403).send('error in sql generation');
                return;
            }

            let cartQuery = query(cartSQL, tickets);
            let holdQuery = query(holdSQL, tickets);
            let curHoldQuery = query(updateHoldsSQL, []);

            Promise.all([cartQuery, holdQuery, curHoldQuery])
                .catch((err) => {
                    console.log('errored in /api/my/addToCart');
                    console.log(err.message);
                    res.send('failed :(');
                })
                .then((results) => {
                    res.send(`${tickets}`);
                });
        })


});

app.get('/api/my/removeFromCart', authenticate, (req, res) => {
    var ticket_id;
    if (req.body.ticket_id != null) {
        ticket_id = req.body.ticket_id;
    }
    else {
        var req_query;
        if (Object.keys(req.query).length == 1)
            req_query = JSON.parse(Object.keys(req.query)[0]);
        else {
            var keys_string = '';
            Object.keys(req.query).forEach( obj => {
                keys_string += obj;
            });
            req_query = JSON.parse(keys_string);
        }

        if (req_query.ticket_id != null) {
            ticket_id = req_query.ticket_id;
        }

        else {
            res.status(403).send(`Missing body parts`);
            return;
        }
    }
    // remove from cart (delete) and update to not held in ticket
    var deleteCartSQL = `DELETE FROM cart WHERE ticket_id=${ticket_id} AND user_id=${req.cookies.token}`;
    var updateTicketSQL = `UPDATE ticket SET user_id=null, hold=0, hold_time=null WHERE ticket_id=${ticket_id} AND user_id=${req.cookies.token}`;
    var promises = [query(deleteCartSQL, []), query(updateTicketSQL, [])];

    Promise.all(promises)
        .catch((err) => {
            console.log('errored in removeFromCart')
            console.log(err.message);
            res.send('failed to remove from cart');
        })
        .then((result) => {
            if (result[1].affectedRows == 1)
                res.send('Successfully removed from cart.');
            else
                res.send('Failed to remove from cart.');
        })
})

app.get('/api/my/getCart', authenticate, (req, res) => {
    getCart(req.cookies.token)
        .catch((err) => {
            console.log('error in getCart api');
            console.log(err.message);
        })
        .then((results) => {
            res.send(results);
        })
})

app.get('/api/my/setDiscountCode', authenticate, (req, res) => {
    var promocode;
    if (req.body.promocode != null) {
        promocode = req.body.promocode;
    }
    else {
        var req_query;
        if (Object.keys(req.query).length == 1)
            req_query = JSON.parse(Object.keys(req.query)[0]);
        else {
            var keys_string = '';
            Object.keys(req.query).forEach( obj => {
                keys_string += obj;
            });
            req_query = JSON.parse(keys_string);
        }

        if (json_query.promocode != null) {
            promocode = json_query.promocode;
        }

        else {
            res.status(403).send(`Missing body parts`);
            return;
        }
    }

    query('SELECT * FROM discount_code WHERE code=?;', [promocode])
        .catch((err) => {
            console.log('errored in /api/my/setDiscountCode in get codes')
            console.log(err.message);
            res.send('Some error occured, please try again.');
        })
        .then((result) => {
            if (result.length != 1) {
                res.send('No code found.');
            }
            else {
                query('UPDATE user SET promocode=? WHERE user_id=?;', [promocode, req.cookies.token])
                    .catch((err) => {
                        console.log('errored in /api/my/setDiscountCode in update');
                        console.log(err.message);
                        res.send('Some error occured, please try again.');
                    })
                    .then((result) => {
                        res.send('Code successfully set.');
                    })
            }
        })
})
// #endregion

// #endregion

// #region search api
app.get('/api/search', (req, res) => {
    event_list = []
    search_terms = ''
    if (req.body.search_terms != null) {
        search_terms = req.body.search_terms;
    }
    else if (req.query.search_terms != null) {
        search_terms = req.query.search_terms;
    }

    searchEvents(search_terms)
        .catch((err) => {
            console.log('errored in /api/search');
            console.log(err.message);
        })
        .then((events) => {
            event_list = events;
        })
        .finally(() => {
            res.send(JSON.stringify(event_list));
        });
});

app.get('/api/getTickets/:event_id/:section_name', authenticate, (req, res) => {
    checkTimestamps(`event_id = ${req.params.event_id}`, `event_id = ${req.params.event_id}`)
        .catch((err) => {
            console.log('errored in /api/getTickets/:event_id/:section_name');
            console.log(err.message);
        })
        .then((result) => {
            let tickets_sql = 'SELECT seat FROM ticket WHERE event_id = ? AND section_name = ? AND (hold = 1 OR sold = 1);';
            let params = [req.params.event_id, req.params.section_name];
            let price_sql = 'SELECT price, sale_price FROM ticket WHERE event_id = ? AND section_name = ? LIMIT 1';

            let promises = [query(tickets_sql, params), query(price_sql, params)];
            Promise.all(promises)
                .catch((err) => {
                    console.log(err.message);
                })
                .then((results) => {
                    res.send(JSON.stringify(results));
                })
        })

});

// #endregion

// #region admin

// #region admin dashboard pages
app.get('/admin/dashboard', authenticate, (req, res) => {
    var loggedIn = '';
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {

            var events_l = [];
            var orders_date_l = [];
            var orders_cust_l = [];
            var orders_doll_l = [];
            var users_l = [];
            var discount_l = [];
            adminDashboard()
                .catch((err) => {
                    console.log(err);
                })
                .then((values) => {
                    // events 0, orders by date 1, orders by customer 2, orders by dollar 3, users 4, discount codes 5
                    if (values[0] != null)
                        events_l = values[0];
                    if (values[1] != null)
                        orders_date_l = values[1];
                    if (values[2] != null)
                        orders_cust_l = values[2];
                    if (values[3] != null)
                        orders_doll_l = values[3];
                    if (values[4] != null)
                        users_l = values[4];
                    if (values[5] != null)
                        discount_l = values[5];
                })
                .finally(() => {
                    res.render('pages/admin-page', {
                        status: loggedIn,
                        events: events_l,
                        orders_date: orders_date_l,
                        orders_customer: orders_cust_l,
                        orders_dollar: orders_doll_l,
                        users: users_l,
                        discount_codes: discount_l
                    });
                });
        });
});

app.get('/admin/order/:order_id', authenticate, (req, res) => {
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            query(`SELECT * FROM ticket WHERE order_id = ${req.params.order_id};`, [])
                .catch((err) => {
                    console.log('error in admin order');
                    console.log(err.message);
                })
                .then((result) => {
                    if (result.length >= 1) {
                        res.render('pages/order', {
                            status: loggedIn,
                            order: result
                        })
                    }
                    else {
                        res.redirect('/404')
                    }
                })

        });
})

app.get('/admin/editEvent/:event_id', authenticate, (req, res) => {
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            var promises = [getEvent(req.params.event_id), query(`SELECT * FROM images`, [])];
            Promise.all(promises)
                .catch((err) => {
                    if (err.message == 'no such event found') {
                        res.redirect('/admin/createEvent');
                        return;
                    }
                    else {
                        console.log('errored in admin edit event from get event');
                        console.log(err.message);
                    }
                })
                .then((result) => {
                    res.render('pages/edit-event', {
                        status: loggedIn,
                        event: result[0],
                        images: result[1]
                    });
                })
        });
});

app.get('/admin/createEvent', authenticate, (req, res) => {
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            query(`SELECT * FROM images`, [])
                .catch( (err) => {
                    console.log ('error in select query in create event');
                    console.log(err.message);
                })
                .then( (result) => {
                    res.render('pages/create-event', {
                        status: loggedIn,
                        images: result
                    })
                })
            
        });
});

app.get('/admin/editUser/:user_id', authenticate, (req, res) => {
    var loggedIn = '';
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            query('SELECT * FROM user WHERE user_id=? LIMIT 1', req.params.user_id)
                .catch((err) => {
                    console.log('errored in edit user');
                    console.log(err.message);
                    res.status(403).send('error');
                })
                .then((result) => {
                    if (result.length == 1) {
                        res.render('pages/edit-user', {
                            status: loggedIn,
                            user: result[0]
                        });
                    }
                    else {
                        res.redirect('/admin/createUser');
                    }
                })
        });
});

app.get('/admin/createUser', authenticate, (req, res) => {
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            res.render('pages/create-user', {
                status: loggedIn
            })
        });
});

app.get('/admin/createDiscount', authenticate, (req, res) => {
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            res.render('pages/create-discount', {
                status: loggedIn
            })
        });
});

app.get('/admin/editDiscount/:discount_id', authenticate, (req, res) => {
    var loggedIn = '';
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            query('SELECT * FROM discount_code WHERE discount_id=? LIMIT 1', req.params.discount_id)
                .catch((err) => {
                    console.log('errored in edit discount');
                    console.log(err.message);
                    res.status(403).send('error');
                })
                .then((result) => {
                    if (result.length == 1) {
                        res.render('pages/edit-discount', {
                            status: loggedIn,
                            code: result[0]
                        });
                    }
                    else {
                        res.redirect('/admin/createDiscount');
                    }
                })
        });
})

app.get('/admin/createVenue', authenticate, (req, res) => {
    accountStatus(req.cookies.token)
    .catch((err) => {
        loggedIn = 'na';
    })
    .then((status) => {
        loggedIn = status;
    })
    .finally(() => {
        res.render('pages/venue-builder', {
            status: loggedIn
        })
    });
})
// #endregion

// #region admin api
app.post('/api/admin/createTickets', (req, res) => {
    let event_id = -1;

    if (req.body.event_id != null)
        event_id = req.body.event_id;
    else {
        var req_query;
        if (Object.keys(req.query).length == 1)
            req_query = JSON.parse(Object.keys(req.query)[0]);
        else {
            var keys_string = '';
            Object.keys(req.query).forEach( obj => {
                keys_string += obj;
            });
            req_query = JSON.parse(keys_string);
        }
        if (req_query.event_id != null)
            event_id = req_query.event_id;
        else {
            res.send('missing body parts');
            return;
        }
    }


    let sql = 'INSERT INTO ticket (ticket_id, event_id, section_name, seat, hold, sold, price) VALUES '

    var format = (index, section_name, seat, price) => {
        return `('${index}', '${event_id}', '${section_name}', '${seat}', '0', '0', '${price}'),\n`
    }

    query('SELECT venue, configuration, base_price FROM event WHERE event_id = ?', event_id)
        .catch((err) => {
            console.log(err);
        })
        .then((result) => {
            let cnt = 0;
            let venue = result[0].venue;
            let config = result[0].configuration;
            let base_price = result[0].base_price;

            let max_ticket_query = query("SELECT MAX(ticket_id) as max_ticket_id FROM ticket", []);
            let more_query = query('select section_name, section_capacity, section_weight from venue_sections where venue_name = ? and venue_configuration = ?', [venue, config]);
            Promise.all([max_ticket_query, more_query])
                .then((results) => {
                    let current_ticket_id = results[0][0].max_ticket_id + 1;
                    results[1].forEach((section) => {
                        for (let i = 0; i < section.section_capacity; i++) {
                            sql += format(current_ticket_id++, section.section_name, i, section.section_weight * base_price);
                            cnt++;
                        }
                    });

                    sql = sql.substring(0, sql.length - 2) + ';'

                    query(sql, [])
                        .catch((err) => {
                            console.log(err);
                        })
                        .then(() => {
                            res.send(`success! created ${cnt} tickets.`);
                        })
                        .finally(() => {

                        });
                });
        });


});

app.get('/api/admin/updateTickets', (req, res) => {
    let event_id, factor, discount_factor;

    if (req.body.event_id != null && req.body.factor != null) {
        event_id = req.body.event_id;
        factor = req.body.factor;
        if (req.body.discount_factor != null && req.body.discount_factor != 'undefined')
            discount_factor = req.body.discount_factor;
    }
    else {
        var req_query;
        if (Object.keys(req.query).length == 1)
            req_query = JSON.parse(Object.keys(req.query)[0]);
        else {
            var keys_string = '';
            Object.keys(req.query).forEach( obj => {
                keys_string += obj;
            });
            req_query = JSON.parse(keys_string);
        }
        if (req_query.event_id != null && req_query.factor != null) {
            event_id = req_query.event_id;
            factor = req_query.factor;
            if (req_query.discount_factor != null && req_query.discount_factor != 'undefined')
                discount_factor = req_query.discount_factor;
        }
        else {
            res.send('missing body parts');
            return;
        }
    }
    var discount_str = '';
    if (discount_factor != null && discount_factor != 0)
        discount_str = `, sale_price = price * ${discount_factor}`;
    else if (discount_factor != null && discount_factor == 0)
        discount_str = ', sale_price = null';
    var sql = `UPDATE ticket SET price = price * ${factor}${discount_str} WHERE event_id = ${event_id} AND sold=0`

    query(sql, [])
        .catch((err) => {
            console.log('error in update ticket select');
            console.log(err.message);
        })
        .then((result) => {
            res.send("success!")
        })
})

app.get('/api/admin/editUser', (req, res) => {
    var user_id, username, password, email, first_name, last_name, type;
    // make sure request contains all elements of a user account
    if (req.body.user_id != null && req.body.username != null
        && req.body.email != null
        && req.body.first_name != null && req.body.last_name != null
        && req.body.type != null) {
        user_id = req.body.user_id;
        username = req.body.username;
        if (req.body.password != null && req.body.password != '');
        password = req.body.password;
        email = req.body.email;
        first_name = req.body.first_name;
        last_name = req.body.last_name;
        type = req.body.type;
    }
    else {
        var req_query;
        if (Object.keys(req.query).length == 1)
            req_query = JSON.parse(Object.keys(req.query)[0]);
        else {
            var keys_string = '';
            Object.keys(req.query).forEach( obj => {
                keys_string += obj;
            });
            req_query = JSON.parse(keys_string);
        }
        if (req_query.user_id != null && req_query.username != null
            && req_query.email != null
            && req_query.first_name != null && req_query.last_name != null
            && req_query.type != null) {
            user_id = req_query.user_id;
            username = req_query.username;
            if (req_query.password != null && req_query.password != '')
                password = req_query.password;
            email = req_query.email;
            first_name = req_query.first_name;
            last_name = req_query.last_name;
            type = req_query.type;
        }
        else {
            res.status(403).send("Missing body parts");
            return;
        }
    }

    let user_sql = 'UPDATE user SET user_name=?, email=?, first_name=?, last_name=?, type=? WHERE user_id=?;';
    let user_params = [username, email, first_name, last_name, type, user_id];
    let user_query = query(user_sql, user_params);
    let pass_query;

    if (password != null && password != '') {
        let pass_sql = 'UPDATE password SET user_name=?, password=? WHERE password_id=?';
        let pass_params = [username, password, user_id];
        let pass_query = query(pass_sql, pass_params);
    }

    else {
        let pass_sql = 'UPDATE password SET user_name=? WHERE password_id=?';
        let pass_params = [username, user_id];
        let pass_query = query(pass_sql, pass_params);
    }

    Promise.all([user_query, pass_query])
        .catch((err) => {
            console.log('error in update user admin function');
            console.log(err.message);
            res.send('error in db');
        })
        .then((result) => {
            res.send('Account edited successfully!')
        });
});

app.get('/api/admin/createEvent', (req, res) => {
    var event_name, event_description, image_url, configuration, category, date, time, day, base_price;
    // make sure request contains all elements of a user account
    if (req.body.event_name != null && req.body.image_url != null
        && req.body.configuration != null && req.body.category != null
        && req.body.date != null && req.body.type != null
        && req.body.day != null && req.body.base_price != null) {
        event_name = req.body.event_name;
        event_description = req.body.event_description;
        image_url = req.body.image_url;
        configuration = req.body.configuration;
        category = req.body.category;
        date = req.body.date;
        time = req.body.time;
        day = req.body.day;
        base_price = req.body.base_price;
    }
    else {
        var req_query;
        if (Object.keys(req.query).length == 1)
            req_query = JSON.parse(Object.keys(req.query)[0]);
        else {
            var keys_string = '';
            Object.keys(req.query).forEach( obj => {
                keys_string += obj;
            });
            req_query = JSON.parse(keys_string);
        }
        if (req_query.event_name != null && req_query.image_url != null
            && req_query.configuration != null && req_query.category != null
            && req_query.date != null && req_query.time != null
            && req_query.day != null && req_query.base_price != null) {
            event_name = req_query.event_name;
            event_description = req_query.event_description;
            image_url = req_query.image_url;
            configuration = req_query.configuration;
            category = req_query.category;
            date = req_query.date;
            time = req_query.time;
            day = req_query.day;
            base_price = req_query.base_price;
        }
        else {
            res.status(403).send("Missing body parts");
            return;
        }
    }
    var max_tickets = configuration == 'concert' ? 644 : 928;
    let sql = `INSERT INTO event (event_name, event_description, image_url, venue, configuration, max_tickets, category, date, time, day, base_price, discount_eligible, fee_eligible)
    VALUES ('${event_name}', '${event_description}', '${image_url}', 'AT&T', '${configuration}', ${max_tickets}, '${category}', '${date}', '${time}', '${day}', ${base_price}, 1, 1)`;
    query(sql, [])
        .catch((err) => {
            console.log('errored in create event');
            console.log(err.message);
            res.send(err.message);
        })
        .then((result) => {
            res.send('Successfully created event.')
        })
});

app.get('/api/admin/editEvent', (req, res) => {
    var event_id, event_name, event_description, image_url, category, date, time, day, base_price, discount_base_price = null;
    // make sure request contains all elements of a user account
    if (req.body.event_id != null && req.body.event_name != null
        && req.body.image_url != null && req.body.category != null
        && req.body.date != null && req.body.type != null
        && req.body.day != null && req.body.base_price != null) {
        event_id = req.body.event_id;
        event_name = req.body.event_name;
        event_description = req.body.event_description;
        image_url = req.body.image_url;
        category = req.body.category;
        date = req.body.date;
        time = req.body.time;
        day = req.body.day;
        base_price = req.body.base_price;
        if (req.body.discount_base_price != null && req.body.discount_base_price != '')
            discount_base_price = req.body.discount_base_price
    }
    else {
        var req_query;
        if (Object.keys(req.query).length == 1)
            req_query = JSON.parse(Object.keys(req.query)[0]);
        else {
            var keys_string = '';
            Object.keys(req.query).forEach( obj => {
                keys_string += obj;
            });
            req_query = JSON.parse(keys_string);
        }
        if (req_query.event_id != null && req_query.event_name != null
            && req_query.image_url != null && req_query.category != null
            && req_query.date != null && req_query.time != null
            && req_query.day != null && req_query.base_price != null) {
            event_id = req_query.event_id;
            event_name = req_query.event_name;
            event_description = req_query.event_description;
            image_url = req_query.image_url;
            category = req_query.category;
            date = req_query.date;
            time = req_query.time;
            day = req_query.day;
            base_price = req_query.base_price;
            if (req_query.discount_base_price != null && req_query.discount_base_price != '')
                discount_base_price = req_query.discount_base_price
        }
        else {
            res.status(403).send("Missing body parts");
            return;
        }
    }
    let discount_str = '';
    if (discount_base_price != null && discount_base_price == 0)
        discount_str = `, discount_base_price = null`
    if (discount_base_price != null) {
        discount_str = `, discount_base_price = ${discount_base_price}`
    }
    let sql = `UPDATE event SET event_name=?, event_description=?, image_url=?, category=?, date=?, time=?, day=?, base_price=? ${discount_str} WHERE event_id=${event_id}`;
    let params = [event_name, event_description, image_url, category, date, time, day, base_price];

    query(sql, params)
        .catch((err) => {
            console.log('errored in edit event');
            console.log(err.message);
            res.send(err.message);
        })
        .then((result) => {
            res.send('Successfully edited event.')
        })
});

app.get('/api/admin/createDiscount', (req, res) => {
    var code, type, amount, expiration;
    // make sure request contains all elements of a user account
    if (req.body.code != null
        && req.body.type != null && req.body.amount != null
        && req.body.expiration != null) {
        discount_id = req.body.discount_id;
        code = req.body.code;
        type = req.body.type;
        amount = req.body.amount;
        expiration = req.body.expiration;
    }
    else {
        var req_query;
        if (Object.keys(req.query).length == 1)
            req_query = JSON.parse(Object.keys(req.query)[0]);
        else {
            var keys_string = '';
            Object.keys(req.query).forEach( obj => {
                keys_string += obj;
            });
            req_query = JSON.parse(keys_string);
        }
        if (req_query.code != null
            && req_query.type != null && req_query.amount != null
            && req_query.type != null) {
            discount_id = req_query.discount_id;
            code = req_query.code;
            type = req_query.type;
            amount = req_query.amount;
            expiration = req_query.expiration;
        }
        else {
            res.status(403).send("Missing body parts");
            return;
        }
    }

    let sql = `INSERT INTO discount_code (code, type, amount, expiration) VALUES (?, ?, ?, ?)`;
    let params = [code, type, amount, expiration];

    query(sql, params)
        .catch((err) => {
            console.log('errored in create discount');
            console.log(err.message);
            res.send(err.message);
        })
        .then((result) => {
            res.send('Successfully created discount.');
        })
});

app.get('/api/admin/editDiscount', (req, res) => {
    var discount_id, code, type, amount, expiration;
    // make sure request contains all elements of a user account
    if (req.body.discount_id != null && req.body.code != null
        && req.body.type != null && req.body.amount != null
        && req.body.expiration != null) {
        discount_id = req.body.discount_id;
        code = req.body.code;
        type = req.body.type;
        amount = req.body.amount;
        expiration = req.body.expiration;
    }
    else {
        var req_query;
        if (Object.keys(req.query).length == 1)
            req_query = JSON.parse(Object.keys(req.query)[0]);
        else {
            var keys_string = '';
            Object.keys(req.query).forEach( obj => {
                keys_string += obj;
            });
            req_query = JSON.parse(keys_string);
        }
        if (req_query.discount_id != null && req_query.code != null
            && req_query.type != null && req_query.amount != null
            && req_query.type != null) {
            discount_id = req_query.discount_id;
            code = req_query.code;
            type = req_query.type;
            amount = req_query.amount;
            expiration = req_query.expiration;
        }
        else {
            res.status(403).send("Missing body parts");
            return;
        }
    }

    let sql = `UPDATE discount_code SET code=?, type=?, amount=?, expiration=? WHERE discount_id=${discount_id}`;
    let params = [code, type, amount, expiration];

    query(sql, params)
        .catch((err) => {
            console.log('errored in edit discount');
            console.log(err.message);
            res.send(err.message);
        })
        .then((result) => {
            res.send('Successfully edited discount.');
        })
});

app.post('/api/admin/upload', authenticate, (req, res) => {
    fs.writeFile(`venues/${req.body.name}.html`, req.body.html, (err) => {
        if (err) return console.log(err);
    });
});
//#endregion

// #endregion

// #region 404
app.use((req, res) => {
    res.status(404);

    res.format({
        html: function () {
            res.render('pages/404', { url: req.url })
        },
        json: function () {
            res.json({ error: 'Not found' })
        },
        default: function () {
            res.type('txt').send('Not found')
        }
    })
});
// #endregion

// #region start webserver

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(8000, () => {
    console.log('HTTP Server running on port 80');
});

httpsServer.listen(8443, () => {
    console.log('HTTPS Server running on port 443');
});
// #endregion
