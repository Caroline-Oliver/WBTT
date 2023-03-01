const jwt = require('jsonwebtoken');

let refreshTokens = []

function generateAccessToken(user) {
	return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15m"});
}

function generateRefreshToken(user) {
	const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: "20m"});
	refreshTokens.push(refreshToken)
	return refreshToken;
}

module.exports = {
	refreshTokens,
	generateAccessToken,
	generateRefreshToken
}