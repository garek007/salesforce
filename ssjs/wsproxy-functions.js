<script runat="server">
Platform.Load("Core","1");

    var retrieveDE = "SANTOS";//Name of the DE NOT the Customer Key
    var targetDE = '886DABF2-810D-4EA2-8468-1AC623B4E92E';//CustomerKey NOT the name of the DE

    var retrieveCols = ['SID','CustomerIdentifier','Address1','FirstName'],
        targetCol = 'Unique_Key';
    var filter = {
        Property: 'Address1',
        SimpleOperator: 'isNotNull',
        Value: ' '
    }
var theData = wsProxyRetrieve(retrieveCols,retrieveDE,filter);

Write(Stringify(theData.clean[0]));

var makeRow = wsProxyBatchRow(targetDE,theData.clean[0]);

var batches = [];
    batches.push(makeRow);
Write(Stringify(batches));  
var prox = new Script.Util.WSProxy();
    var options = {SaveOptions: [{'PropertyName': '*', SaveAction: 'UpdateAdd'}]};
    var updateDE = prox.updateBatch('DataExtensionObject',batches,options);
    Write(Stringify(updateDE));


function wsProxyBatchRow(deKey,propsObj){

    var obj = {};
        obj.CustomerKey = deKey;
    
    var propsArray = [];

    for(var key in propsObj){
        if(propsObj.hasOwnProperty(key)){
            var pObj = {};
                pObj.Name = key;
                pObj.Value = propsObj[key];
                propsArray.push(pObj);
        }
    }

    obj.Properties = propsArray;
    return obj;


}
/**
 * Retrieves rows from a Marketing Cloud Data Extension using WSProxy.
 * Handles pagination automatically and returns the results in two formats.
 *
 * RAW FORMAT
 * ----------
 * Each row is returned as an array of Name/Value objects, matching the
 * native WSProxy structure.
 *
 * Example:
 * [
 *   {"Name":"CustomerIdentifier","Value":"21126340"},
 *   {"Name":"Address1","Value":"62 MASTIC BLVD W"}
 * ]
 *
 * This format is useful when reinserting rows into a Data Extension without
 * needing to transform the structure.
 *
 * CLEAN FORMAT
 * ------------
 * Each row is converted into a standard JavaScript object where the column
 * names become properties.
 *
 * Example:
 * {
 *   "CustomerIdentifier": "21126340",
 *   "Address1": "62 MASTIC BLVD W"
 * }
 *
 * Access example:
 * theData.clean[0].Address1
 *
 * @param {Array} cols
 * Array of column names to retrieve from the Data Extension.
 *
 * @param {String} deName
 * Name of the Data Extension.
 *
 * @param {Object} [filter]
 * Optional WSProxy filter object.
 *
 * @returns {Object}
 * Returns an object containing:
 *   raw   - Array of WSProxy-style Name/Value rows
 *   clean - Array of simplified JavaScript objects
 */
function wsProxyRetrieve(cols,deName,filter){

    var prox = new Script.Util.WSProxy(),
        raw = [],
        clean = [],
        moreData = true
        reqID = null;

    while(moreData){
        moreData = false;
        var data = reqID == null
        ? prox.retrieve('DataExtensionObject['+deName+']',cols,typeof filter !== undefined && filter) 
        : prox.getNextBatch('DataExtensionObject['+deName+']',reqID);

        if(data){
            moreData = data.HasMoreRows;
            reqID = data.RequestID;

            if(data.Results){

                for(var k in data.Results) {
                    var props = data.Results[k].Properties;
                    raw.push(props);

                    var tObj = {};

                    for(var i in props){
                        tObj[props[i].Name] = props[i].Value;
                    }
                    clean.push(tObj);
                } 
            }
        }
    }
    return {
        "raw":raw,
        "clean":clean
    };

}



try{



//Write(Stringify(batches));



   

}catch(e){
   Write(Stringify(e));
   Write("\r\n");
   Write(Stringify(e));
}

function extractCity(address) {
    var parsed = parseAddress(address);
    return parsed ? parsed.city : null;
}

function extractStreet(address) {
    var parsed = parseAddress(address);
    return parsed ? parsed.street : null;
}

function parseAddress(address) {

    // Polyfill for trim (safe for SFMC)
    String.prototype.trim = function () {
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };

    if (!address) return null;

    address = address.trim().replace(/,+$/, '');
    address = address.replace(/\s+/g, ' ');//collapses double spaces
    //address = address.toUpperCase(); //Not sure this is needed

    //var regex = /^(\d+\s+.*?\b(?:DR|DRIVE|ST|STREET|AVE|AVENUE|RD|ROAD|CT|COURT|LN|LANE|BLVD|BOULEVARD|PKWY|PARKWAY|CIR|CIRCLE|PL|PLACE|WAY|HWY|HIGHWAY|TER|TERRACE|TRL|TRAIL|LOOP)\b(?:\s+(?:APT|APARTMENT|STE|SUITE|UNIT|LOT|TRLR|RM|ROOM|BLDG|FL|FLOOR|#)\s*[\w-]*)*)\s+(.+)$/i;
    var regex = /^(\d+\s+.*?\b(?:DR|DRIVE|ST|STREET|AVE|AVENUE|RD|ROAD|CT|COURT|LN|LANE|BLVD|BOULEVARD|PKWY|PARKWAY|CIR|CIRCLE|PL|PLACE|WAY|HWY|HIGHWAY|TER|TERRACE|TRL|TRAIL|LOOP)\b(?:\s+[A-Z])?(?:\s+(?:APT|APARTMENT|STE|SUITE|UNIT|LOT|TRLR|RM|ROOM|BLDG|FL|FLOOR|#)\s*[\w-]*)*)\s+(.+)$/i;
    //var regex = /^(\d+\s+.*?(?:(?<!\d)\b(?:DR|DRIVE|ST|STREET|AVE|AVENUE|AV|RD|ROAD|RO|CT|COURT|LN|LANE|LA|BLVD|BOULEVARD|PKWY|PARKWAY|CIR|CIRCLE|PL|PLACE|WAY|WY|HWY|HIGHWAY|TER|TERRACE|TRL|TRAIL|TL|LOOP|EX|EXPRESSWAY|FM)\b(?:\s+[A-Z])?(?:\s+(?:APT|APARTMENT|STE|SUITE|UNIT|LOT|TRLR|RM|ROOM|BLDG|FL|FLOOR|#)\s*[\w-]*)*|[A-Z ]+))\s+(.+)$/i;
    var match = address.match(regex);

    if (!match) return null;

    var city = match[2].trim();

    // --- SECOND PASS ONLY IF NUMBERS PRESENT ---
    if (/\d/.test(city)) {

        // Normalize things like "1FL" -> "1 FL"
        city = city.replace(/(\d)([A-Z])/gi, "$1 $2");

        // Remove leading junk like:
        // APT 10B, 2A, 45, A UNIT 20, etc.
        city = city.replace(/^(?:[\W\d]*|APT\.?|UNIT|CONDO|LOT|RM|ROOM|BLDG|FL|FLOOR|#|\s)+/i, '');

        // Final fallback: grab last alpha city phrase
        var m = city.match(/([A-Za-z]+(?:\s+[A-Za-z]+)*)$/);

        if (m) {
            city = m[1];
        }
    }

    return {
        street: match[1].trim(),
        city: city
    };
}

function recoverCity(address, cityCounts){

    var upper = address.toUpperCase();

    for(var c in cityCounts){

        if(cityCounts[c] >= 3){ // treat cities seen >=3 times as valid

            if(upper.slice(-c.length) === c){
                return c;
            }
        }
    }

    return null;
}


function Write(str) {
   Platform.Response.Write(str);
}
function Stringify(obj) {
   return Platform.Function.Stringify(obj);
}

</script>




