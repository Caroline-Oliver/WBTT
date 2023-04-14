function register() {
    console.log('attempting to register');
	var sentinel = -1
	window.localStorage.setItem('minutes', sentinel);
	window.localStorage.setItem('seconds', sentinel);
	
    console.log(JSON.stringify({
        "username": `${document.getElementById('username').value}`,
        "password": `${document.getElementById('password').value}`,
        "email": `${document.getElementById('email').value}`,
        "first_name": `${document.getElementById('first_name').value}`,
        "last_name": `${document.getElementById('last_name').value}`
    }));

	callRegister()
        .catch( (err) => {
            console.log('errored');
            console.log(err);
            console.log(err.message);
            document.getElementById('last_name').innerHTML = 'Failed to create account';
        })
        .then( (result) => {
            console.log('success');
            console.log(result);
            console.log(JSON.stringify(result));
        })
}

function callRegister() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/api/my/create',
            dataType: 'json',
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
            error: function(data) {
                // consider doing more sophisticated error messages
                reject(data);
            }
        });
    })
}