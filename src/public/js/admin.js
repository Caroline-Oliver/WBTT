// JavaScript Document

var tabOrders=document.getElementById('orders');
var tabUsers=document.getElementById('users');
var tabTickets=document.getElementById('tickets');
var tabVenues=document.getElementById('venues');
var tabEvents=document.getElementById('events');

tabOrders.addEventListener('click',function() {setView('orders-body')},true);
tabUsers.addEventListener('click',function() {setView('users-body')},false);
tabTickets.addEventListener('click',function() {setView('tickets-body')},false);
tabVenues.addEventListener('click',function() {setView('venues-body')},false);
tabEvents.addEventListener('click',function() {setView('events-body')},false);

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
