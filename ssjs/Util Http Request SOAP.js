    var req = new Script.Util.HttpRequest("https://"+subdomain+".soap.marketingcloudapis.com/Service.asmx");

    req.emptyContentHandling = 0;
    req.retries = 2;
    req.continueOnError = false;
    req.contentType = "text/xml;charset=UTF-8";
    req.setHeader("Authorization", 'Bearer ' + request.Token);
    req.setHeader("SOAPAction", 'Retrieve');
    //req.setHeader("Content-Type", 'text/xml;charset=UTF-8');
    req.method = "POST";
    req.postData = "<Envelope xmlns=\"http://schemas.xmlsoap.org/soap/envelope/\"\r\n    xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\r\n    <Header>\r\n        <fueloauth>"+request.Token+"</fueloauth>\r\n    </Header>\r\n    <Body>\r\n        <RetrieveRequestMsg xmlns=\"http://exacttarget.com/wsdl/partnerAPI\">\r\n            <RetrieveRequest>\r\n                <ObjectType>DataExtensionObject[ESWA_EPA_v1-cb_Testing_DE]</ObjectType>\r\n                <Properties>Test_Record_ID</Properties>\r\n                <Properties>_CustomObjectKey</Properties>\r\n\r\n\r\n                <Filter xsi:type=\"SimpleFilterPart\">\r\n                    <Property>Email_Address</Property>\r\n                    <SimpleOperator>equals</SimpleOperator>\r\n                    <Value>epa_v1-cb+global@salesforce.com</Value>\r\n                </Filter>\r\n            </RetrieveRequest>\r\n        </RetrieveRequestMsg>\r\n    </Body>\r\n</Envelope>";


    var resp = req.send(); 
    var soapXML = Stringify(resp.content);

    var nextIndex = soapXML.indexOf("Value",soapXML.indexOf("_CustomObjectKey"));
    var closingBracket = soapXML.indexOf("</Value>",nextIndex+6);
    var customObjKey = soapXML.substring(nextIndex+6,closingBracket);
    
Write("custom object key: "+customObjKey+"<br>");
//Write('<textarea>'+Stringify(resp.content)+'</textarea>')
Variable.SetValue("@xml",Stringify(resp.content));

</script>
%%[

         
Set @p = '<Properties>(.*?)<\/Properties>'
Set @o = RegExMatch(@xml,@p,1)

Output(Concat('<textarea>',@o,'</textarea>'))
Set @newxml = Concat('<Properties>',@o,'</Properties>')

Set @loaded = BuildRowSetFromXml(@newxml,'/Properties/Property',0);
Set @rows = RowCount(@loaded)




Output(Concat('<textarea>wwwwaaatffffffff ',@rows,'</textarea>'))

]%%