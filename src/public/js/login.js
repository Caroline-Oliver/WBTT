// JavaScript Document

function login() {
	// headers = {
	// 	'Content-Type': 'application/json',
	// }

	// json_data = {
	// 	'username': document.getElementById('username').value,
	// 	'password': document.getElementById('password').value,
	// 	'email': document.getElementById('email').value,
	// 	'first_name': document.getElementById('first_name').value,
	// 	'last_name': document.getElementById('last_name').value,
	// }

	// const settings = {
	// 	"async": true,
	// 	"crossDomain": true,
	// 	"url": "http://18.219.2.17:3000/api/my/login",
	// 	"method": "GET",
	// 	"headers": {
	// 		"Content-Type": "application/json"
	// 	},
	// 	"processData": false,
	// 	"data": `{\n    \"username\" : \"${document.getElementById('username').value}\",\n    \"password\" : \"${document.getElementById('password').value}\"\n}\n`
	// };

	// $.ajax(settings).done(function (response) {
	// 	console.log(response);

	// });
	// setMessage("This one worked")
	// $.ajax({
	// 	dataType: "json",
	// 	url: "http://18.219.2.17:3000/api/my/login",
	// 	data: {
	// 		username: `${document.getElementById('username').value}`,
	// 		password: `${document.getElementById('password').value}`
	// 	},
	// 	success: (response, status, xhr) => {
	// 		console.log(response);
	// 	}
	// })
	// var settings = {
	// 	"url": "http://18.219.2.17:3000/api/my/login",
	// 	"crossDomain": true,
	// 	"method": "GET",
	// 	"timeout": 0,
	// 	"headers": {
	// 		"Content-Type": "application/json"
	// 	},
	// 	"body": JSON.stringify({
	// 		"username": `${document.getElementById('username').value}`,
	// 		"password": `${document.getElementById('password').value}`
	// 	}),
	// };

	// $.ajax(settings).done(function (response) {
	// 	console.log(response);
	// });

	$.ajax({
		url: '/api/my/login',
		dataType: 'json',
		type: 'get',
		contentType: 'application/json',
		accessControlAllowOrigin : "*",
		data: JSON.stringify({
			"username": `${document.getElementById('username').value}`,
			"password": `${document.getElementById('password').value}`
		}),
		processData: false,
		success: function(data, textStatus, jQxhr) {
			console.log(data, textStatus, jQxhr);
		}
	});
}

function setMessage(message) {
	var printThing = document.getElementById('results');
	printThing.innerHTML = '<P>' + message + '</P>'//response;
}