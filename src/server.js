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
                    res.redirect(403, "/");
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

    var sql = "UPDATE ticket\nSET hold = 0, hold_time = null, user_id = null\n";
    sql += "WHERE (" + search_terms + ") AND hold_time < \'" + datetime + "\';";

    return new Promise((resolve, reject) => {
        pool.query(sql, function (err, result) {
            if (err) {
                console.log('errored in checkTimestamps');
                console.log(err);
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
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
            let special_only = true;
            let normal_only = true;
            search_terms.forEach(element => {
                if (element.includes(':')) {
                    let type = element.substring(0, element.indexOf(':')).toLowerCase();
                    let term = element.substring(element.indexOf(':') + 1);
                    
                    if (type != '' && term != '') {
                        switch (type) {
                            case 'category':
                            case 'cat':
                                if (special_terms == '') special_terms = '( '; normal_only = false;
                                special_terms += `category='${term}' AND\n`;
                                break;
                            case 'befored':
                            case 'beforedate':
                                if (special_terms == '') special_terms = '( '; normal_only = false;
                                special_terms += `date < '${term}' AND\n`;
                                break;
                            case 'afterd':
                            case 'afterdate':
                                if (special_terms == '') special_terms = '( '; normal_only = false;
                                special_terms += `date > '${term}' AND\n`;
                                break;
                            case 'ond':
                            case 'ondate':
                                if (special_terms == '') special_terms = '( '; normal_only = false;
                                special_terms += `date = '${term}' AND\n`;
                                break;
                            case 'dotw':
                            case 'dayoftheweek':
                                if (special_terms == '') special_terms = '( '; normal_only = false;
                                special_terms += `day = '${term}' AND\n`;
                                break;
                            case 'venue':
                            case 'ven':
                                if (special_terms == '') special_terms = '( '; normal_only = false;
                                special_terms += `venue = '${term}' AND\n`
                                break;
                        }
                    }
                } else {
                    if (where_search == '' && count_search == '') {
                        where_search = '( ';
                        count_search = ', ( ';
                    }
                    where_search += `event_name LIKE '\%${element}\%' OR\n`;
                    count_search += `(event_name LIKE '\%${element}\%') + `
                    special_only = false;
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

            special_terms = special_terms.substring(0, special_terms.length - 4) + ')';

            if (normal_only) {
                special_terms = '';
            }

            let sql = 'SELECT *' + count_search + '\n' +
                'FROM event WHERE\n' +
                where_search + '\n' +
                special_terms + '\n';
            
            if (special_only){
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
        .catch( (err) => {
            reject(err);
        })
        .then( (result) => {
            events = result;
        })
        .finally( () => {
            var cur_event_ids = [];
            events.forEach( event => {
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
            .then( (values) => {
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

// good ejs
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

// good ejs
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

// good ejs
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

// #region event information
// TODO: pending page
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
                        events: event_list
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
                    res.render('pages/event', {
                        status: loggedIn,
                        event: this_event
                    });
                });
        });
});

// TODO: pending pages
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
// TODO: pending page
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

app.get('/login', (req, res) => {
    var loggedIn = '';
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            res.render('pages/login', {
                status: loggedIn
            });
        });
});

app.get('/logout', (req, res) => {
    var loggedIn = '';
    accountStatus(req.cookies.token)
        .catch((err) => {
            loggedIn = 'na';
        })
        .then((status) => {
            loggedIn = status;
        })
        .finally(() => {
            res.render('pages/logout', {
                status: loggedIn
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
            .catch( (err) => {
                console.log(err);
            })
            .then( (values) => {
                if (values[0] != null)
                    events_l = values[0];
                if (values[1] != null)
                    current_orders_l = values[1];
                if (values[2] != null)
                    historical_orders_l = values[2];
                if (values[3] != null)
                    users_l = values[3];
            })
            .finally( () => {
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

// res.body.
app.post('/api/admin/createTickets', (req, res) => {
    query("SELECT MAX(ticket_id) as max_ticket_id FROM ticket", [])
    .catch( (err) => {
        res.send('error, ticket id not found')
    })
    .then( (result) => {
        var currentIndex = result[0].max_ticket_id + 1;
        var event_id, price;
        if (req.body.event_id != null && req.body.price != null) {
            event_id = req.body.event_id;
            price = req.body.price;
        }
        else {
            var query = JSON.parse(Object.keys(req.query)[0]);
            if (req.query.event_id != null && req.query.price != null) {
                event_id = query.event_id;
                price = query.price;
            }
            else {
                res.send('missing parts');
                return;
            }
        }
        
        var sql = "INSERT INTO ticket (ticket_id, event_id, section_name, seat, hold, sold, price) VALUES ";
        var format = (index, section_name, seat) => {
            return `('${index}', '${event_id}', '${section_name}', '${seat}', '0', '0', '${price}'),\n`
        }
        // 4 rows x 10 seats
        var short_rectangles = ["bottom-center-center-lower", "bottom-center-center-lower", "bottom-center-left-lower", "bottom-center-left-lower", "bottom-center-right-lower","bottom-center-right-upper", "top-center-center-lower", "top-center-center-lower", "top-center-left-lower", "top-center-left-upper", "top-center-right-lower", "top-center-right-upper"];
        // 4 rows x 12 seats
        var long_rectangles = ["center-far-left-lower", "center-far-left-upper", "center-far-right-lower", "center-far-right-upper"];
        // row 1: 2 seats, row 2: 4 seats, row 3: 6 seats, row 4: 8 seats, row 5: 10 seats
        var small_triangle = ["bottom-far-left-lower", "bottom-far-right-lower", "top-far-left-lower", "top-far-right-lower"];
        // row 1: 7 seats, row 2: 8 seats, row 3: 9 seats, row 4: 10 seats
        var large_triangle = ["bottom-far-left-upper", "bottom-far-right-upper", "top-far-left-upper", "top-far-right-upper"];

        short_rectangles.forEach(section_name => {
            for (var row = 1; row <= 4; row++) {
                for (var seat = 1; seat <= 10; seat++) {
                    sql += format(currentIndex++, section_name, `row-${row}-seat-${seat}`);
                }
            }
        });

        long_rectangles.forEach(section_name => {
            for (var row = 1; row <= 4; row++) {
                for (var seat = 1; seat <= 12; seat++) {
                    sql += format(currentIndex++, section_name, `row-${row}-seat-${seat}`);
                }
            }
        });

        small_triangle.forEach(section_name => {
            for (var row = 1; row <= 5; row++) {
                for (var seat = 1; seat <= row*2; seat++) {
                    sql += format(currentIndex++, section_name, `row-${row}-seat-${seat}`);
                }
            }
        });

        large_triangle.forEach(section_name => {
            for (var row = 1; row <= 5; row++) {
                for (var seat = 1; seat <= 6+row; seat++) {
                    sql += format(currentIndex++, section_name, `row-${row}-seat-${seat}`);
                }
            }
        });
        sql = sql.substring(0,sql.length-2)+';'

        query(sql, [])
        .catch( (err) => {
            console.log(err.message);
            res.send('failed');
            return;
        })
        .then( (result) => {
            res.send('success!')
            return;
        });
    });
})

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

// #region listen on port
app.listen(port, () => {
    console.log('WBTT server listening at 3.141.202.74:3000');
});
// #endregion
