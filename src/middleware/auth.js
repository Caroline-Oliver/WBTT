// const jwt = require('jsonwebtoken');
/*
{
	token: "tokenjadkfljds"
}
*/

function authenticate(req, res, next) {
	if (req.body.token == null) 
		res.sendStatus(400).send("Token not present");
	
	/*jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
		if (err) {   
			res.status(403).send("Token invalid");
		} else {  
			req.user = user;
			next(); //proceed to the next action in the calling function
		}
	});*/

	// query the database for the token

}
