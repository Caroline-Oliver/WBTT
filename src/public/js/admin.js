// JavaScript Document

function createUser() {
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

	// response = requests.post('http://18.219.2.17:3000/api/my/create', headers = headers, json = json_data)
	// console.log(response)

	// const settings = {
	// 	"async": true,
	// 	"crossDomain": true,
	// 	"url": "18.219.2.17:3000/api/my/create",
	// 	"method": "POST",
	// 	"headers": {
	// 	  "Content-Type": "application/json"
	// 	},
	// 	"processData": false,
	// 	"data": `{\n    \"username\" : \"${document.getElementById('username').value}\",\n    \"password\" : \"${document.getElementById('password').value}\",\n    \"email\" : \"${document.getElementById('email').value}\",\n    \"first_name\" : \"${document.getElementById('first_name').value}\",\n    \"last_name\" : \"${document.getElementById('last_name').value}\"\n}\n`
	//   };
	  
	//   $.ajax(settings).done(function (response) {
	// 	console.log(response);
	//   });
	console.log('sending request...');

	const settings = {
		"async": true,
		"crossDomain": true,
		"url": "http://18.219.2.17:3000/api/my/create",
		"method": "POST",
		"headers": {
		  "Content-Type": "application/json"
		},
		"processData": false,
		"data": "{\n    \"username\" : \"billyBob12333\",\n    \"password\" : \"secretPass123\",\n    \"email\" : \"billybob\",\n    \"first_name\" : \"Billy\",\n    \"last_name\" : \"Bob\"\n}\n"
	  };

	  console.log(settings);
	  
	  $.ajax(settings).done(function (response) {
		console.log(response);
	  });
}