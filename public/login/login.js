// Get JWT from AWS Cognito based on username and password

// Constants
var POOL_DATA = {
    UserPoolId : 'ap-southeast-2_WPmNy3RZj', // Your user pool id here
    ClientId : '73gosti29t46shjpimsftau160' // Your client id here
};

var setJWTCookie = function(jwt){
    Cookies.set('jwt', jwt);
    $.ajax({
        url: '/',
        type: 'GET',
        beforeSend: function(xhr){
            xhr.setRequestHeader('Authorization', 'Bearer ' + jwt);
        },
        error: function(err){
            alert(err);
        },
        success: function(){
            var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(POOL_DATA);
            var cognitoUser = userPool.getCurrentUser();
            localStorage.setItem('username', JSON.stringify(cognitoUser.username).replace(/"/g, ''));
            window.location.replace('/');
        }
    });
};

var authSuccess = function(result){
    var token = result.getAccessToken().getJwtToken();
    setJWTCookie(token);
};

var cognitoAuth = function(){
    var authenticationData = {
        Username : $('#inputEmail').val(),
        Password : $('#inputPassword').val(),
    };
    var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);

    var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(POOL_DATA);
    var userData = {
        Username : $('#inputEmail').val(),
        Pool : userPool
    };
    var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: authSuccess,
        newPasswordRequired: function(userAttributes, requiredAttributes) { // eslint-disable-line no-unused-vars
            $('#form-signin').hide();
            $('#form-password-reset').toggle();
            // the api doesn't accept this field back
            delete userAttributes.email_verified;
            $('#btn-confirm-reset-password').on('click', function(){
                cognitoUser.completeNewPasswordChallenge($('#input-new-password').val(), userAttributes, {
                    onSuccess: function(result){  // eslint-disable-line no-unused-vars
                        alert('Please login with new password');
                        window.location.replace('/login');
                    },
                    onFailure: function(error){
                        alert(error.message);
                    }
                });
            });
        },

        onFailure: function(err) {
            alert(err);
            $('#login').html('LOGIN').attr('disabled',false);
        },
    });
};

$('#login').click(function(){
    $('#login').html('Authenticating....').attr('disabled',true);
    setTimeout(cognitoAuth,2);//force UI update before authenticating
});

$('#inputPassword').keyup(function(event){
    if(event.keyCode == 13){
        $('#login').click();
    }
});

$(function() {
    if (location.hash === '#about') {
        $('#about').modal('show');
    }
});
