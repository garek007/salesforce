<script runat="server">
Platform.Load("Core","1.1.1");

var subdomain = 'xxxxx';
var token = authMC();

var jsonData = Platform.Request.GetPostData();
var obj = Platform.Function.ParseJSON(jsonData);
  //Write(Platform.Function.Stringify(obj));

var payload2 = new Object();
    payload2.name = obj.imagename;//you should randomize this or if you try to upload same image twice it will fail
    payload2.assetType = {"name": "png","id": 28};
    payload2.file = obj.file;

var headerNames = ["Authorization"];
var headerValues = ["Bearer "+token];  
var result = HTTP.Post('https://'+subdomain+'.rest.marketingcloudapis.com/asset/v1/content/assets','application/json', Platform.Function.Stringify(payload2),headerNames,headerValues);
var content = Platform.Function.ParseJSON(result.Response[0]);
Write(Platform.Function.Stringify(content));
    
function authMC(){
  
    var url = 'https://'+subdomain+'.auth.marketingcloudapis.com/v2/token';
    var contentType = 'application/json';
    var obj = new Object();
        obj.client_id = 'xxxx';
        obj.client_secret = 'xxxxx';
        obj.grant_type = 'client_credentials';
        obj.account_id = 01245678;    

    var payload = Platform.Function.Stringify(obj);

    try {

        var accessTokenResult = HTTP.Post(url, contentType, payload);
        if(accessTokenResult.StatusCode == 200){
            var accessToken = Platform.Function.ParseJSON(accessTokenResult.Response[0]);
            return accessToken.access_token;
        }else{
            return 'error';
        }
        

        } catch (e) {
        Write("<br>e: " + Stringify(e));
        //Write(Stringify(e));
        }
}
  
  

</script>


  
