sap.ui.define(function() {
	"use strict";

	// class providing static utility methods to retrieve entity default values.

	return {

		buildHoriozontalControls: function(sPath, oOperation) {

			var oLot = this.oJsModel.getProperty("/Lot");
			var oFlagEditInput = oLot.UDMade === "" ? true : false;

			var onChangeResultValue = function(oControlEvent, oInputField) {
				var sKey = oInputField.getParent().getParent().getParent().getParent().getKey();
				var sInpPath = this.getBindingPathfromKey(sKey);
				var oInpOperation = this.oJsModel.getProperty(sInpPath);
				var aChar = oInpOperation.OperationtoInspCharacteristic.results;
				this.calculateAverage(oInpOperation.OperationNo, aChar);

				if (document.activeElement === oInputField.getFocusDomRef()) {
					this.moveToNextInput();
				}

			};

			var aChar = oOperation.OperationtoInspCharacteristic.results;
			var aQuantChar = aChar.filter(function(element) {
				return element.CharType === "01";
			});

			var oTable = new sap.m.Table({
				showSeparators: "None"
			});

			oTable.addStyleClass("dynTable sapUiSmallMarginTop");

			// For Header of Table - empty column name
			var oGroupedChar = this.util.groupBy(aChar, "InspChar");
			oTable.addColumn(new sap.m.Column());
			for (var char in oGroupedChar) {
				oTable.addColumn(new sap.m.Column());
			}

			// For Items
			// Line for CharCategoryName
			var aCells = [new sap.m.Text({
				text: "",
				width: "150px"
			})];
			for (char in oGroupedChar) {
				aCells.push(new sap.m.Text({
					text: oGroupedChar[char][0].CharCategoryName,
					width: "150px"
				}).addStyleClass("sapUiTinyMarginEnd"));
			}
			oTable.addItem(new sap.m.ColumnListItem({
				cells: aCells,
				vAlign: "Middle",
				type: "Inactive"
			}));

			//Line for Char name
			aCells = [new sap.m.Text({
				text: this.util.isAverageVisible("Avg: {data>/Average/" + oOperation.OperationNo + "/}", aQuantChar.length),
				width: "150px"
			})];
			for (char in oGroupedChar) {
				aCells.push(new sap.m.Text({
					text: oGroupedChar[char][0].InspCharName,
					width: "150px"
				}).addStyleClass("sapUiTinyMarginEnd boldText"));
			}
			oTable.addItem(new sap.m.ColumnListItem({
				cells: aCells,
				vAlign: "Middle",
				type: "Inactive"
			}));

			//Line all result values
			var oGroupedSample = this.util.groupBy(aChar, "Counter");
			for (var item in oGroupedSample) {
				aCells = [new sap.m.Text({
					text: "Sample # " + item,
					width: "150px"
				})];

				var aSample = oGroupedSample[item];
				for (var result in aSample) {
					var i = aChar.indexOf(aSample[result]);

					var sCharPath = sPath + "/OperationtoInspCharacteristic/results/" + i;
					if (aChar[i].CharType === "02") {
						var sCharKey = oOperation.InspLotNo + "" + oOperation.OperationNo + "" + aChar[i].InspChar;
						var oSelect = new sap.m.Select({
							forceSelection: false,
							selectedKey: "{" + sCharPath + "/Code}",
							enabled: oFlagEditInput,
							width: "150px",
							change: this.util.onChangeQualAttribute.bind(this)
						});
						oSelect.bindAggregation("items", "data>/QualCharCode/" + sCharKey + "/", new sap.ui.core.ListItem({
							key: "{data>Code}",
							text: "{data>CodeText}"
						}));
						oSelect.addStyleClass("sapUiTinyMarginEnd");
						aCells.push(oSelect);

					} else {

						var oInput = new sap.m.Input({
							value: "{" + sCharPath + "/MeasuredValue}",
							editable: oFlagEditInput,
							width: "150px",
							maxLength: 8,
							liveChange: this.util.ValidateNumberInput
						});

						oInput.attachChange(oInput, onChangeResultValue, this);
						oInput.addStyleClass("sapUiTinyMarginEnd");
						aCells.push(oInput);

					}

				}

				oTable.addItem(new sap.m.ColumnListItem({
					cells: aCells,
					vAlign: "Middle",
					type: "Inactive"
				}));

			}

			return oTable;

		},

		buildVerticalControls: function(sPath, oOperation) {

			var oLot = this.oJsModel.getProperty("/Lot");
			var oFlagEditInput = oLot.UDMade === "" ? true : false;

			var onChangeResultValue = function(oControlEvent, oInputField) {
				var sKey = oInputField.getParent().getParent().getParent().getParent().getKey();
				var sInpPath = this.getBindingPathfromKey(sKey);
				var oInpOperation = this.oJsModel.getProperty(sInpPath);
				var aChar = oInpOperation.OperationtoInspCharacteristic.results;
				this.calculateAverage(oInpOperation.OperationNo, aChar);

				if (document.activeElement === oInputField.getFocusDomRef()) {
					this.moveToNextInput();
				}

			};

			var aChar = oOperation.OperationtoInspCharacteristic.results;
			var aQuantChar = aChar.filter(function(element) {
				return element.CharType === "01";
			});

			var oTable = new sap.m.Table({
				showSeparators: "None"
			});

			oTable.addStyleClass("dynTable sapUiSmallMarginTop");

			// For Header of Table - empty column name
			var oGroupedSample = this.util.groupBy(aChar, "Counter");
			oTable.addColumn(new sap.m.Column());
			oTable.addColumn(new sap.m.Column());
			for (var item in oGroupedSample) {
				oTable.addColumn(new sap.m.Column());
			}

			// For Items

			// Line for Sample text
			var aCells = [new sap.m.Text({
				text: this.util.isAverageVisible("Avg: {data>/Average/" + oOperation.OperationNo + "/}", aQuantChar.length),
				width: "150px"
			}), new sap.m.Text({
				text: "",
				width: "150px"
			})];
			for (item in oGroupedSample) {
				aCells.push(new sap.m.Text({
					text: "Sample # " + item,
					width: "150px"
				}));
			}
			oTable.addItem(new sap.m.ColumnListItem({
				cells: aCells,
				vAlign: "Middle",
				type: "Inactive"
			}));

			//Line for All Result values
			var oGroupedChar = this.util.groupBy(aChar, "InspChar");
			for (var char in oGroupedChar) {
				aCells = [new sap.m.Text({
					text: oGroupedChar[char][0].CharCategoryName,
					width: "150px"
				}), new sap.m.Text({
					text: oGroupedChar[char][0].InspCharName
					//width: "150px"
				}).addStyleClass("sapUiSmallMarginEnd boldText")];

				var aSample = oGroupedChar[char];
				for (var result in aSample) {
					var i = aChar.indexOf(aSample[result]);

					var sCharPath = sPath + "/OperationtoInspCharacteristic/results/" + i;
					if (aChar[i].CharType === "02") {
						var sCharKey = oOperation.InspLotNo + "" + oOperation.OperationNo + "" + aChar[i].InspChar;
						var oSelect = new sap.m.Select({
							forceSelection: false,
							selectedKey: "{" + sCharPath + "/Code}",
							enabled: oFlagEditInput,
							width: "150px",
							change: this.util.onChangeQualAttribute.bind(this)
						});
						oSelect.bindAggregation("items", "data>/QualCharCode/" + sCharKey + "/", new sap.ui.core.ListItem({
							key: "{data>Code}",
							text: "{data>CodeText}"
						}));
						oSelect.addStyleClass("sapUiTinyMarginEnd");
						aCells.push(oSelect);

					} else {

						var oInput = new sap.m.Input({
							value: "{" + sCharPath + "/MeasuredValue}",
							editable: oFlagEditInput,
							width: "150px",
							maxLength: 8,
							liveChange: this.util.ValidateNumberInput
						});

						oInput.attachChange(oInput, onChangeResultValue, this);
						oInput.addStyleClass("sapUiTinyMarginEnd");
						aCells.push(oInput);

					}

				}

				oTable.addItem(new sap.m.ColumnListItem({
					cells: aCells,
					vAlign: "Middle",
					type: "Inactive"
				}));

			}

			return oTable;

		}

	};
});