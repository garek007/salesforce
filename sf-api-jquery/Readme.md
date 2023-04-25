You'll want to be on https. If you're doing this from WAMP, you'll need to fake an SSL certificate locally.

After that you'll need to go into the CORS section in your dev org using the Quick Find box and whitelist your domain, even if it's localhost.

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