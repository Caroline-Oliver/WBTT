// JavaScript Document

var tabOrders = document.getElementById('orders');
var tabUsers = document.getElementById('users');
var tabTickets = document.getElementById('tickets');
var tabVenues = document.getElementById('venues');
var tabEvents = document.getElementById('events');

tabOrders.addEventListener('click', function () { setView('orders-body') }, true);
tabUsers.addEventListener('click', function () { setView('users-body') }, false);
tabTickets.addEventListener('click', function () { setView('tickets-body') }, false);
tabVenues.addEventListener('click', function () { setView('venues-body') }, false);
tabEvents.addEventListener('click', function () { setView('events-body') }, false);

function createUser() {
	callRegister()
		.catch((err) => {
			console.log('errored');
			console.log(err);
			console.log(err.message);
			document.getElementById('error_box').innerHTML = 'Failed to create account';
		})
		.then((result) => {
			console.log(result);
			if (result != "Account successfully created!") {
				document.getElementById('error-box').innerHTML = result;
				document.getElementById('success-box').innerHTML = '';
			}
			else {
				document.getElementById('error-box').innerHTML = '';
				document.getElementById('success-box').innerHTML = result;
			}
		})
}

function callRegister() {
	return new Promise((resolve, reject) => {
		$.ajax({
			url: '/api/my/create',
			dataType: 'text',
			type: 'get',
			contentType: 'application/jsonp',
			data: JSON.stringify({
				"username": `${document.getElementById('username').value}`,
				"password": `${document.getElementById('password').value}`,
				"email": `${document.getElementById('email').value}`,
				"first_name": `${document.getElementById('first_name').value}`,
				"last_name": `${document.getElementById('last_name').value}`
			}),
			success: function (data) {
				resolve(data);
			},
			error: function (data) {
				// consider doing more sophisticated error messages
				reject(data);
			}
		});
	})
}

function changeUser() {
	callEditUser()
		.catch((err) => {
			console.log('errored');
			console.log(err);
			console.log(err.message);
			document.getElementById('error_box').innerHTML = 'Failed to edit account';
		})
		.then((result) => {
			if (result != "Account edited successfully!") {
				document.getElementById('error-box').innerHTML = result;
				document.getElementById('success-box').innerHTML = '';
			}
			else {
				document.getElementById('error-box').innerHTML = '';
				document.getElementById('success-box').innerHTML = result;
			}
		})
}

function callEditUser() {
	return new Promise((resolve, reject) => {
		$.ajax({
			url: '/api/admin/editUser',
			dataType: 'text',
			type: 'get',
			contentType: 'application/jsonp',
			data: JSON.stringify({
				"user_id": `${document.getElementById('user_id').value}`,
				"username": `${document.getElementById('username').value}`,
				"password": `${document.getElementById('password').value}`,
				"email": `${document.getElementById('email').value}`,
				"first_name": `${document.getElementById('first_name').value}`,
				"last_name": `${document.getElementById('last_name').value}`,
				"type": `${document.getElementById('type').value}`
			}),
			success: function (data) {
				resolve(data);
			},
			error: function (data) {
				reject(data);
			}
		});
	});
}

function changeEvent() {
	callChangeEvent()
		.catch((err) => {
			console.log('errored');
			console.log(err);
			console.log(err.message);
			document.getElementById('error_box').innerHTML = 'Failed to edit event';
		})
		.then((result) => {
			if (result != "Successfully edited event.") {
				document.getElementById('error-box').innerHTML = result;
				document.getElementById('success-box').innerHTML = '';
			}
			else {
				document.getElementById('error-box').innerHTML = '';
				document.getElementById('success-box').innerHTML = result;
			}
		})
}

function callChangeEvent() {
	console.log(JSON.stringify({
		"event_id": `${document.getElementById('event_id').value}`,
		"event_name": `${document.getElementById('event_name').value}`,
		"event_description": `${document.getElementById('event_description').value}`,
		"image_url": `${document.getElementById('image_url').value}`,
		"category": `${document.getElementById('category').value}`,
		"date": `${document.getElementById('date').value}`,
		"time": `${document.getElementById('time').value}`,
		"day": `${document.getElementById('day').value}`,
		"base_price": `${document.getElementById('base-price').value}`
	}));
	return new Promise((resolve, reject) => {
		$.ajax({
			url: '/api/admin/editEvent',
			dataType: 'text',
			type: 'get',
			contentType: 'application/jsonp',
			data: JSON.stringify({
				"event_id": `${document.getElementById('event_id').value}`,
				"event_name": `${document.getElementById('event_name').value}`,
				"event_description": `${document.getElementById('event_description').value}`,
				"image_url": `${document.getElementById('image_url').value}`,
				"category": `${document.getElementById('category').value}`,
				"date": `${document.getElementById('date').value}`,
				"time": `${document.getElementById('time').value}`,
				"day": `${document.getElementById('day').value}`,
				"base_price": `${document.getElementById('base-price').value}`
			}),
			success: function (data) {
				resolve(data);
			},
			error: function (data) {
				reject(data);
			}
		});
	});
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
