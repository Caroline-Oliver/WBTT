// JavaScript Document
var tabOrders = document.getElementById('orders');
var tabUsers = document.getElementById('users');
//var tabTickets = document.getElementById('tickets');
var tabDiscounts = document.getElementById('discount-codes');
var tabEvents = document.getElementById('events');

tabOrders.addEventListener('click', function () { setView('orders-body') }, true);
tabUsers.addEventListener('click', function () { setView('users-body') }, false);
//tabTickets.addEventListener('click', function () { setView('tickets-body') }, false);
tabDiscounts.addEventListener('click', function () { setView('discounts-body') }, false);
tabEvents.addEventListener('click', function () { setView('events-body') }, false);

$(document).ready(function () {
	$('#orders-table').DataTable({
		searching: false
	});
	$('#users-table').DataTable();
	$('#discounts-table').DataTable({
		searching: false
	});
	$('#events-table').DataTable();
});

function createUser() {
	document.getElementById('error-box').innerHTML = '';
	document.getElementById('success-box').innerHTML = '';
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
	document.getElementById('error-box').innerHTML = '';
	document.getElementById('success-box').innerHTML = '';
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

function createEvent_ad() {
	document.getElementById('error-box').innerHTML = '';
	document.getElementById('success-box').innerHTML = '';
	callCreateEvent()
		.catch((err) => {
			console.log('errored');
			console.log(err);
			console.log(err.message);
			document.getElementById('error-box').innerHTML = 'Failed to create event';
		})
		.then((result) => {
			if (result != "Successfully created event.") {
				document.getElementById('error-box').innerHTML = result;
				document.getElementById('success-box').innerHTML = '';
			}
			else {
				document.getElementById('error-box').innerHTML = '';
				document.getElementById('success-box').innerHTML = result;
			}
		})
}

function callCreateEvent() {
	return new Promise((resolve, reject) => {
		$.ajax({
			url: '/api/admin/createEvent',
			dataType: 'text',
			type: 'get',
			contentType: 'application/jsonp',
			data: JSON.stringify({
				"event_name": `${document.getElementById('event_name').value}`,
				"event_description": `${document.getElementById('event_description').value}`,
				"image_url": `${document.getElementById('image_url').value}`,
				"configuration": `${document.getElementById('configuration').value}`,
				"category": `${document.getElementById('category').value}`,
				"date": `${document.getElementById('date').value}`,
				"time": `${document.getElementById('form_time').value}`,
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

function changeEvent() {
	document.getElementById('error-box').innerHTML = '';
	document.getElementById('success-box').innerHTML = '';
	var new_price = document.getElementById('base-price').value;
	var old_price = document.getElementById('base-price').placeholder;
	var discount_price = document.getElementById('discount-base-price').value;
	var old_discount_price = document.getElementById('discount-base-price').placeholder;
	var factor = new_price / old_price;
	var discount_factor;
	if (old_discount_price != null && old_discount_price != '' && (discount_price == null || discount_price == ''))
		discount_factor = 0;
	else if (discount_price != '' && discount_price != null)
		discount_factor = discount_price / old_price;
	var promises = [callChangeEvent()];
	if (factor != 0) {
		if (discount_factor == null)
			promises.push(callUpdateTickets(factor));
		else
			promises.push(callUpdateTickets(factor, discount_factor));
	}
	Promise.all(promises)
		.catch((err) => {
			console.log('errored');
			console.log(err);
			console.log(err.message);
			document.getElementById('error-box').innerHTML = 'Failed to edit event';
		})
		.then((result) => {
			if (result != "Successfully edited event.,success!") {
				document.getElementById('error-box').innerHTML = 'Success!';
				document.getElementById('success-box').innerHTML = '';
			}
			else {
				document.getElementById('error-box').innerHTML = '';
				document.getElementById('success-box').innerHTML = result;
			}
		})
}

function callChangeEvent() {
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
				"time": `${document.getElementById('form_time').value}`,
				"day": `${document.getElementById('day').value}`,
				"base_price": `${document.getElementById('base-price').value}`,
				"discount_base_price" : `${document.getElementById('discount-base-price').value}`
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

function callUpdateTickets(factor, discount_factor) {
	console.log(discount_factor);
	return new Promise((resolve, reject) => {
		$.ajax({
			url: '/api/admin/updateTickets',
			dataType: 'text',
			type: 'get',
			contentType: 'application/jsonp',
			data: JSON.stringify({
				"event_id": `${document.getElementById('event_id').value}`,
				"factor": `${factor}`,
				"discount_factor" : `${discount_factor}`
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

function changeDiscount() {
	document.getElementById('error-box').innerHTML = '';
	document.getElementById('success-box').innerHTML = '';
	callChangeDiscount()
		.catch((err) => {
			console.log('errored');
			console.log(err);
			console.log(err.message);
			document.getElementById('error-box').innerHTML = 'Failed to edit discount';
		})
		.then((result) => {
			if (result != "Successfully edited discount.") {
				document.getElementById('error-box').innerHTML = result;
				document.getElementById('success-box').innerHTML = '';
			}
			else {
				document.getElementById('error-box').innerHTML = '';
				document.getElementById('success-box').innerHTML = result;
			}
		})
}

function callChangeDiscount() {
	return new Promise((resolve, reject) => {
		$.ajax({
			url: '/api/admin/editDiscount',
			dataType: 'text',
			type: 'get',
			contentType: 'application/jsonp',
			data: JSON.stringify({
				"discount_id": `${document.getElementById('discount_id').value}`,
				"code": `${document.getElementById('code').value}`,
				"type": `${document.getElementById('type').value}`,
				"amount": `${document.getElementById('amount').value}`,
				"expiration": `${document.getElementById('expiration').value}`
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

function createDiscount_ad() {
	document.getElementById('error-box').innerHTML = '';
	document.getElementById('success-box').innerHTML = '';
	callCreateDiscount()
		.catch((err) => {
			console.log('errored');
			console.log(err);
			console.log(err.message);
			document.getElementById('error-box').innerHTML = 'Failed to create discount';
		})
		.then((result) => {
			if (result != "Successfully created discount.") {
				document.getElementById('error-box').innerHTML = result;
				document.getElementById('success-box').innerHTML = '';
			}
			else {
				document.getElementById('error-box').innerHTML = '';
				document.getElementById('success-box').innerHTML = result;
			}
		})
}

function callCreateDiscount() {
	return new Promise((resolve, reject) => {
		$.ajax({
			url: '/api/admin/createDiscount',
			dataType: 'text',
			type: 'get',
			contentType: 'application/jsonp',
			data: JSON.stringify({
				"code": `${document.getElementById('code').value}`,
				"type": `${document.getElementById('type').value}`,
				"amount": `${document.getElementById('amount').value}`,
				"expiration": `${document.getElementById('expiration').value}`
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
