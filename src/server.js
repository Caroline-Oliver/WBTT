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
                else {
                    next();
                }

            }
        });
    }
}
// #endregion

// #region db helper functions
function checkTimestamps(search_terms) {
    const dt = new Date();
    const padL = (nr, len = 2, chr = `0`) => `${nr}`.padStart(2, chr);

    // YYYY-MM-DD HH:MM:SS format
    const datetime = `${padL(dt.getFullYear())}-${padL(dt.getMonth() + 1)}-${dt.getDate()} ${padL(dt.getHours())}:${padL(dt.getMinutes())}:${padL(dt.getSeconds())}`

    var updateSql = "UPDATE ticket\nSET hold = 0, hold_time = null, user_id = null" + '\n' +
        `WHERE (${search_terms}) AND hold=1 AND hold_time < '${datetime}';` + '\n';
    var deleteSql = `DELETE cart FROM cart
        JOIN ticket as t ON cart.ticket_id = t.ticket_id
        WHERE cart.user_id = 4 AND t.hold = 0;`

    return new Promise((resolve, reject) => {
        Promise.all([query(updateSql, []), query(deleteSql, [])])
            .catch((err) => {
                console.log('errored in checkTimestamps');
                console.log(err);
                reject(err);
            })
            .then((result) => {
                resolve(result);
            })
    })
}

function getTicketList(user_id) {
    var ticket_list = [];
    var sql = "SELECT * FROM cart WHERE user_id = ?;";
    sqlParams = [user_id];
    return new Promise((resolve, reject) => {
        pool.query(sql, sqlParams, function (err, result) {
            if (err) {
                console.log('errored in getTicketList');
                console.log(err.message);
                reject(err);
            }
            var i = -1;
            while (++i < result.length) {
                ticket_list.push(result[i].item);
            }
            resolve(ticket_list);
        });
    });
}

function ticketListToInfoList(ticket_list) {
    return new Promise((resolve, reject) => {
        var info_list = [];
        var sql = "SELECT * FROM tickets WHERE ";
        var i = -1;
        if (ticket_list == null) {
            reject(new Error("ticket_list undefined"));
        }

        else if (ticket_list.length == 0) {
            resolve([]);
        }

        else {
            while (++i < ticket_list.length) {
                if (i < ticket_list.length - 1)
                    sql += "ticket_id = ? OR ";
                else
                    sql += "ticket_id = ?;";
            }

            pool.query(sql, ticket_list, function (err, result) {
                if (err) {
                    console.log('errored in ticketListToInfoList');
                    console.log(err.message);
                    reject(err);
                }
                else {
                    cart = [];
                    let i = -1;
                    while (++i < result.length) {
                        info_list.push({
                            event_name: result[i].event_name,
                            section: result[i].section,
                            seat: result[i].seat,
                            price: result[i].price
                        });
                    }
                    resolve(info_list);
                }
            });
        }
    });

}

function searchEvents(search_terms) {
    return new Promise((resolve, reject) => {
        if (search_terms == '') {
            resolve([]);
        }
        else if (search_terms.includes('--') || search_terms.includes(';')) {
            reject(new Error('attempted SQL injection in search function'));
        }
        else {
            search_terms = ((search_terms + '').replace("'", "\\'")).split(' ');
            let where_search = '';
            let count_search = '';
            let special_terms = '';
            search_terms.forEach(element => {
                if (element.includes(':')) {
                    let type = element.substring(0, element.indexOf(':')).toLowerCase();
                    let term = element.substring(element.indexOf(':') + 1);

                    if (type != '' && term != '') {
                        switch (type) {
                            case 'category':
                            case 'cat':
                                if (special_terms == '') special_terms = '( ';
                                special_terms += `category='${term}' AND\n`;
                                break;
                            case 'befored':
                            case 'beforedate':
                                if (special_terms == '') special_terms = '( ';
                                special_terms += `date < '${term}' AND\n`;
                                break;
                            case 'afterd':
                            case 'afterdate':
                                if (special_terms == '') special_terms = '( ';
                                special_terms += `date > '${term}' AND\n`;
                                break;
                            case 'ond':
                            case 'ondate':
                                if (special_terms == '') special_terms = '( ';
                                special_terms += `date = '${term}' AND\n`;
                                break;
                            case 'dotw':
                            case 'dayoftheweek':
                                if (special_terms == '') special_terms = '( ';
                                special_terms += `day = '${term}' AND\n`;
                                break;
                            case 'venue':
                            case 'ven':
                                if (special_terms == '') special_terms = '( ';
                                special_terms += `venue = '${term}' AND\n`
                                break;
                            case 'costbelow':
                            case 'costb':
                                if (special_terms == '') special_terms = '( ';
                                special_terms += `cost < '${term}' AND\n`
                                break;
                            case 'costabove':
                            case 'costa':
                                if (special_terms == '') special_terms = '( ';
                                special_terms += `cost > '${term}' AND\n`
                                break;
                        }
                        // handle bad regex?
                    }
                } else {
                    if (where_search == '' && count_search == '') {
                        where_search = '( ';
                        count_search = ', ( ';
                    }
                    where_search += `event_name LIKE '\%${element}\%' OR\n`;
                    count_search += `(event_name LIKE '\%${element}\%') + `
                }
            });
            // removes final OR\n
            if (where_search != '' && count_search != '') {
                where_search = where_search.substring(0, where_search.length - 3) + ')';
                count_search = count_search.substring(0, count_search.length - 2) + ') as count_words';
                if (special_terms != '') {
                    special_terms = "AND " + special_terms;
                }
            }
            if (special_terms != '')
                special_terms = special_terms.substring(0, special_terms.length - 4) + ')';

            let sql = 'SELECT *' + count_search + '\n' + 'FROM event ';
            if (where_search != '' || special_terms != '') {
                sql += 'WHERE\n' +
                    where_search + '\n' +
                    special_terms + '\n';
            }
            if (count_search == '') {
                sql += 'ORDER BY date DESC;';
            } else {
                sql += 'ORDER BY count_words DESC, date DESC;';
            }

            pool.query(sql, (err, result) => {
                if (err) {
                    console.log('search function errored\n');
                    console.log(sql);
                    reject(err);
                }
                else {
                    let events = [];
                    result.forEach(event => {
                        events.push({ id: event.event_id, name: event.event_name, desc: event.event_description, venue: event.venue, date: event.date, imgSrc: event.image_url });
                    });
                    resolve(events);
                }
            });
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
                var c_o_promise = query("SELECT u.user_name, e.event_name, e.venue, e.date, COUNT(*) as quantity" + '\n' +
                    "FROM ticket AS t" + '\n' +
                    "JOIN user AS u ON u.user_id = t.user_id" + '\n' +
                    "JOIN event AS e ON e.event_id = t.event_id" + '\n' +
                    "WHERE sold=1 AND e.date >= ?" + '\n' +
                    "GROUP BY u.user_name, e.event_name, e.venue, e.date;",
                    date);
                var h_o_promise = query("SELECT u.user_name, e.event_name, e.venue, e.date, COUNT(*) as quantity" + '\n' +
                    "FROM ticket AS t" + '\n' +
                    "JOIN user AS u ON u.user_id = t.user_id" + '\n' +
                    "JOIN event AS e ON e.event_id = t.event_id" + '\n' +
                    "WHERE sold=1 AND e.date < ?" + '\n' +
                    "GROUP BY u.user_name, e.event_name, e.venue, e.date;",
                    date);
                var u_promise = query("SELECT * FROM user", []);
                Promise.all([c_o_promise, h_o_promise, u_promise])
                    .then((values) => {
                        resolve([events, values[0], values[1], values[2]]);
                    });
            });


    });
}

var gce_current_date = ""
var current_events = []
function getCurrentEvents() {
    return new Promise((resolve, reject) => {
        const dt = new Date();
        const padL = (nr, len = 2, chr = `0`) => `${nr}`.padStart(2, chr);

        // YYYY-MM-DD format
        const date = `${padL(dt.getFullYear())}-${padL(dt.getMonth() + 1)}-${dt.getDate()}`

        if (gce_current_date == date) {
            resolve(current_events);
        }
        else {
            gce_current_date = date;
            const sql = "SELECT * FROM event WHERE date >= ? LIMIT 5;"
            pool.query(sql, date, (err, result) => {
                if (err) {
                    console.log('errored in getCurrentEvents');
                    reject(err);
                }
                else {
                    current_events = []
                    result.forEach(event => {
                        current_events.push({ id: event.event_id, name: event.event_name, desc: event.event_description, venue: event.venue, date: event.date, imgSrc: event.image_url });
                    });
                    resolve(current_events);
                }
            });
        }
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

// #region require
const express = require('express');
const mysql = require('mysql');
const cookieParser = require('cookie-parser');
// #endregion

// #region init
const app = express();
const port = 3000;

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
});
// #endregion

// #region basic pages
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

    getCurrentEvents()
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
                    .then((events) => {
                        event_list = events;
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

// #region user account pages
app.get('/my/account', authenticate, (req, res) => {
    var sql = "SELECT * FROM user WHERE user_id = ?;"
    sqlParams = [req.cookies.token];
    pool.query(sql, sqlParams, function (err, result) {
        if (err) throw err;

        var loggedIn = '';
        if (result[0].type == 1) loggedIn = 'user';
        if (result[0].type == 0) loggedIn = 'admin';

        if (result.length != 0) {
            res.render('pages/account', {
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
// TODO: pending page
app.get('/my/cart', authenticate, (req, res) => {
    checkTimestamps("user_id = " + req.cookies.token)
        .catch((err) => {

        })
        .finally(() => {
            var tickets;
            getTicketList()
                .catch((err) => {

                })
                .then((ticket_list) => {
                    tickets = ticket_list;
                })
                .finally(() => {
                    var info;
                    ticketListToInfoList(tickets)
                        .catch((err) => {

                        })
                        .then((info_list) => {
                            info = info_list;
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
                                    res.render('pages/cart', {
                                        cart: info,
                                        status: loggedIn
                                    });
                                });
                        });
                });
        });
});

// TODO: pending page
app.get('/my/checkout', authenticate, (req, res) => {
    checkTimestamps("user_id = " + req.cookies.token)
        .catch((err) => {
            console.log(err.message);
        })
        .finally(() => {
            var tickets;
            getTicketList()
                .catch((err) => {
                    console.log(err.message);
                })
                .then((ticket_list) => {
                    tickets = ticket_list;
                })
                .finally(() => {
                    var info;
                    ticketListToInfoList(tickets)
                        .catch((err) => {
                            console.log(err.message);
                        })
                        .then((info_list) => {
                            info = info_list;
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
                                    res.render('pages/checkout', {
                                        cart: info,
                                        status: loggedIn
                                    });
                                });
                        });
                });
        });
});

// TODO: pending page
app.get('/my/tickets', authenticate, (req, res) => {
    checkTimestamps("user_id = " + req.cookies.token)
        .catch((err) => {
            console.log(err.message);
        })
        .finally(() => {
            var tickets;
            getTicketList()
                .catch((err) => {
                    console.log(err.message);
                })
                .then((ticket_list) => {
                    tickets = ticket_list;
                })
                .finally(() => {
                    var info;
                    ticketListToInfoList(tickets)
                        .catch((err) => {
                            console.log(err.message);
                        })
                        .then((info_list) => {
                            info = info_list;
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
                                    res.render('pages/my-tickets', {
                                        cart: info,
                                        status: loggedIn
                                    });
                                });
                        });
                });
        });
});
// #endregion

// #region user account api
app.post('/api/my/create', (req, res) => {
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
    pool.query(sql, sqlParams, function (err_1, result_1) {
        if (err_1) throw err_1;
        else if (result_1.length != 0) {
            res.status(400).send("Username already in user");
        }
        else {
            var max_id = null;
            var sql = "SELECT MAX(user_id) AS max_id FROM user";
            sqlParams = [];
            pool.query(sql, sqlParams, function (err_2, result_2) {
                if (err_2) throw err_2;

                max_id = result_2[0].max_id + 1;

                // inserts new user into user table
                sql = "INSERT INTO user (user_id, user_name, first_name, last_name, email, type) values (?, ?, ?, ?, ?, 1)";
                sqlParams = [max_id, req.body.username, req.body.first_name, req.body.last_name, req.body.email];
                pool.query(sql, sqlParams, function (err_3, result_3) {
                    if (err_3) throw err_3;

                    sql = "INSERT INTO password (password_id, user_name, password) values (?, ?, ?)";
                    sqlParams = [max_id, req.body.username, req.body.password];
                    pool.query(sql, sqlParams, function (err_4, result_4) {
                        if (err_4) throw err_4;

                        res.status(200).send("Account successfully created!");
                    });
                });
            });
        }
    });

});

// TODO change to async & promises to have more readable code
app.get('/api/my/login', (req, res) => {
    var user;
    // make sure request contains all elements of a user account
    if (req.body.username != null && req.body.password != null) {
        user = req.body;
    }
    else {
        var query = JSON.parse(Object.keys(req.query)[0]);

        if (query.username != null && query.password != null) {
            user = query;
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
    console.log(JSON.stringify(req.body));
    const padL = (nr, len = 2, chr = `0`) => `${nr}`.padStart(2, chr);

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
        var json_query = JSON.parse(Object.keys(req.query)[0]);

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
    var holdSQL = `UPDATE ticket SET user_id = ${user_id}, hold = 1, hold_time = '${holdTime(10)}' WHERE (`;

    var getTicketIds = `SELECT ticket_id FROM ticket WHERE (`;

    var updateHoldsSQL = `UPDATE ticket SET hold_time = '${holdTime(10)}' WHERE user_id = ${user_id} AND hold = 1;`

    // convert tickets from string to array
    var idx = 0;
    var tickets = [];
    console.log(tickets_str.split(","));
    tickets_str.split(",").forEach((token) => {
        if (idx % 2 != 0) {
            tickets.push(token);
        }
        idx++;
    })

    console.log(tickets);

    tickets.forEach((ticket) => {
        let tokens = ticket.split('_');
        let section_name = tokens[0];
        let seat_number = tokens[1];

        cartSQL += `(${user_id}, ?, '${holdTime(10)}'), `
        holdSQL += `ticket_id = ? OR `
        getTicketIds += `(section_name = '${section_name}' AND seat = ${seat_number} AND event_id = ${event_id} AND sold = 0 AND hold = 0) OR `
    })

    if (cartSQL == '' || holdSQL == '') {
        res.status(403).send('error in sql generation');
        return;
    }

    cartSQL = cartSQL.substring(0, cartSQL.length - 2) + ';'
    holdSQL = holdSQL.substring(0, holdSQL.length - 4) + ');'
    getTicketIds = getTicketIds.substring(0, getTicketIds.length - 4) + ');'

    query(getTicketIds, [])
        .catch((err) => {
            console.log('errored in /api/my/addToCart');
            console.log(err.message);
            res.send('failed :(');
        })
        .then((results) => {
            console.log(JSON.stringify(results));
            if (results.length == 0) {
                res.send('no tickets added');
                return;
            }
            var tickets = [];

            results.forEach((ticket) => {
                tickets.push(ticket.ticket_id)
            });

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

app.get('/api/my/getCart', authenticate, (req, res) => {
    let sql = `SELECT * FROM cart WHERE `
})
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
    checkTimestamps(`event_id = ${req.params.event_id}`)
        .catch((err) => {
            console.log('errored in /api/getTickets/:event_id/:section_name');
            console.log(err.message);
        })
        .then((result) => {
            query('SELECT * FROM ticket WHERE event_id = ? AND section_name = ? AND (hold = 1 OR sold = 1)', [req.params.event_id, req.params.section_name])
                .catch((err) => {
                    console.log(err.message);
                    res.send('error');
                })
                .then((result) => {
                    res.send(JSON.stringify(result));
                })
        })

});

// #endregion

// #region admin
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
            var current_orders_l = [];
            var historical_orders_l = [];
            var users_l = [];
            adminDashboard()
                .catch((err) => {
                    console.log(err);
                })
                .then((values) => {
                    if (values[0] != null)
                        events_l = values[0];
                    if (values[1] != null)
                        current_orders_l = values[1];
                    if (values[2] != null)
                        historical_orders_l = values[2];
                    if (values[3] != null)
                        users_l = values[3];
                })
                .finally(() => {
                    res.render('pages/admin-page', {
                        status: loggedIn,
                        events: events_l,
                        current_orders: current_orders_l,
                        historical_orders: historical_orders_l,
                        users: users_l
                    });
                });
        });
});

app.get('/admin/editEvent/:event_id', authenticate, (req, res) => {
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            getEvent(req.query.event_id)
                .catch((err) => {
                    // oh well
                })
                .then((result) => {
                    res.render('pages/edit-event', {
                        status: loggedIn,
                        event: result
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
            res.render('pages/create-event', {
                status: loggedIn
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
            query('SELECT * FROM user WHERE user_id=?', req.query.user_id)
                .catch((err) => {
                    // oh well
                })
                .then((result) => {
                    res.render('pages/edit-user', {
                        status: loggedIn,
                        user: result
                    });
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

app.post('/api/admin/createTickets', (req, res) => {
    let event_id = -1;

    if (req.body.event_id != null)
        event_id = req.body.event_id;
    else {
        var query_search = JSON.parse(Object.keys(req.query)[0]);
        if (query_search.event_id != null)
            event_id = query_search.event_id;
        else {
            // probably should error out
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
                    console.log(current_ticket_id);
                    console.log(JSON.stringify(results));
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

app.post('/api/admin/upload', authenticate, (req, res) => {
    fs.writeFile(`venues/${req.body.name}.html`, req.body.html, (err) => {
        if (err) return console.log(err);
    });
});
//#endregion

// #region testing
app.get('/tmp/event-tickets', (req, res) => {
    var loggedIn = '';
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            res.render('pages/event-tickets', {
                status: loggedIn
            });
        });
});

app.get('/tmp/concert-configuration', (req, res) => {
    var loggedIn = '';
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            res.render('pages/concert-configuration', {
                status: loggedIn
            });
        });
});
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

// #region listen on port
app.listen(port, () => {
    console.log('WBTT server listening at 3.141.202.74:3000');
});
// #endregion
