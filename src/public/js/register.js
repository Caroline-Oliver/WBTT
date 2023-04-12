function register() {
	var sentinel = -1
	window.localStorage.setItem('minutes', sentinel);
	window.localStorage.setItem('seconds', sentinel);
	
	$.ajax({
		url: '/api/my/create',
		dataType: 'json',
		type: 'post',
		contentType: 'application/jsonp',
		data: JSON.stringify({
			"username": `${document.getElementById('username').value}`,
			"password": `${document.getElementById('password').value}`,
			"email": `${document.getElementById('email').value}`,
			"first_name": `${document.getElementById('first_name').value}`,
			"last_name": `${document.getElementById('last_name').value}`
		}),
		processData: false,
		success: function (data) {
			//location.reload();
            console.log(data);
            console.log(JSON.stringify(data));
		},
        error: function(data) {
            // consider doing more sophisticated error messages
            document.getElementById('last_name').innerHTML = 'Failed to create account';
        }
	});
}