<script runat="server">
  Platform.Load("Core", "1");


  var creds = {
    client_id: 'xxxxxx',
    client_secret: 'xxxxxx',
    grant_type:'client_credentials',
    account_id: '0123456789'
  }
  var subdomain = '[YOURSUBDOMAIN]';
  var authUrl = 'https://'+subdomain+'.auth.marketingcloudapis.com';  
  var objectid = Request.GetQueryStringParameter("objectid");
  var legacyid = Request.GetQueryStringParameter("legacyid");
  var row = Request.GetQueryStringParameter("row");

  



try{
  // get access token

    var auth = oAuthSimpler(authUrl,creds);

    var token = auth.access_token;
  

  var names = ["Authorization"];
  var values = ["Bearer "+token];    

  //var url = 'https://'+subdomain+'.rest.marketingcloudapis.com/asset/v1/content/assets/query';
  //guide/v1/emails/{EMAIL_ID}/dataExtension/{DATAEXTENSION_GUID}/row/{ROW_NUMBER}/preview
  var url = 'https://'+subdomain+'.rest.marketingcloudapis.com/guide/v1/emails/'+legacyid+'/dataExtension/'+objectid+'/row/'+row+'/preview?kind=html';
  ///guide/v1/emails/[emailID here]/dataExtension/key:[DE External Key goes here]/contacts/key:[Subscriber Key that you want to preview here]/preview?kind=html
  var content = HTTP.Post(url, 'application/json', Stringify(props),names,values);   
 
  var allofit = Platform.Function.ParseJSON(content['Response'][0]);
  //Write(content['Response'][0]['message']['views']['content']);
  Write(allofit.message.views[0].content);

 
    }catch(e){
 Write(Stringify(e));
}
function oAuthSimpler(host, payload) {

  var route = '/v2/token';
  var url = host + route;
  var contentType = 'application/json';
  
  var req = HTTP.Post(url, contentType, Stringify(payload));
  var res = Platform.Function.ParseJSON(req['Response'][0]);
  
  return res;
}

</script>