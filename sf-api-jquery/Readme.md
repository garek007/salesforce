## Salesforce API + jQuery
## This is a collection of jQuery calls to the bulk and batch Salesforce API. I came across them recently and decided I wanted to store them for potential future use. 

### First thing first

You'll want to be on https. If you're doing this from WAMP, you'll need to fake an SSL certificate locally. After that you'll need to go into the CORS section in your dev org using the Quick Find box and whitelist your domain, even if it's localhost. You can't whitelist http:, so that's why you'll need to set up the certificate.

I haven't gotten this to work, even though it theoretically should if you enable CORS for OAuth endpoints. To be fair, I'm doing this all from WAMP
```
  $.ajax({
    url: "https://login.salesforce.com/services/oauth2/token",//was ajax-routing.php
    cache: true,
    method: "post",
    headers:{
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept':'application/json'
    },
    data: {
      client_id:"",
      client_secret:"",
      grant_type:"password",
      username:"",
      password:""
    }
    }).done(function(resp){  
      console.log(resp);
    });
```    
    This wouldn't be very secure anyway, but it's there if you have a use case for it. 

    I'm actually using PHP to grab the token before the page loads. Here is the formatting of the object you'll pass to guzzle.

```
    $body = new stdClass();
    $token = 'xxxxx';
    $body->client_id = "xxxxxxx";
    $body->client_secret = "xxxxxx";
    $body->grant_type = "password";
    $body->username = "yourusername";
    $body->password = "yourpasswordplustoken;

    You'll need to set up a connected app in CRM in order to get the client id and secrent. If you've never done this before, google it, there are lots of articles. 