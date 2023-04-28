## Salesforce API + jQuery
## This is a collection of jQuery calls to the bulk and batch Salesforce API. I came across them recently and decided I wanted to store them for potential future use. 

### First thing first

You'll want to be on https. If you're doing this from WAMP, you'll need to fake an SSL certificate locally. After that you'll need to go into the CORS section in your dev org using the Quick Find box and whitelist your domain, even if it's localhost. You can't whitelist http:, so that's why you'll need to set up the certificate. This video helped me there https://www.youtube.com/watch?v=D5IqDcHyXSQ.

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
```

You'll need to set up a connected app in CRM in order to get the client id and secrent. If you've never done this before, google it, there are lots of articles. 

### So I've set this up in a way to minimize redundant code. The doAjaxAsync function is reused by all of the calls. It makes it slightly messier, but not as messy as using separate calls for each one. Plus, I've added the async/await so that everything is linear. Easier to follow that way and you can always unravel it if you want. 

For the ingest, I've just used a string.
```
  let csv = 'Email,LastName,FirstName\r\nbuddy100@elf.com,Elffff,Budddddy';
```

You'll want to use an array probably or array of objects, but when you do, set a loop to format it like the above. The \r had to be before the \n. I think this also has to do with how you set the line endings, CRLF vs LF, but I didn't test that theory. If you're using this for an upload form, I suggest Papaparse, it's a great utility.

Note that the bulkJobStatus function will loop until it gets a confirmation of JobComplete and then it will return, which will allo the code to continue. 

For more information on the Bulk API: https://developer.salesforce.com/docs/atlas.en-us.api_asynch.meta/api_asynch/bulk_api_2_0.htm

### Composite Batch API
The getContacts function uses the batch API. More info here: 
- https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_composite_batch.htm
- https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_composite_composite.htm
- https://salesforce.stackexchange.com/questions/146874/using-jquery-to-perform-a-composite-ajax-request
- https://medium.com/@charlie_77818/querying-large-ish-datasets-fast-and-efficiently-with-salesforces-composite-resources-3f614dbca111

The composite part is commented out. I had it working at one point. Check the last article for how to do it. Eventually I'll come back and set it up, I just need to get it out of my tabs for now. To use it, you'll need to break it apart. I just did what I did there as a proof of concept.

### This looked cool so...
- https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/dome_composite_batch.htm#topic-title
The retrieveUpdateSameTime() shows how to set that up. You'll need to use your own account id from your own dev org.

### Sans jQuery
fetch-api.php has an example of doing this using the [fetch api](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) and no jquery.



