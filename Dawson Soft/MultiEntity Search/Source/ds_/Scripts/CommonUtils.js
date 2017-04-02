//Allowed charcters from a-z A-Z
var regExp_az_AZ = "^[a-zA-Z]+$";

//Allowed charcters from a-z A-Z and Space
var regExp_az_AZ_Space = "^[a-zA-Z \s]+$";

var regExp_TimeZone = "[-+]((0[0-9]|1[0-3]):([03]0|45)|14:00)";


// -------------
// Accessing CRM
// -------------

// Returns a path to the server.
// The URL returned always ends with "/".
function getClientUrl() {
    var strUrl = "";
    if (window.Xrm) {
        strUrl = window.Xrm.Page.context.getClientUrl();
    } else {
        if (window.parent != null && window.parent.Xrm != null) {
            strUrl = window.parent.Xrm.Page.context.getClientUrl();
        } else {
            throw "Xrm is not defined";
        }
    }

    if (strUrl.substr(strUrl.length - 1) != "/") {
        strUrl += "/";
    }

    return strUrl;
}

// Returns the path to the organization data service.
function getODataPath() {
    return getClientUrl() + "XRMServices/2011/OrganizationData.svc";
}

// Reports an error message for an OData call.
function getODataErrorMessage(req) {
    var strMsg = getResponseStatusMessage(req.status);
    if (strMsg == null) {
        try {
            strMsg = JSON.parse(req.responseText).error.message.value;
        }
        catch (e) {
            strMsg = req.statusText;
        }
    }
    return strMsg;
}

// Returns an error message based on the request status.
function getResponseStatusMessage(status) {
    // Error descriptions come from http://support.microsoft.com/kb/193625.
    if (status == 12029) {
        return "The attempt to connect to the server failed.";
    }
    if (status == 12007) {
        return "The server name could not be resolved.";
    }
    return null;
}


// ------------
// Wait graphic
// ------------

var g_imgWait =
{
    nCounter: 0,

    Show: function () {
        if (this.nCounter++ == 0) {
            if ($(".po_divWait").length > 0) {
                $(".po_divWait").css("visibility", "visible");
            }
            else {
                this.CreateWaitDiv();
            }
        }
    },

    Hide: function () {
        if (--this.nCounter <= 0) {
            this.nCounter = 0;
            $(".po_divWait").css("visibility", "hidden");
        }
    },

    CreateWaitDiv: function () {
        $("body").append(
          "<div id='po_divWaitBackground' class='po_divWait'></div>" +
          "<div id='po_divWaitImage' class='po_divWait'>" +
            "<table style='height:100%;width:100%;'>" +
            "<tr>" +
              "<td style='vertical-align: middle' align='center'>" +
                "<img id='loading' alt='' src='../po_/Images/progress.gif'/>" +
              "</td>" +
            "</tr>" +
            "</table>" +
          "</div>");
    }
};


function convertToInt(strDecimal) {
    if (isNumeric(strDecimal) == false) {
        return 0;
    }

    return parseInt(strDecimal);
}

function getZeroIfNull(decimalValue) {
    if (decimalValue == null)
        return parseFloat(0.00).toFixed(2);

    return parseFloat(decimalValue).toFixed(2);;
}

//This function gets service object for oData call
function getXMLHTTPObject() {
    var xmlHttp;
    try {
        // Firefox, Opera 8.0+, Safari
        xmlHttp = new XMLHttpRequest();
    } catch (e) {
        // Internet Explorer
        try {
            xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) {
                alert("Your browser does not support AJAX!");
                return false;
            }
        }
    }
    return xmlHttp;
}

