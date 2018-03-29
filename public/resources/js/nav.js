// nav menu

var USERNAME = localStorage.getItem('username');

$('#username').append(USERNAME);

$('#logout').click(function() {
    Cookies.remove('jwt', {path: '/'} );
    localStorage.removeItem('username');
});
