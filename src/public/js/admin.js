// JavaScript Document

var tab1=document.getElementById('orders');
var tab2=document.getElementById('users');

tab1.addEventListener('click',function() {setView('orders-body')},false);
tab2.addEventListener('click',function() {setView('users-body')},false);

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

	const settings = {
		"async": true,
		"crossDomain": true,
		"url": "http://18.219.2.17:3000/api/my/create",
		"method": "POST",
		"headers": {
			"Content-Type": "application/json"
		},
		"processData": false,
		"data": `{\n    \"username\" : \"${document.getElementById('username').value}\",\n    \"password\" : \"${document.getElementById('password').value}\",\n    \"email\" : \"${document.getElementById('email').value}\",\n    \"first_name\" : \"${document.getElementById('first_name').value}\",\n    \"last_name\" : \"${document.getElementById('last_name').value}\"\n}\n`
	};

	$.ajax(settings).done(function (response) {
		console.log(response);

	});
	setMessage("This one worked")

}

function setMessage(message) {
	var printThing = document.getElementById('results');
	printThing.innerHTML = '<P>' + message + '</P>'//response;
}

function setView(id) {
	var items = document.getElementsByClassName('admin-menu');
	for (var i = 0; i < items.length; i++) {
		items[i].hidden = true;
	}
	document.getElementById(id).hidden = false;
}
