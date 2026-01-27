<script runat="server">
Platform.Load("core", "1.1");

var api = new Script.Util.WSProxy();
var deWithField = [];
var folderCache = {};

// ---- Helper: Get folder by ID ----
function getFolderById(id) {
    if (folderCache[id]) return folderCache[id];

    var cols = ["ID", "ParentFolder.ID", "Name", "ContentType"];
    var filter = { Property: "ID", SimpleOperator: "equals", Value: id };

    var resp = api.retrieve("DataFolder", cols, filter);
    if (resp && resp.Results && resp.Results.length > 0) {
        folderCache[id] = resp.Results[0];
        return folderCache[id];
    }
    return null;
}

// ---- Helper: Build path ----
function buildFolderPath(folderId) {
    var parts = [];
    var current = getFolderById(folderId);

    while (current) {
        parts.unshift(current.Name);
        if (!current["ParentFolder"].ID || current["ParentFolder.ID"] == 0) break;
        current = getFolderById(current["ParentFolder"].ID);
    }
    return "/" + parts.join("/");
}

// ---- CSV Escape ----
function csvEscape(str) {
    if (str == null) return "";
    str = String(str);
    if (str.indexOf('"') >= 0 || str.indexOf(',') >= 0) {
        str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

try {

    var fieldToFind = Request.GetQueryStringParameter('field');
    var outputCSV = true;
    var upsertToDE = false;
    var result = [],
        objs = [],
        moreData = true,
        maxLoops = 2,
        reqID = request = null;
    var targetDE = 'All_data_extensions';//CustomerKey for saving DE names to a DE

    var c = {
        object: 'DataExtension',
        cols: ['CustomerKey','Name','CategoryID'],
        filter:{ Property: "CustomerKey", SimpleOperator: "isNotNull", Value: "" },
        opts: {
            BatchSize: 2500
        },
        props: {
            QueryAllAccounts: false
        }
    };


    while(moreData == true && maxLoops > 0) {

        moreData = false;

        if(reqID == null){
            request = api.retrieve(c.object, c.cols, c.filter,c.opts,c.props);
        }else{
            request = api.getNextBatch(c.object, reqID);
        }


        if(request) {

            moreData = request.HasMoreRows;
            reqID = request.RequestID;

            for (var i = 0; i < request.Results.length; i++) {
                result.push(request.Results[i]);

                objs.push({
                    CustomerKey: targetDE,
                    Properties: [
                        {
                            Name:'Name',
                            Value:request.Results[i].Name
                        },
                        {
                            Name:'CustomerKey',
                            Value:request.Results[i].CustomerKey
                        }
                    ]
                });                  
            }

        }
        maxLoops--;

    }
    
    //Write(objs.length);
    //Write("\r\n");Write("\n\r");//new lines are sometimes \r\n and sometimes BR I think it depends on page type. 
    //Write("<br><br>");
    //Write(result.length);
    //Write("<br><br>");
    //</br></br>Write(Stringify(objs));Write("\r\n");Write("\r\n");

    if(upsertToDE){
        var options = {SaveOptions: [{'PropertyName': '*', SaveAction: 'UpdateAdd'}]};
        var deleteem = api.updateBatch('DataExtensionObject', objs, options);
        //Write(Stringify(deleteem));
    }
    
    if (result) {//result
        for (var i = 0; i < result.length; i++) {
            var de = result[i];

            var deCustomerKey = de.CustomerKey;
            var deName = de.Name;
            var categoryId = de.CategoryID;

            var fieldFilter = {
                LeftOperand: {
                    Property: "DataExtension.CustomerKey",
                    SimpleOperator: "equals",
                    Value: deCustomerKey
                },
                LogicalOperator: "AND",
                RightOperand: {
                    Property: "Name",
                    SimpleOperator: "equals",
                    Value: fieldToFind
                }
            };

            var fieldResults = api.retrieve(
                "DataExtensionField",
                ["Name", "DataExtension.CustomerKey"],
                fieldFilter
            );

            if (fieldResults && fieldResults.Results && fieldResults.Results.length > 0) {

                var folderPath = "(Unknown Folder)";
                if (categoryId) folderPath = buildFolderPath(categoryId);

                deWithField.push({
                    Name: deName,
                    CustomerKey: deCustomerKey,
                    Path: folderPath
                });
            }
        }
    }

    if(outputCSV){
        // ---- Create CSV ----
        var csv = "Name,CustomerKey,FolderPath\r\n";
        for (var j = 0; j < deWithField.length; j++) {
            csv += [
                csvEscape(deWithField[j].Name),
                csvEscape(deWithField[j].CustomerKey),
                csvEscape(deWithField[j].Path)
            ].join(",") + "\r\n";
        }

        // ---- Output CSV ----
        Platform.Response.SetResponseHeader("Content-Type", "text/csv");
        Platform.Response.SetResponseHeader("Content-Disposition", "attachment; filename=DEs_With_Field.csv");

        Write(csv);
    }


} catch (e) {
    Write(Stringify(e));
}
</script>
