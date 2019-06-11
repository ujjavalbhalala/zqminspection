sap.ui.define(function() {
	"use strict";

	return {

		generateSearchDialog: function(that) {
			var oInspContext = that.oDataModel.createEntry("/InspectionLotSet");
			that.byId("idSearchInspForm").setBindingContext(oInspContext);

			//Set default Date range
			var today = new Date();
			var lastWeekDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
			that.byId("idSrchCreatedOn").setDateValue(lastWeekDate);
			that.byId("idSrchCreatedOn").setSecondDateValue(today);

			that.byId("idSrchInspectionType").fireLoadItems();

			that._oSearchInspection.open();
		},
		getSampleType: function(oEvent) {
			this.oJsModel.setProperty("/SamplTypeList", []);
			var that = this;
			this.oDataModel.read("/InspectionTypeMaterialSet", {
				success: function(oData) {
					var aSampleTypeList = JSON.parse(JSON.stringify(oData.results));
					aSampleTypeList.splice(0, 0, {
						InspectionType: "",
						InspectionTypeText: ""
					});
					that.oJsModel.setProperty("/SamplTypeList", aSampleTypeList);
				}
			});
		},
		onSearchInspectionLot: function(oEvent) {
			this.oJsModel.setProperty("/SearchItems", []);
			var oselectedItem = this.byId("idSrchInspectionType").getSelectedItem();

			var sInspLot = this.byId("idSrchInspectionLot").getValue(),
				sInspType = oselectedItem ? oselectedItem.getKey() : "",
				sPlant = this.byId("idSrchPlant").getValue(),
				sMaterial = this.byId("idSrchMaterial").getValue(),
				sBatch = this.byId("idSrchBatch").getValue(),
				sVariety = this.byId("idSrchVariety").getValue(),
				sDelivery = this.byId("idSrchDelivery").getValue(),
				sVendor = this.byId("idSrchVendor").getValue(),
				sCustomer = this.byId("idSrchCustomer").getValue(),
				sManufacturer = this.byId("idSrchManufacturer").getValue(),
				sUDSelection = this.byId("idUDSelection").getSelectedItem().getKey();

			if (sInspLot === "" && sInspType === "" && sMaterial === "" && sBatch === "" &&
				sDelivery === "" && sVendor === "" && sCustomer === "" &&
				sPlant === "") {
				//Atleast plant should have value to avoid large list
				this.showErrorMessage("Please Enter Plant");
				return false;
			}

			var frmDate = this.util.getJSONDate(this.byId("idSrchCreatedOn").getFrom());
			var toDate = this.util.getJSONDate(this.byId("idSrchCreatedOn").getTo());
			var filterString = "InspectionType eq '" + sInspType +
				"' and InspLotNo eq '" + sInspLot +
				"' and Plant eq '" + sPlant +
				"' and Material eq '" + sMaterial +
				"' and Batch eq '" + sBatch +
				"' and Variety eq '" + sVariety +
				"' and Delivery eq '" + sDelivery +
				"' and Vendor eq '" + sVendor +
				"' and Customer eq '" + sCustomer +
				"' and Manufacturer eq '" + sManufacturer +
				"' and UDSelection eq '" + sUDSelection +
				"'";
			if (frmDate) {
				filterString = filterString + " and (Create_date ge datetime'" + frmDate + "' and Create_date le datetime'" + toDate + "')";
			}

			var that = this;
			this.oDataModel.read("/InspectionLotSet", {
				urlParameters: {
					$filter: filterString
				},
				success: function(oData) {
					// Bind table
					that.oJsModel.setProperty("/SearchItems", oData.results);
					that.byId("idSrchParam").setExpanded(false);
					that.byId("idSrchResult").setExpanded(true);
				},
				error: function(e) {
					that.oDataModel.fireBatchRequestFailed();
				}
			});

			return true;

		},
		onSearchItemPress: function(oEvent) {

			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var sPath = oItem.getBindingContextPath();
			var oSrchItem = this.oJsModel.getProperty(sPath);

			if (oSrchItem.InspLotNo !== "") {
				// Call subroutine to get charact of search item
				this.oJsModel.setProperty("/Lot", oSrchItem);
				this.oJsModel.setProperty("/LotFound", true);
				this.byId("idHeaderForm").bindElement("data>/Lot/");
				this.readInspectionCharacteristics(oSrchItem.InspLotNo);
				this._oSearchInspection.close();
			}

			return true;
		},
		onBackDialog: function(oEvent) {
			this._oSearchInspection.close();
		}

	};
});