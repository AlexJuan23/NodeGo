var check = 0; 
$(document).ready(function() {
    $("#btnLogin").on('click', LOGIN.login);
    LOGIN.pullData();
    LOGIN.currentUser();  
});
    
LOGIN = {
    userListData : [],
    currentId : 0,
    currentUser : function() {
        $.getJSON('/users/getcurrentuser', function(data) {
            LOGIN.currentId =data[0]._id;
            if(data.length === 0) {
                $.ajax({
                    type: 'POST',
                    data: {currentuser: 'default'},
                    url: '/users/addcurrentuser',
                    dataType : 'JSON'
                }).done(function(response) {
                    if(response.msg === '') {
                    }
                    else {
                        alert("Error: " + response.msg);
                    }
                });
                }
            });
        },          
    pullData : function() {
          $.getJSON('/users/userlist', function(data) {
            LOGIN.userListData = data;
        });
    },
    login : function(event) {
        var userName = $('#inputUserName').val();
        var arrayPosition = LOGIN.userListData.map(function(arrayItem) { return arrayItem.username; }).indexOf(userName); 
         if(arrayPosition != -1) {
            var userObject =LOGIN.userListData[arrayPosition]; 
            if(userObject['password'] === $('#inputUserPassword').val()) {
               alert("welcome back " + userObject['username']);
               LOGIN.playGo(userObject);
            }
            else {
               alert("wrong password! Please try again!");
               return false;
            }
        }
        else {
            var errorCount = 0;
            $('#login input').each(function(index, val) {
                if($(this).val() ==='') {errorCount++; }
            });

            if(errorCount === 0) {
                var newUser = {
                    'username' : $('#inputUserName').val(),
                    'password' : $('#inputUserPassword').val(),
                    'blackTaken' : 0,
                    'whiteTaken' : 0,
                    'whoseturn' : true,
                    'saved': false
                };
                $.ajax({
                    type: 'POST',
                    data: newUser,
                    url: '/users/adduser',
                    dataType: 'JSON'
                }).done(function(response) {
                    if (response.msg ==='') {
                        alert("thanks for joining!, Please Login again to start playing Go!");
                        location.reload(forceGet = true);
                    }
                    else {
                        alert("Error: " + response.msg);
                    }
                });
            }
            else {
                alert('Please fill in all fields');
                return false;
            }
        }   

    },
    playGo : function(userObject) {
          $.ajax({
            type: 'PUT',
            url: '/users/currentuser/'+ LOGIN.currentId,
            data: {'currentuser': userObject._id},
            datatype: 'json'
        }).done(function(response) {
                //check for successful response
                if(response.msg ==='') {
                    window.location.href = '/users/gogame/'+ userObject.username;
                }
                else {
                    alert('Error: ' + response.msg);
                }
        });
    
    }
};


