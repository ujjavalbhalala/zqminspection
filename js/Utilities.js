sap.ui.define(function() {
	"use strict";

	// class providing static utility methods to retrieve entity default values.

	return {

		getJSONDate: function(sValue) {
			if (sValue) {
				var dateString = sValue.toString();
				dateString = dateString.substring(0, 25) + "UTC";
				//var newDateTime = new Date(sValue);
				var newDateTime = new Date(dateString);
				return newDateTime.toJSON().slice(0, -1);
			}
		},
		getOuterLayout: function(sInspectionMethod) {
			//return sInspectionMethod === "V" ? new sap.ui.layout.HorizontalLayout() : new sap.ui.layout.VerticalLayout();
			return sInspectionMethod !== "V" ? new sap.m.HBox() : new sap.m.VBox();
		},
		getInnerLayout: function(sInspectionMethod) {
			//return sInspectionMethod === "V" ? new sap.ui.layout.VerticalLayout() : new sap.ui.layout.HorizontalLayout();
			return sInspectionMethod !== "V" ? new sap.m.VBox() : new sap.m.HBox();
		},
		getInspectionMethod: function(aChar) {
			var size = 0;
			var aCharGrouped = this.util.groupBy(aChar, "InspChar");
			for (var item in aCharGrouped) {
				size++;
			}
			return size > 6 ? "V" : "H";
		},
		convertJSONtoArray:function(oGroupedObject){
			var arr = [];
			for (var item in oGroupedObject) {
				arr.push(oGroupedObject[item]);
			}
			return arr;
		},
		ValidateNumberInput: function(oEvent) {
			var sNumber = "";
			var value = oEvent.getSource().getValue();
			var bNotnumber = isNaN(value);
			if (bNotnumber === false) {
				sNumber = value;
			} else {
				oEvent.getSource().setValue(sNumber);
			}
		},
		getInspectionType: function(oValue) {
			var aSampleList = this.oJsModel.getProperty("/SamplTypeList");
			for (var i = 0; i < aSampleList.length; i++) {
				if (aSampleList[i].InspectionType === oValue) {
					oValue = aSampleList[i].InspectionTypeText;
					break;
				}
			}
			return oValue;
		},
		formatTitle: function(oLot) {
			var oTitle = "";
			if (oLot && oLot !== "") {
				oTitle = "Inspection Lot: " + oLot;
			}
			return oTitle;
		},
		getHeaderFormVisibility: function(oLot) {
			var oFlag = false;
			if (oLot && oLot !== "") {
				oFlag = true;
			}
			return oFlag;
		},
		isAverageVisible: function(sPath, nSize) {
			return nSize > 0 ? sPath : "";
		},
		getDeviceTypeMessage: function(oValue) {
			var device = sap.ui.Device.system;
			var type = "";
			if (device.combi === true) {
				type = "combi";
			} else if (device.desktop === true) {
				type = "desktop";
			} else if (device.phone === true) {
				type = "phone";
			} else if (device.tablet === true) {
				type = "tablet";
			}
			return "App is running in " + type + " mode";
		},

		groupBy: function(xs, key) {
			//sample call: 	var b = groupBy(array, "PropertyKey");
			return xs.reduce(function(rv, x) {
				(rv[x[key]] = rv[x[key]] || []).push(x);
				return rv;
			}, {});
		},
		getUnique: function(items, propertyName) {
			//sample call: 	var b = groupBy(array, "PropertyKey");
			var resultkey = [],
				results = [];
			$.each(items, function(index, item) {
				if ($.inArray(item[propertyName], resultkey) == -1) {
					resultkey.push(item[propertyName]);
					results.push(item);
				}
			});
			return results;

		},
		setSelectKey: function(oControl, sKey) {
			oControl.setSelectedKey(sKey);
			oControl.fireChange({
				selectedItem: oControl.getSelectedItem()
			});

		},
		getHeaderFieldVisibility: function(oValue) {
			if (isNaN(parseInt(oValue)) !== true) {
				return oValue !== 0 ? true : false;
			} else {
				return false;
			}
		},
		onChangeQualAttribute: function(oEvent) {
			//debugger;
			var oItem = oEvent.getSource().getSelectedItem().getBinding("key").getContext().getProperty();
			var sPath = oEvent.getSource().getBinding("selectedKey").getPath();
			sPath = sPath.substring(0, sPath.lastIndexOf("/"));
			this.oJsModel.setProperty(sPath + "/Code", oItem.Code);
			this.oJsModel.setProperty(sPath + "/CodeGroup", oItem.CodeGroup);
		}

	};
});