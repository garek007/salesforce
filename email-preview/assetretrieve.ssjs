<script runat="server">
  Platform.Load("Core", "1");

  var creds = {
    client_id: 'xxxxxxx',
    client_secret: 'xxxxxxx',
    grant_type:'client_credentials',
    account_id: '0123456789'
  }
  var subdomain = '[YOURSUBDOMAIN]';
  var authUrl = 'https://'+subdomain+'.auth.marketingcloudapis.com';  
  
  var requestType = Request.GetQueryStringParameter("function");



try{
  // get access token


    //Write(token);
    switch(requestType){
      case "retrieveDataExtensionRowsWithFilter": retrieveDataExtensionRowsWithFilter("GNJ_Testing");break;
      case "retrieveEmails":retrieveEmails();break;
      default:break;
           
    }
    

  
    }catch(e){
 Write(Stringify(e));
}
function checkForStoredToken(){
  
  //check for token in DE
  //if not exists, authenticate
  var auth = oAuthSimpler(authUrl,creds);
  //need some error handling here
  return auth.access_token;
  
}
//no classes in JS ES5 so we have to do it the wonky old fashioned way.
function retrieveEmails(){
  
  var token = checkForStoredToken(); 
  var prefix = Request.GetQueryStringParameter("prefix");
  var props = {
    "page":
    {
        "page":1,
        "pageSize":50
    },
    "query":
    {  
        "leftOperand":
        {
            "property":"name",
            "simpleOperator":"contains"
        },
        "logicalOperator":"AND",
        "rightOperand":
        {
            "property":"assetType.name",
            "simpleOperator":"equal",
            "value":"templatebasedemail"
        }
    }
  };

  props.query.leftOperand.value = prefix;  
  var names = ["Authorization"];
  var values = ["Bearer "+token];    

  var url = 'https://'+subdomain+'.rest.marketingcloudapis.com/asset/v1/content/assets/query';
  var content = HTTP.Post(url, 'application/json', Stringify(props),names,values);   
  Write(content['Response'][0]);  
}
function createDataExtension(name){//this is not fully built out and not tested, but here to adapt if needed.
  var obj = {
    "CustomerKey" : Platform.Function.GUID(),
    "Name" : DE,
    "Fields" : [
        { "Name" : "Id", "FieldType" : "Number", "IsPrimaryKey" : true, "IsRequired" : true },
        { "Name" : "MyData", "FieldType" : "Text", "MaxLength" : 50 },
        { "Name" : "Active", "FieldType" : "Boolean", "DefaultValue" : true }
    ]
  };
  DataExtension.Add(obj);
  Write("(+) Data Extension was created successfully." + "<br>");
}
function retrieveDataExtensionRows(key){
  //ref: https://salesforce.stackexchange.com/questions/301320/retrieving-and-displaying-the-records-from-a-data-extension-using-ssjs-or-wsprox
  var myDE = DataExtension.Init(key);
  //retrieve data without filters  
  var data = myDE.Rows.Retrieve();  
  Write(Stringify(data));  
}
function retrieveDataExtensionRowsWithFilter(key){
  //this is preferred because we can get _customObjectKey
  //at some point we should rewrite to use WSProxy because we're doing it a hacky way now
  //by selecting a column that has all the same value to retrieve all rows.
  var myDE = DataExtension.Init(key);
  //retrieve data using lookup
  var data = myDE.Rows.Lookup(["FirstName"], ["Staniel"]);  
  Write(Stringify(data));  
}
function addDataExtensionRows(){

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