<script runat="server">

    Platform.Load("Core","1");
    var token = "eyJhbGciOiJIUzI1NiIsImtpZCI6IjQiLCJ2ZXIiOiIxIiwidHlwIjoiSldUIn0.eyJhY2Nlc3NfdG9rZW4iOiI2b2Z5ZndqRUNkTVNCZ1NHZTEzOHBvRHYiLCJjbGllbnRfaWQiOiJrZGgwMWg3aXhsa21uOTVqZG1reHE2bGMiLCJlaWQiOjUyMDAwMTAzNCwic3RhY2tfa2V5IjoiUzYiLCJwbGF0Zm9ybV92ZXJzaW9uIjoyLCJjbGllbnRfdHlwZSI6IlNlcnZlclRvU2VydmVyIiwicGlkIjoyNjR9.dR92mNDzE27I2sE7nBS1NfhdXtMCc7YSqQrxZVjuWCU.YfVNKhwhWHmwMbIL1sQxeOqbrd14hNjRKULW4bQgP9DQM1uD3WO4uioGPggkeYaNAro4D4YyB90cewDaS3bEj_LiOqJorpqG4vKzcUXQrbC7SN_66DBJnix9Z2Fi3W-0Qa4WQT7kJFQfsSyTfpWXTM5QHgKWyqfCmZt260Y";
    var subdomain = 'mcffhzgppqw1sdnkwwqqhv6q4f-m';
    var span = 1;//29 is the max
    var startDate = new Date("01/01/2021");
        startDate.setHours(0);
        startDate.setMinutes(0);
        startDate.setSeconds(0);

    var startDateSt = getStartDate("01/01/2021");

    var endDate = getEndDate(startDate);

    var params = {
        StartDate:startDateSt,
        EndDate:endDate,
        ExtractBounces:true
    }

    Write(Stringify(params))
    Write(startDate);
    Write("-----------")
    Write(endDate);

    var soapAction = 'Retrieve';
    var soapStart = '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">';
        soapStart+= '<s:Header><a:Action s:mustUnderstand="1">'+soapAction+'</a:Action><a:To s:mustUnderstand="1">https://'+subdomain+'.soap.marketingcloudapis.com/Service.asmx</a:To>';
        soapStart+= '<fueloauth>'+token+'</fueloauth></s:Header><s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">';
        soapStart+= '<ExtractRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI"><Requests><ID>c7219016-a7f0-4c72-8657-1ec12c28a0db</ID><Parameters>';
        soapStart+= parameter("OutputFileName",'testdates333.zip');
        soapStart+= parameter("StartDate",startDateSt);
        soapStart+= parameter("EndDate",endDate);
        soapStart+= parameter("UnicodeOutput","true");
        soapStart+= parameter("Format","csv");
        soapStart+= parameter("QuoteText","true");
        soapStart+= parameter("ExtractBounces","true");


        //soapStart+= '<Parameter><Name>StartDate</Name><Value>'+startDateSt+'</Value></Parameter>';
        //soapStart+= '<Parameter><Name>EndDate</Name><Value>'+endDate+'</Value></Parameter>';
        //soapStart+= '<Parameter><Name>ExtractBounces</Name><Value>true</Value></Parameter>';

        soapStart+= '</Parameters></Requests></ExtractRequestMsg></s:Body></s:Envelope>';    
    

    //var startDate =  getIsoTime();
    //var endDate = getIsoTime("-1","D");  










    //startDate.setDate(endDate.getDate()+1);
        //startDate.setHours(0);
    
    Write("  new start date ");
    Write(startDate);
    Write(" new end date ")
    Write(getEndDate(startDate));






  
     
     try {

    var req = new Script.Util.HttpRequest("https://"+subdomain+".soap.marketingcloudapis.com/Service.asmx");

    req.emptyContentHandling = 0;
    req.retries = 2;
    req.continueOnError = false;
    req.contentType = "text/xml";
    //req.setHeader("Authorization", 'Bearer ' + token);
    //req.setHeader("SOAPAction", soapAction);
    //req.setHeader("Content-Type", 'text/xml;charset=UTF-8');
    req.method = "POST";
    req.postData = soapStart;


    //var resp = req.send(); 
    var soapXML = Stringify(resp.content);
 // Write("test");
  Write(soapXML);
  
  


    } catch(error) {
        Write(Stringify(err));
    }




function parameter(name,value){
    return '<Parameter><Name>'+name+'</Name><Value>'+value+'</Value></Parameter>'
}

function getStartDate(d){
    var s = new Date(d);
        s.setHours(0);
        s.setMinutes(0);
        s.setSeconds(0);
    return s.getMonth()+1+'/'+s.getDate()+'/'+s.getFullYear()+' 12:00:00 AM';
}

function getEndDate(d){
    var e = new Date(d);
        e.setDate(e.getDate()+29);
        e.setHours(23);
        e.setMinutes(59);
        e.setSeconds(59);    
    return e.getMonth()+1+'/'+e.getDate()+'/'+e.getFullYear()+' 11:59:59 PM';
}



function getIsoTime(offset,units){

    try{
    var amp = '\%\%[ ';

        if(offset){
            amp += 'set @date = DateAdd(Now(),"'+offset+'","'+units+'") '
        }else{
            amp += 'set @date = Now() '
        }
        
        amp += 'set @d = FormatDate(@date,"iso") '
        amp += 'output(v(@d)) ';
        amp += ']\%\%';
        return Platform.Function.TreatAsContent(amp);
    } catch (e2) {
        //Write(Stringify(e2));//Write('{"message":"User ID is empty.","type":"error"}');
        return Stringify(e2);
    }      
}










</script>