var CONTACT_ENTITY_NAME = "Contact";
var GRID_PRIMARY_CONT_COLUMN = "ContactId";

var ACCOUNT_ENTITY_NAME = "Account";
var GRID_PRIMARY_ACC_COLUMN = "AccountId";

var SearchGrid = null;
var AllRecords = [];
var GridDataRowsCollection = [];

var OrganisationChkBox = false;
var PersonChkBox = false;
var objTextData = null;

//Global Variables
var PAGESIZE = 10;  // Number of search results to display on a page.
var CurrencySymbol = "$";

var ErrorMessage = "";
var IsOrgDataRetrievalReq = true;

var GridCurrentPageNumber = 0;    // Number of the grid page currently displayed.
var TotalRecordCount = null;
var selectedRecords = [];
var IncrementedValue = 0;

$(document).ready(function () {
    var globalOptionSetMetaDataId = retrieveGlobalOptionSetMetaDataId("pmdci_country");
    retrieveGlobalOptionSetOptionsMetaData(globalOptionSetMetaDataId);

    initiateSearchPage();
});

function isSearchCriteriaContainsData(isOrgSearch) {
    objTextData = {
        txtLastOrgName: $('#txtLastOrgName').val(),
        txtFirstName: $('#txtFirstName').val(),
        txtMiddleName: $('#txtMiddleName').val(),
        txtStreet1: $('#txtStreet1').val(),
        txtCity: $('#txtCity').val(),
        txtStateProvince: $('#txtStateProvince').val(),
        txtZip: $('#txtZip').val(),
        txtPrimaryId: $('#txtPrimaryId').val(),
        txtAlternateId: $('#txtAlternateId').val(),
        txtCountry: $("#ddlCountry option:selected").text()
    };
    if (isOrgSearch) {
        if (objTextData.txtLastOrgName != "" || objTextData.txtStreet1 != "" ||
		objTextData.txtCity != "" || objTextData.txtStateProvince != "" ||
		objTextData.txtZip != "" || objTextData.txtCountry != "")
            return true;
    }
    else {
        if (objTextData.txtFirstName != "" || objTextData.txtMiddleName != "" ||
	    objTextData.txtLastOrgName != "" || objTextData.txtStreet1 != "" ||
		objTextData.txtCity != "" || objTextData.txtStateProvince != "" ||
		objTextData.txtZip != "" || objTextData.txtCountry != "")
            return true;
    }
    return false;
}

function onSearchBtnClk() {
    OrganisationChkBox = $('#chkOrganization').is(':checked');
    PersonChkBox = $('#chkPerson').is(':checked');
    IsRunOnce = false;
    TotalRecordCount = null;
    AccountPageSizeArray = [];
    ContactPageSizeArray = [];

    if (!OrganisationChkBox && !PersonChkBox) {
        alert("Please select atleast one checkbox");
        return false;
    }
    if (OrganisationChkBox && PersonChkBox && isSearchCriteriaContainsData(true))
        IsOrgDataRetrievalReq = true;
    else
        IsOrgDataRetrievalReq = false;

    if (OrganisationChkBox && !PersonChkBox) {
        if (!isSearchCriteriaContainsData(true)) {
            alert("Please enter search crieteria for Organisation");
            return false;
        }
        else {
            IsOrgDataRetrievalReq = true;
            createSearchGrid();

            clearSearchGrid();

            setGridHeight();

            loadRecordsDelayed();

        }
    }
    else {
        if (isSearchCriteriaContainsData(false)) {
            createSearchGrid();

            clearSearchGrid();

            setGridHeight();

            loadRecordsDelayed();
        }
        else
            alert("Search criteria is empty!");
    }
}

function loadRecordsDelayed() {
    if (SearchGrid != null) {
        SearchGrid.clear();
    }

    SearchGrid.showLoader("Processing...");

    setTimeout(loadRecords, 300);
}

function loadRecords() {
    AllRecords = [];
    SearchGrid.showLoader("Processing...");

    populateRecords();

    showEmptyMessage();

    SearchGrid.hideLoader();
}

function initiateSearchPage() {
    $("#btnSearch").on("click", onSearchBtnClk);
}

function showEmptyMessage() {
    if (AllRecords.length >= 1) {
        SearchGrid.hideMessage();
    } else {
        SearchGrid.showMessage('No match found.');
    }
}

function ClassProduct(recordId, fullName, country, city, postalCode, street1, province) {
    this.RecordId = recordId;
    this.FullName = fullName;
    this.PostalCode = postalCode;
    this.Street1 = street1;
    this.Province = province;
    this.Country = country;
    this.City = city;
}

function addSearchedRecordsToMainDataContainer(isOrganisation, isBothCheckBoxesChecked) {

    GridDataRowsCollection = [];
    for (var counter = 0; counter < AllRecords.length; counter++) {
        var users = AllRecords[counter];

        var row = SearchGrid.newRow();
        if (isOrganisation)
            row.set(GRID_PRIMARY_ACC_COLUMN, users.RecordId);
        else
            row.set(GRID_PRIMARY_CONT_COLUMN, users.RecordId);

        row.set("FullName", nullToBlank(users.FullName));
        row.set("Address1_PostalCode", nullToBlank(users.PostalCode));
        row.set("Address1_Line1", nullToBlank(users.Street1));
        row.set("Address1_StateOrProvince", nullToBlank(users.Province));
        row.set("Address1_Country", nullToBlank(users.Country));
        row.set("Address1_City", nullToBlank(users.City));

        GridDataRowsCollection.push(row);
    }

    if (TotalRecordCount == null) {
        if (!isBothCheckBoxesChecked) {
            TotalRecordCount = isOrganisation ? getAccountTotalRowsCount() : getContactTotalRowsCount();
        }
    }

    SearchGrid.totalRecords(TotalRecordCount);

    this.loadGrid();
    SearchGrid.hideLoader();
}

function loadGrid() {
    SearchGrid.clear();

    var nStart = GridCurrentPageNumber * PAGESIZE;
    var nEnd = nStart + PAGESIZE;

    if (nEnd > TotalRecordCount) {
        nEnd = TotalRecordCount;
    }

    SearchGrid.addRow(GridDataRowsCollection);

    SearchGrid.pageNextEnabled(nEnd < TotalRecordCount);
}

function clearSearchGrid() {
    SearchGrid.hideMessage();
    SearchGrid.clear();
    SearchGrid.totalRecords(0);
    SearchGrid.pageNextEnabled(false);
    SearchGrid.setPage(1);
    GridCurrentPageNumber = 0;
    TotalRecordCount = null;
}

// Creates and Initializes the address grid.
function createSearchGrid() {
    // Create the grid.
    var opts = new Object();
    opts.columns =
    [
        {
            name: GRID_PRIMARY_ACC_COLUMN,
            visible: false,
            dataType: "String"
        },
        {
            name: GRID_PRIMARY_CONT_COLUMN,
            visible: false,
            dataType: "String"
        },
        {
            name: "FullName",
            display: "Full Name",
            width: 130,
            dataType: "String"
        },
        {
            name: "PrimaryID",
            display: "Primary ID",
            width: 120,
            dataType: "String"
        },
        {
            name: "PrimaryConstAffiliation",
            display: "Primary Constituent Affiliation",
            width: 180,
            dataType: "String"
        },
        {
            name: "PersonStatus",
            display: "Person Status",
            width: 100,
            dataType: "String"
        },
        {
            name: "Address1_Line1",
            display: "Address 1: Street 1",
            width: 110,
            dataType: "String"
        },
        {
            name: "Address1_City",
            display: "Address 1: City",
            width: 100,
            dataType: "String"
        },
        {
            name: "Address1_StateOrProvince",
            display: "Address 1: State/Province",
            width: 150,
            dataType: "String"
        },
        {
            name: "Address1_PostalCode",
            display: "Address 1: ZIP/Postal Code",
            width: 150,
            dataType: "String"
        },
        {
            name: "Address1_Country",
            display: "Address 1: Country",
            width: 120,
            dataType: "String"
        }
    ];

    opts.paging =
    {
        pagingEnabled: true,
        pageNext: onNextPage,
        pagePrev: onPrevPage,
        pageFirst: onFirstPage,
        pageSize: PAGESIZE
    };

    opts.refreshEnabled = false;
    opts.allowSorting = false;
    opts.currencySymbol = CurrencySymbol;

    SearchGrid = new po.DataGrid($("#divResultsGrid"), opts);
}

// Shows an error message, or hides it (if strMsg is null).
function showInAlertBar(strMsg, strType) {
    $("#spanAlertMessage").text(strMsg);
    if (strMsg != null) {
        var img =
          (strType == "error" ? "../po_/Images/Error.png" :
          (strType == "warning" ? "../msdyn_/Controls/ExtJS/css/images/window/toast/icon16_info.png" :
          "../po_/Images/Info.png"));
        $("#imgAlert").attr("src", img);
        $("#divAlert").show();
        $("#divAlert span").html(strMsg);
    }
    else {
        $("#divAlert").hide();
    }

}

function setGridHeight() {
    $("#divResultsGrid").css("height", "50%");
}

/*---------------------------------------------------------------------------------------------
Paging
----------------------------------------------------------------------------------------------*/

function onNextPage() {
	IsFromBackButton=false;
    GridCurrentPageNumber++;
    loadRecordsDelayed();
}

// Returns the grid to the previous page.
function onPrevPage() {
    if (GridCurrentPageNumber > 0) {
        GridCurrentPageNumber--;
    }
	IsFromBackButton = true;
    loadRecordsDelayed();
}

// Returns the grid to the first page.
function onFirstPage() {
    GridCurrentPageNumber = 0;
	IsFromBackButton = false;
    loadRecordsDelayed();
}

/*-----------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------*/
var IsRunOnce = false;
var AccountPageSizeArray = [];
var ContactPageSizeArray = [];
var AlreadyAddedContactIds = [];
var RecordsExempted = 0;
var MaxPageSize = 25;
var IsFromBackButton = false;
var JsonString = '';

function populatePageSizeArray(entityRecordsCount, tempPageSizeDiv) {
    var calcRemainder = 0;
    var loopTotalCount = 0;
    var pageSizeArray = [];


    if (entityRecordsCount >= MaxPageSize) {
        calcRemainder = entityRecordsCount % MaxPageSize;
        loopTotalCount = (calcRemainder > 0 ? (tempPageSizeDiv - 1 !== 0 ? tempPageSizeDiv - 1 : tempPageSizeDiv) : tempPageSizeDiv);
        arrayItem = (entityRecordsCount - calcRemainder) / loopTotalCount;
    }
    else {
        calcRemainder = 0;
        loopTotalCount = tempPageSizeDiv;
        arrayItem = entityRecordsCount;
    }

    for (var i = 0; i < loopTotalCount; i++) {
        pageSizeArray[i] = arrayItem;
    }
    calcRemainder > 0 ? pageSizeArray.push(calcRemainder) : "";

    return pageSizeArray;
}

function getPageSizeArray(entityRecordsCount) {
    var tempPageSizeDiv = 8;
    var pageSizeArray = [];

    entityRecordsCount = entityRecordsCount > 200 ? 200 : entityRecordsCount;

    if (entityRecordsCount > 175 && entityRecordsCount <= 200) {
        pageSizeArray = populatePageSizeArray(entityRecordsCount, tempPageSizeDiv);
    }
    else if (entityRecordsCount > 150 && entityRecordsCount <= 175) {
        pageSizeArray = populatePageSizeArray(entityRecordsCount, tempPageSizeDiv - 1);
    }
    else if (entityRecordsCount > 125 && entityRecordsCount <= 150) {
        pageSizeArray = populatePageSizeArray(entityRecordsCount, tempPageSizeDiv - 2);
    }
    else if (entityRecordsCount > 100 && entityRecordsCount <= 125) {
        pageSizeArray = populatePageSizeArray(entityRecordsCount, tempPageSizeDiv - 3);
    }
    else if (entityRecordsCount > 75 && entityRecordsCount <= 100) {
        pageSizeArray = populatePageSizeArray(entityRecordsCount, tempPageSizeDiv - 4);
    }
    else if (entityRecordsCount > 50 && entityRecordsCount <= 75) {
        pageSizeArray = populatePageSizeArray(entityRecordsCount, tempPageSizeDiv - 5);
    }
    else if (entityRecordsCount > 25 && entityRecordsCount <= 50) {
        pageSizeArray = populatePageSizeArray(entityRecordsCount, tempPageSizeDiv - 6);
    }
    else if (entityRecordsCount > 0 && entityRecordsCount <= 25) {
        pageSizeArray = populatePageSizeArray(entityRecordsCount, tempPageSizeDiv - 7);
    }
    return pageSizeArray;
}

function populateRecords() {
    try {
        SearchGrid.hideMessage();
        SearchGrid.showLoader("Processing...");

        var fetchXml = "";
        var contactRecordsCount = 0;
        var accountRecordsCount = 0;
        var totalRecordsCount = 0;
        PAGESIZE = 10;
        showInAlertBar(null, '');

        if (PersonChkBox && OrganisationChkBox && IsOrgDataRetrievalReq) {
            if (!IsRunOnce) {
                SearchGrid.pageSize(MaxPageSize);
                accountRecordsCount = getAccountTotalRowsCount();
                contactRecordsCount = getContactTotalRowsCount();
                totalRecordsCount = accountRecordsCount + contactRecordsCount;
                TotalRecordCount = totalRecordsCount > 400? 400 : totalRecordsCount;

                if (totalRecordsCount > 400)
                    showInAlertBar("This search contains so many records. Please search individually for Person/Orgranisation or change the search criteria.", 'warning');

                if (accountRecordsCount > 0)
                    AccountPageSizeArray = getPageSizeArray(accountRecordsCount);

                if (contactRecordsCount > 0)
                    ContactPageSizeArray = getPageSizeArray(contactRecordsCount);

                IsRunOnce = true;
            }
            var accArrLength = AccountPageSizeArray.length;
            var conArrLength = ContactPageSizeArray.length;
            var totalArrLength = accArrLength + conArrLength;
            PAGESIZE = MaxPageSize;//AccountPageSizeArray[GridCurrentPageNumber];

            if (accArrLength > 0 && GridCurrentPageNumber < accArrLength) {
                addAccountDataToGrid(true);
                if (GridCurrentPageNumber == (accArrLength - 1)) {
                    PAGESIZE = MaxPageSize - AccountPageSizeArray[GridCurrentPageNumber];
                    RecordsExempted = PAGESIZE;
					if(RecordsExempted > 0)
						addContactDataToGrid(0, true, false, false);
                }
            }
            if (conArrLength > 0 && GridCurrentPageNumber >= accArrLength && GridCurrentPageNumber < totalArrLength) {
                PAGESIZE = MaxPageSize;
				var isPrevButtonClicked = IsFromBackButton;
                addContactDataToGrid(GridCurrentPageNumber - accArrLength, true, true, isPrevButtonClicked);
            }
            return;
        }
        if (OrganisationChkBox && IsOrgDataRetrievalReq) {
            accountRecordsCount = getAccountTotalRowsCount();
            addAccountDataToGrid(false);
            return;
        }
        if (PersonChkBox) {
            contactRecordsCount = getContactTotalRowsCount();
            addContactDataToGrid(null, false, false, false);
            return;
        }
    } catch (e) {
        SearchGrid.hideLoader();
    }
}

function addAccountDataToGrid(isBothCheckBoxesChecked) {
    var fetchResult = getAccountFetchXml();
    if (fetchResult != null) {
        for (var row = 0; row < fetchResult.length; row++) {
            var dataRow = fetchResult[row];

            if (dataRow != null) {
                addToRecordsArray(dataRow, true);
            }
            addSearchedRecordsToMainDataContainer(true, isBothCheckBoxesChecked);
        }
    }
}

function addContactDataToGrid(resetCounter,isRequireAddToList, isRequireAddToFilter, isPrevButtonClicked) {
    var fetchResult = getContactFetchXml(resetCounter, isRequireAddToFilter, isPrevButtonClicked);
    AlreadyAddedContactIds = [];
    if (fetchResult != null) {
        for (var row = 0; row < fetchResult.length; row++) {
            var dataRow = fetchResult[row];

            if (dataRow != null) {
                if (isRequireAddToList && row < RecordsExempted) {
                    AlreadyAddedContactIds.push(dataRow.Attributes['contactid'].Value);
                }

                addToRecordsArray(dataRow, false);
            }
            addSearchedRecordsToMainDataContainer(false, false);
        }
		
		if(isRequireAddToList){
			addToJsonList();
		}
    }
}

function addToJsonList() {
	var arrString = '';
	var pageCount = GridCurrentPageNumber + 1;
	if(!isAlreadyExist()){
		if(AlreadyAddedContactIds.length > 0){
			for(var i=0; i < AlreadyAddedContactIds.length; i++){
				arrString += (i==(AlreadyAddedContactIds.length - 1)) ? AlreadyAddedContactIds[i] : AlreadyAddedContactIds[i]+',';
			}
		}
		JsonString += JsonString == '' ? (pageCount + '$' + arrString) : ('|' + pageCount + '$' + arrString);	
	}
}

function isAlreadyExist(){
	if(JsonString!=''){
		var jsonStringArr = JsonString.split('|');
		if(jsonStringArr != null && jsonStringArr.length > 0){
			
			for(var i = 0; i < jsonStringArr.length; i++){
				var item = jsonStringArr[i];
				var splitItem = item.split('$');
				
				if(splitItem != null && splitItem.length > 0){
					var firstSplitElement = splitItem[0];
					if(firstSplitElement != null && firstSplitElement != '' && firstSplitElement == (GridCurrentPageNumber + 1)){
						return true;
					}
				}
			}
		}
	}
	return false;
}

function getContactFetchXml(resetCounter, isRequireAddToFilter, isPrevButtonClicked) {
    var filterCondition = '';
    IncrementedValue = 0;
    var pageCounter = resetCounter != null ? resetCounter : GridCurrentPageNumber;
	var isNeedToAppendLastName = (OrganisationChkBox && PersonChkBox && returnFilterCondition(objTextData.txtLastOrgName, 'lastname') != "");

    var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false' page='" + (pageCounter + 1) + "' count='" + PAGESIZE + "' returntotalrecordcount='true'>" +
    			   "<entity name='contact'>" +
                        "<attribute name='contactid' />" +
                        "<attribute name='fullname' />" +
                        "<attribute name='address1_postalcode' />" +
                        "<attribute name='address1_line1' />" +
                        "<attribute name='address1_stateorprovince' />" +
                        "<attribute name='address1_country' />" +
                        "<attribute name='address1_city' />" +
                        "<order attribute='fullname' descending='false' />" +
                        "<filter type='and'>";

    if (objTextData != null) {
        filterCondition += returnFilterCondition(objTextData.txtFirstName, 'firstname');
        filterCondition += returnFilterCondition(objTextData.txtMiddleName, 'middlename');
		
		if(IncrementedValue > 1 && isNeedToAppendLastName)
			filterCondition += '';
		else
			filterCondition += returnFilterCondition(objTextData.txtLastOrgName, 'lastname');
        
		filterCondition += returnFilterCondition(objTextData.txtCity, 'address1_city');
        filterCondition += returnFilterCondition(objTextData.txtStateProvince, 'address1_stateorprovince');
        filterCondition += returnFilterCondition(objTextData.txtStreet1, 'address1_line1');
        filterCondition += returnFilterCondition(objTextData.txtZip, 'address1_postalcode');
        filterCondition += returnFilterCondition(objTextData.txtCountry, 'address1_country');
    }
    if (IncrementedValue > 1) {
        if (isNeedToAppendLastName) {
           fetchXml += "<filter type='or'>";
        }
			fetchXml += "<filter type='and'>";
			fetchXml += filterCondition;
			fetchXml += "</filter>";
			
		if (isNeedToAppendLastName) {		
			fetchXml += returnFilterCondition(objTextData.txtLastOrgName, 'lastname');
			fetchXml += "</filter>";
		}
	}
    else
        fetchXml += filterCondition;

    var exemptedContacts = "";
    if (isRequireAddToFilter && AlreadyAddedContactIds.length > 0 && !isPrevButtonClicked) {
        for (var i = 0; i < RecordsExempted; i++) {
            exemptedContacts += "<condition attribute='contactid' operator='ne' value='" + AlreadyAddedContactIds[i] + "' />";
        }
    }
	
	if(isPrevButtonClicked && JsonString != ''){
		    exemptedContacts='';
			var jsonStringArr = JsonString.split('|');
			if(jsonStringArr != null && jsonStringArr.length > 0){
				
				for(var i = 0; i < jsonStringArr.length; i++){
					var item = jsonStringArr[i];
					var splitItem = item.split('$');
					
					if(splitItem != null && splitItem.length > 0){
						var firstSplitElement = splitItem[0];
						var nextSplitElement = splitItem[1];
						if(firstSplitElement != null && firstSplitElement != '' && firstSplitElement == GridCurrentPageNumber){
							if(nextSplitElement !=null && nextSplitElement != ''){
								var arrEle=nextSplitElement.split(',');
								if(arrEle!=null && arrEle!='' && arrEle.length>0)
									for(var i=0;i<arrEle.length;i++){
                        				exemptedContacts += "<condition attribute='contactid' operator='ne' value='" + arrEle[i] + "' />";
									}
							}
						}
					}
				}
			}
	}
	
    if (exemptedContacts != "") {
        fetchXml += exemptedContacts;
    }

    fetchXml += "<condition attribute='statecode' operator='eq' value='0' />" +
                        "</filter>" +
                        "</entity>" +
                    "</fetch>";
    FetchXmlResult = null;

    getData(fetchXml);

    if (FetchXmlResult != null && FetchXmlResult.length > 0) {
        return FetchXmlResult;
    }
    return null;
}

function getAccountFetchXml() {
    var filterCondition = '';
    IncrementedValue = 0;

    var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false' page='" + (GridCurrentPageNumber + 1) + "' count='" + PAGESIZE + "' returntotalrecordcount='true'>" +
                     "<entity name='account'>" +
                        "<attribute name='accountid' />" +
                        "<attribute name='name' />" +
                        "<attribute name='address1_postalcode' />" +
                        "<attribute name='address1_line1' />" +
                        "<attribute name='address1_stateorprovince' />" +
                        "<attribute name='address1_country' />" +
                        "<attribute name='address1_city' />" +
                        "<order attribute='name' descending='false' />" +
                "<filter type='and'>";

    if (objTextData != null) {
        filterCondition += returnFilterCondition(objTextData.txtLastOrgName, 'name');
        filterCondition += returnFilterCondition(objTextData.txtCity, 'address1_city');
        filterCondition += returnFilterCondition(objTextData.txtStateProvince, 'address1_stateorprovince');
        filterCondition += returnFilterCondition(objTextData.txtStreet1, 'address1_line1');
        filterCondition += returnFilterCondition(objTextData.txtZip, 'address1_postalcode');
        filterCondition += returnFilterCondition(objTextData.txtCountry, 'address1_country');
    }
    if (IncrementedValue > 1) {
        fetchXml += "<filter type='and'>";
        fetchXml += filterCondition;
        fetchXml += "</filter>";
    }
    else
        fetchXml += filterCondition;

    fetchXml += "<condition attribute='statecode' operator='eq' value='0' />" +
                        "</filter>" +
                        "</entity>" +
                    "</fetch>";
    FetchXmlResult = null;

    getData(fetchXml);

    if (FetchXmlResult != null && FetchXmlResult.length > 0) {
        return FetchXmlResult;
    }
    return null;
}

function getContactTotalRowsCount() {
    try {
        var filterCondition = '';
        IncrementedValue = 0;
        var rowCount = 0;

        var fetchXml = "<fetch mapping='logical' distinct='false' aggregate='true'>" +
                            "<entity name='contact'>" +
                                    "<attribute name='contactid'  alias='recordcount' aggregate='count' />" +
                                    "<filter type='and'>";

        if (objTextData != null) {
            filterCondition += returnFilterCondition(objTextData.txtFirstName, 'firstname');
            filterCondition += returnFilterCondition(objTextData.txtMiddleName, 'middlename');
            filterCondition += returnFilterCondition(objTextData.txtLastOrgName, 'lastname');
            filterCondition += returnFilterCondition(objTextData.txtCity, 'address1_city');
            filterCondition += returnFilterCondition(objTextData.txtStateProvince, 'address1_stateorprovince');
            filterCondition += returnFilterCondition(objTextData.txtStreet1, 'address1_line1');
            filterCondition += returnFilterCondition(objTextData.txtZip, 'address1_postalcode');
            filterCondition += returnFilterCondition(objTextData.txtCountry, 'address1_country');
        }
        if (IncrementedValue > 1) {
            fetchXml += "<filter type='and'>";
            fetchXml += filterCondition;
            fetchXml += "</filter>";
        }
        else
            fetchXml += filterCondition;


        fetchXml += "<condition attribute='statecode' operator='eq' value='0' />" +
                            "</filter>" +
                            "</entity>" +
                        "</fetch>";
        FetchXmlResult = null;

        getData(fetchXml);

        if (FetchXmlResult != null && FetchXmlResult.length > 0) {
            rowCount = convertToInt(FetchXmlResult[0].Attributes.recordcount.Value);
        }

        return rowCount;

    } catch (e) {
        alert("Error while populating list, " + e.message);
        SearchGrid.hideLoader();
        return 0;
    }
}

function getAccountTotalRowsCount() {
    try {
        var filterCondition = '';
        IncrementedValue = 0;
        var rowCount = 0;

        var fetchXml = "<fetch mapping='logical' distinct='false' aggregate='true'>" +
                            "<entity name='account'>" +
                                    "<attribute name='accountid' alias='recordcount' aggregate='count' />" +
                                    "<filter type='and'>";

        if (objTextData != null) {
            filterCondition += returnFilterCondition(objTextData.txtLastOrgName, 'name');
            filterCondition += returnFilterCondition(objTextData.txtCity, 'address1_city');
            filterCondition += returnFilterCondition(objTextData.txtStateProvince, 'address1_stateorprovince');
            filterCondition += returnFilterCondition(objTextData.txtStreet1, 'address1_line1');
            filterCondition += returnFilterCondition(objTextData.txtZip, 'address1_postalcode');
            filterCondition += returnFilterCondition(objTextData.txtCountry, 'address1_country');
        }
        if (IncrementedValue > 1) {
            fetchXml += "<filter type='and'>";
            fetchXml += filterCondition;
            fetchXml += "</filter>";
        }
        else
            fetchXml += filterCondition;


        fetchXml += "<condition attribute='statecode' operator='eq' value='0' />" +
                            "</filter>" +
                            "</entity>" +
                        "</fetch>";
        FetchXmlResult = null;

        getData(fetchXml);

        if (FetchXmlResult != null && FetchXmlResult.length > 0) {
            rowCount = convertToInt(FetchXmlResult[0].Attributes.recordcount.Value);
        }

        return rowCount;

    } catch (e) {
        alert("Error while populating list, " + e.message);
        SearchGrid.hideLoader();
        return 0;
    }
}

function returnFilterCondition(objProp, attrName) {
    if (objProp != "") {
        IncrementedValue++;
        return "<condition attribute='" + attrName + "' operator='like' value='%" + objProp + "%' />"
    }
    return "";
}

function addToRecordsArray(record, isOrganisation) {
    var recordId = "";
    var fullName = "";

    if (isOrganisation) {
        recordId = nullToBlank(record.Attributes['accountid'].Value);
        fullName = nullToBlank(record.Attributes['name'].Value);
    }
    else {
        recordId = nullToBlank(record.Attributes['contactid'].Value);
        fullName = nullToBlank(record.Attributes['fullname'].Value);
    }

    var country = nullToBlank(record.Attributes['address1_country'] != null ? record.Attributes['address1_country'].Value : null);
    var city = nullToBlank(record.Attributes['address1_city'] != null ? record.Attributes['address1_city'].Value : null);
    var postalCode = nullToBlank(record.Attributes['address1_postalcode'] != null ? record.Attributes['address1_postalcode'].Value : null);
    var street1 = nullToBlank(record.Attributes['address1_line1'] != null ? record.Attributes['address1_line1'].Value : null);
    var province = nullToBlank(record.Attributes['address1_stateorprovince'] != null ? record.Attributes['address1_stateorprovince'].Value : null);

    var rec = new ClassProduct(recordId, fullName, country, city, postalCode, street1, province);
    AllRecords.push(rec);
}

function nullToBlank(strIn) {
    return strIn == null ? "" : strIn;
}

function convertToInt(strDecimal) {
    if (isNumeric(strDecimal) == false) {
        return 0;
    }

    return parseInt(strDecimal);
}

function isNumeric(input) {
    var RE = /^-{0,1}\d*\.{0,1}\d+$/;
    return (RE.test(input));
}

function retrieveGlobalOptionSetMetaDataId(OptionSetSchemaName) {

    var globalOptionSetMetaDataId = null;

    var context = parent.Xrm.Page.context;

    var webapiQuery = context.getClientUrl() + "/api/data/v8.0/GlobalOptionSetDefinitions?$select=Name";

    var service = new XMLHttpRequest();

    service.open("GET", webapiQuery, false);

    service.setRequestHeader("Accept", "application/json");

    service.setRequestHeader("Content-Type", "application/json; charset=utf-8");

    service.setRequestHeader("OData-MaxVersion", "4.0");

    service.setRequestHeader("OData-Version", "4.0");

    service.send();

    if (service.readyState == 4 /* complete */) {
        if (service.status == 201 || service.status == 200) {
            var RetrieveService = eval('(' + service.responseText + ')');
            if (RetrieveService.value.length > 0) {
                for (var i = 0; i < RetrieveService.value.length; i++) {
                    if (RetrieveService.value[i].Name == OptionSetSchemaName) {
                        globalOptionSetMetaDataId = RetrieveService.value[i].MetadataId;
                        break;
                    }
                }
            }
        }
    }
    return globalOptionSetMetaDataId;
}

function retrieveGlobalOptionSetOptionsMetaData(optionSetMetaDataId) {
    var context = parent.Xrm.Page.context;

    var webapiQuery = context.getClientUrl() + "/api/data/v8.0/GlobalOptionSetDefinitions(" + optionSetMetaDataId + ")";

    var service = new XMLHttpRequest();

    service.open("GET", webapiQuery, false);

    service.setRequestHeader("Accept", "application/json");

    service.setRequestHeader("Content-Type", "application/json; charset=utf-8");

    service.setRequestHeader("OData-MaxVersion", "4.0");

    service.setRequestHeader("OData-Version", "4.0");

    service.send();

    if (service.readyState == 4 /* complete */) {
        if (service.status == 201 || service.status == 200) {
            var RetrieveService = eval('(' + service.responseText + ')');
            if (RetrieveService.Options.length > 0) {
                var options = "<option value='0'></option>";
                for (var i = 0; i < RetrieveService.Options.length; i++) {
                    var optionLabel = RetrieveService.Options[i].Label.UserLocalizedLabel.Label;
                    var optionValue = RetrieveService.Options[i].Value;
                    options += "<option value='" + optionValue + "'>" + optionLabel + "</option>";
                }
                $("#ddlCountry").html(options);
            }
        }
    }
}
