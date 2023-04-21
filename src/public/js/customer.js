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
			url: '/api/my/editAccount',
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
				reject(data);
			}
		});
	});
}