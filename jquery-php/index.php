
<!DOCTYPE html>
<html>
 <head>
 <meta charset="UTF-8">
 <title>page title</title>
 <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
 <meta name="format-detection" content="telephone=no" />
 <link href="/favicons/favicon.ico" rel="shortcut icon" type="image/x-icon" />
</head>
<body>



<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
<script>

var instance = 'na123';
var version = '53.0';
var baseURL = 'https://'+instance+'.salesforce.com/services/data/v'+version;

$(document).ready(function() {

  $.ajax({
    url: 'apicall.php',//was ajax-routing.php
    cache: true,
    method: "post",
    dataType:"json",
    data: {
      q:'SELECT Id,Email FROM Contact'
    }
    }).done(function(resp){ 
      console.log(resp);
    });


});//end js anonymous function


</script>        
      

    </body>
</html>









