function applyDiscount() {
    let promocode = document.getElementById('promocode').value;
    if (promocode != null && promocode != '') {
        callServer(promocode)
            .catch((err) => {
                document.getElementById('error-box').innerHTML = 'Some error occured. Please try again.';
                document.getElementById('success-box').innerHTML = '';
            })
            .then((result) => {
                if (result == 'Code successfully set.') {
                    // refresh page
                }
                else {
                    document.getElementById('error-box').innerHTML = result;
                    document.getElementById('success-box').innerHTML = '';
                }
            })
    }
    else {
        document.getElementById('error-box').innerHTML = 'Please enter a code';
        document.getElementById('success-box').innerHTML = '';
    }
}

function callServer(promocode) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/api/my/setDiscountCode',
            dataType: 'text',
            type: 'get',
            contentType: 'application/jsonp',
            data: JSON.stringify({
                "promocode": `${promocode}`
            }),
            success: function (data) {
                resolve(data);
            },
            error: function (data) {
                reject(data);
            }
        });
    })
}