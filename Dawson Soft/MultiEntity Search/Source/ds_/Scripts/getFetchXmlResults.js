var FetchXmlResult = null;
var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

function getData(fetchXml) {
    var request = generateFetchBasedSOAPRequest(fetchXml);
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", getClientUrl() + "XRMServices/2011/Organization.svc/web", false);
    xmlhttp.setRequestHeader("Accept", "application/xml, text/xml, */*");
    xmlhttp.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
    xmlhttp.setRequestHeader("SOAPAction", "http://schemas.microsoft.com/xrm/2011/Contracts/Services/IOrganizationService/Execute");

    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            xmlhttp.onreadystatechange = null;
            loadDataCallBack(this);
        }
    };
    xmlhttp.send(request);
}

function loadDataCallBack(requestData) {
    //200   = OK
    if (requestData.status == 200) {
        var retriveResponse = requestData.responseXML;
        if (hasError(retriveResponse)) {
            alert("Error occured while loading data.");
            return;
        }

        FetchXmlResult = parseSoapResponse(retriveResponse);
    }
}

function hasError(resultXml) {
    if (typeof resultXml == "object" && resultXml != null) {
        try {
            var bodyNode = resultXml.firstChild.firstChild;
            //Retrieve the fault node
            for (var i = 0; i < bodyNode.childNodes.length; i++) {
                var node = bodyNode.childNodes[i];
                //NOTE: This comparison does not handle the case where the XML namespace changes
                if (node.nodeName == "s:Fault") {
                    for (var j = 0; j < node.childNodes.length; j++) {
                        var faultStringNode = node.childNodes[j];
                        if (faultStringNode.nodeName == "faultstring") {
                            return true;
                        }
                    }
                }
            }
        } catch (e) {
            return true;
        };
        return false;
    }
}

function generateFetchBasedSOAPRequest(fetchXml) {
    var request = "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\">";
    request += "<s:Body>";
    request += '<Execute xmlns="http://schemas.microsoft.com/xrm/2011/Contracts/Services">' +
        '<request i:type="b:RetrieveMultipleRequest" ' +
        ' xmlns:b="http://schemas.microsoft.com/xrm/2011/Contracts" ' +
        ' xmlns:i="http://www.w3.org/2001/XMLSchema-instance">' +
        '<b:Parameters xmlns:c="http://schemas.datacontract.org/2004/07/System.Collections.Generic">' +
        '<b:KeyValuePairOfstringanyType>' +
        '<c:key>Query</c:key>' +
        '<c:value i:type="b:FetchExpression">' +
        '<b:Query>';
    request += CrmEncodeDecode.CrmXmlEncode(fetchXml);
    request += '</b:Query>' +
        '</c:value>' +
        '</b:KeyValuePairOfstringanyType>' +
        '</b:Parameters>' +
        '<b:RequestId i:nil="true"/>' +
        '<b:RequestName>RetrieveMultiple</b:RequestName>' +
        '</request>' +
        '</Execute>';

    request += '</s:Body></s:Envelope>';

    return request;
}

function parseSoapResponse(responseXml) {
    var results = new Array(0);
    var elementName = is_chrome ? "Entities" : "a:Entities"; //To fix the bug in chrome. Ref: http://stackoverflow.com/questions/4565112/javascript-how-to-find-out-if-the-user-browser-is-chrome
    var sFetchResult = responseXml.getElementsByTagName(elementName);
    if (sFetchResult == null || sFetchResult.length == 0 || sFetchResult[0].childNodes == null ||
        sFetchResult[0].childNodes.length == 0)
        return results;

    results = new Array(sFetchResult[0].childNodes.length);

    for (var i = 0; i < sFetchResult[0].childNodes.length; i++) {
        var oResultNode = sFetchResult[0].childNodes[i];
        var jDE = new jsDynamicEntity();
        var obj = new Object();
        for (var j = 0; j < oResultNode.childNodes.length; j++) {
            switch (oResultNode.childNodes[j].localName) {
                case "Attributes":
                    var attr = oResultNode.childNodes[j];

                    for (var k = 0; k < attr.childNodes.length; k++) {

                        // Establish the Key for the Attribute
                        var sKey = "";
                        if (attr.childNodes[k].firstChild != null && attr.childNodes[k].firstChild.textContent != null) {
                            sKey = attr.childNodes[k].firstChild.textContent;
                        }

                        var sType = '';

                        // Determine the Type of Attribute value we should expect
                        for (var l = 0; l < attr.childNodes[k].childNodes[1].attributes.length; l++) {
                            if (attr.childNodes[k].childNodes[1].attributes[l].localName == 'type') {
                                sType = attr.childNodes[k].childNodes[1].attributes[l].textContent;
                            }
                        }

                        switch (sType) {

                            case "a:AliasedValue":
                                var entAV = new jsAliasedValue();
                                entAV.Type = sType;
                                entAV.AttributeName = attr.childNodes[k].childNodes[1].childNodes[0].textContent;
                                entAV.LogicalName = attr.childNodes[k].childNodes[1].childNodes[1].textContent;
                                entAV.Value = attr.childNodes[k].childNodes[1].childNodes[2].textContent;
                                obj[sKey] = entAV;

                                break;

                            default:
                                var entCV = new jsCrmValue();
                                entCV.Type = sType;
                                entCV.Value = attr.childNodes[k].childNodes[1].textContent;
                                obj[sKey] = entCV;

                                break;
                        }

                    }

                    jDE.Attributes = obj;
                    break;
            }

        }

        results[i] = jDE;

    }

    return results;
}

function jsDynamicEntity() {
    this.Attributes = new Object();
}

function jsCrmValue(sType, sValue) {
    this.Type = sType;
    this.Value = sValue;
}

function jsAliasedValue(attrName, sLogicalName, mValue) {
    this.AttributeName = attrName;
    this.LogicalName = sLogicalName;
    this.Value = mValue;
    this.Type = 'AliasedValue';
}