


<script runat="server">
  Platform.Load("Core", "1");
 
  //var key = "Opted Out in this BU but not in Sales Cloud";
  //var deObj = DataExtension.Init(key);
  //var rows = deObj.Rows.Lookup(["Fixed"], ["false"]);
  Write("Hello World");
  //var retrieve = RetrieveSalesforceObjects('Contact',['FirstName','LastName','Email'],[['Email','=','scott.olin@cloud4good.com']]);
  //Write(Stringify(retrieve));


/* 
  for(var i = 0; i < rows.length; i++ ){
    var prefix = rows[i].SubscriberKey.substring(0,3);
    var object = (prefix=='003')?'Contact':'Lead';
    var fields = "Marketing_Opt_In__c,Opt Out,Recruiting_Opt_In__c,Opt Out";
    try { 
      var updateSFResults = UpdateSingleSalesforceObject(object,rows[i].SubscriberKey,fields);
      var update = deObj.Rows.Update({Fixed:"true"},["SubscriberKey"],[rows[i].SubscriberKey]);
 
    } catch (e1) {
         Write("<br>e1: " + Stringify(e1));
    } // of catch            
   }  
   */
function retrieveDataExtensionRows(key){
  //ref: https://salesforce.stackexchange.com/questions/301320/retrieving-and-displaying-the-records-from-a-data-extension-using-ssjs-or-wsprox
  var myDE = DataExtension.Init(key);
  var data = myDE.Rows.Retrieve();
  return data;
}
  //every object has specific required fields. Data should be prepared before this function is called.  
function CreateSalesforceObject(object,fields){
  var fieldArr = fields.split(',');

  var numFields = fieldArr.length/2;
  var amp = "\%\%[ ";
      amp+= "set @c = CreateSalesforceObject('"+object+"','"+numFields+"','"+fieldArr.join("','")+"') ";
      amp+= "output(v(@c)) ";
      amp+= "]\%\%";
      return Platform.Function.TreatAsContent(amp);
}

//every object has specific required fields. Data should be prepared before this function is called.  
function UpdateSingleSalesforceObject(object,objectid,fields){
  var fieldArr = fields.split(',');
  var amp = "\%\%[ ";
      amp+= "set @c = UpdateSingleSalesforceObject('"+object+"','"+objectid+"','"+fieldArr.join("','")+"') ";
      amp+= "output(v(@c)) ";
      amp+= "]\%\%";
      return Platform.Function.TreatAsContent(amp);
}
function RetrieveSalesforceObjects(sfObject,fieldNames,parameters) {
    var varName = '@amp__RetrieveSalesforceObjects';

    // AMP decleration
    var amp = "\%\%[ ";
    // function open        
    amp += "SET "+varName+" = RetrieveSalesforceObjects(";
    // parameters
    amp += "'" + sfObject + "'";
    amp += ",'" + fieldNames.join(",") + "'";
    // n parameters to update
    for (var i = 0; i < parameters.length; i++) {
        amp += ",'" + parameters[i].join("','") + "'";
    }
    // function close
    amp += ") ";

    // build json from rowset
    amp += "SET "+varName+"_output = '{ \"Status\": \"OK\", \"Results\": [' ";

    // iterate over RowCount
    amp += "FOR "+varName+"_i = 1 TO RowCount("+varName+") DO ";
    amp += "SET "+varName+"_output = Concat("+varName+"_output,'{') ";

    // iterate over each fieldNames
    for (var n = 0; n < fieldNames.length; n++) {
        amp += "SET "+varName+"_output = Concat("+varName+"_output,'\""+fieldNames[n]+"\":\"', Field(Row("+varName+", "+varName+"_i) ,'"+fieldNames[n]+"',0),'\"') ";
        amp += (n<(fieldNames.length-1)) ? "SET "+varName+"_output = Concat("+varName+"_output,', ') " : " ";
    }
    
    // close for loop
    amp += "SET "+varName+"_output = Concat("+varName+"_output,'}') ";
    amp += "IF "+varName+"_i < RowCount("+varName+") THEN SET "+varName+"_output = Concat("+varName+"_output,',') ENDIF ";
    amp += "NEXT "+varName+"_i ";

    // close ouput object
    amp += "SET "+varName+"_output = Concat("+varName+"_output,'] }') ";

    // output
    amp += "Output(v("+varName+"_output)) ";
    // end of AMP
    amp += "]\%\%";

    try {
        return Platform.Function.ParseJSON(Platform.Function.TreatAsContent(amp)); 
    } catch(e) {
        return Platform.Function.ParseJSON('{"Status": "Error cannot retrieve Salesforce Object", "Results": ['+Platform.Function.Stringify(amp)+']}');
    }
}

function Write(str) {
   Platform.Response.Write(str);
}
function Stringify(obj) {
   return Platform.Function.Stringify(obj);
}

</script>