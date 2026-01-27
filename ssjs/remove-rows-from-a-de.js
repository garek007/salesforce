<script runat="server">
Platform.Load("Core","1");
//remove rows from one data extension using another data extension as the map/key
/**
  IMPORTANT, READ THIS FIRST
  On line 16, the retrieveDE is the one that holds the records you want removed from your targetDE.
  On line 18, update the targetCol value to be the name of the column that is used to identify the row to remove in the targetDE
  These two values are often the same, but in the case of the LPID Cleanup, the source was SubscriberKey and the target
  in the Subscriber Preferences for Marketing DE data extension was LPID
  */
  var retrieveDE = "SMS_Consent_Purge";
  var targetDE = 'SMS_Consent_DevDB';//Should be CustomerKey NOT the name of the DE

  //var errorDE = DataExtension.Init('SubPrefsRowRemoval_Errors_log');//where automation errors are logged
  var prox = new Script.Util.WSProxy(),
      retrieveCol = 'Unique_Key'
      targetCol = 'Unique_Key',
      moreData = true,
      reqID = null,
      numItems = 0;

try{

      var toBeDeleted = [];
      var objs = [];
      var errObjs = [];

      while(moreData){
         moreData = false;
         var data = reqID == null ? prox.retrieve('DataExtensionObject['+retrieveDE+']',[retrieveCol]) : prox.getNextBatch('DataExtensionObject['+retrieveDE+']',reqID);
            Write(Stringify(data));
         if(data != null){
            moreData = data.HasMoreRows;
            reqID = data.RequestID;
            if(data && data.Results){
               for(var k in data.Results) {
                  var props = data.Results[k].Properties;

                  for(var i in props){
                     var key = props[i].Name;
                     var val = props[i].Value;
                     if(key == retrieveCol) {
                        objs.push({
                           CustomerKey: targetDE,
                           Keys: [{Name:targetCol,Value:val}]
                        });                        
                     }                  
                  }

               }               
            }
         }
      }

      var options = {SaveOptions: [{'PropertyName': '*', SaveAction: 'UpdateAdd'}]};
      var deleteem = prox.deleteBatch('DataExtensionObject', objs);

}catch(e){
   //errorDE.Rows.Add({error:Stringify(e)});
   Write(Stringify(e));
   Write("\r\n");
   Write(Stringify(e));
}

function Write(str) {
   Platform.Response.Write(str);
}
function Stringify(obj) {
   return Platform.Function.Stringify(obj);
}
</script>
