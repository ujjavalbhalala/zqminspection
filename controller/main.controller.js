sap.ui.define([
	"zqminspection/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"zcustomlibrary/camera/Camera",
	"zcustomlibrary/img/ImageViewer",
	"zqminspection/js/dynControl"
], function(BaseController, MessageBox, History, Camera, ImageViewer, dynCtrl) {
	"use strict";

	return BaseController.extend("zqminspection.controller.main", {
		dynCtrl: dynCtrl,
		onInit: function() {
			//var that = this;
			this._getCreateInspection();
			this._getSearchInspection();
			this._getCaptureImage();
			this.oDataModel = this.getOwnerComponent().getModel();
			this.oJsModel = this.getOwnerComponent().getModel("data");
			this._selectedKey = this.byId("idTabBar").getSelectedKey();
			this.setEventHandler();
		},
		setEventHandler: function() {
			var that = this;
			this.oDataModel.attachBatchRequestSent(function() {
				that.oJsModel.setProperty("/view/busy", true);
				sap.ui.getCore().getMessageManager().removeAllMessages();
			});
			this.oDataModel.attachBatchRequestCompleted(function() {
				that.oJsModel.setProperty("/view/busy", false);
			});
			this.oDataModel.attachBatchRequestFailed(function() {
				that.oJsModel.setProperty("/view/busy", false);
				var aMsg = that.getOwnerComponent().getModel("message").getData();
				if (aMsg.length > 0) {
					that.showErrorMessage(aMsg[0].message);
				}

			});

			this.oJsModel.bindProperty("LotFound", this.oJsModel.getContext("/LotFound")).attachChange(function(evt) {
				var oModel = this.getModel();
				if (oModel.getProperty("/LotFound") === true) {
					that.byId("idBtnCreate").setVisible(false);
					that.byId("idBtnSearch").setVisible(false);
				} else {
					that.byId("idBtnCreate").setVisible(true);
					that.byId("idBtnSearch").setVisible(true);
				}
			});

			$(':input').keypress(function() {
				$(this).next(':input').focus();
			});
			// Disable manual input in combobox
			//this.disableManualComboBoxInput("idUDCodeList");
			this.disableManualComboBoxInput("idSrchInspectionType");
			this.disableManualComboBoxInput("idCrtInspectionType");
			this.disableManualComboBoxInput("idCrtStartdate");

		},

		disableManualComboBoxInput: function(oControlID) {
			var oComboBox = this.byId(oControlID);
			oComboBox.addEventDelegate({
				onAfterRendering: function() {
					oComboBox.$().find("input").attr("readonly", true);
				}
			});
		},
		onPressCreate: function() {
			//this.readInspectionCharacteristics('890000000701');
			//return false;
			this.crt.generateCreateDialog(this);
		},
		onPressSearch: function() {
			this.srch.generateSearchDialog(this);
		},
		readInspectionCharacteristics: function(nInspectionLot) {
			var that = this;
			// Get Inspection Lot details
			this.oDataModel.read("/InspectionLotSet('" + nInspectionLot + "')", {
				success: function(oData) {
					that.oJsModel.setProperty("/Lot", oData);
					//that.generateUDScreen();
				},
				groupID: "getLot"
			});

			this.oDataModel.read("/InspectionOperationSet", {
				urlParameters: {
					$filter: "InspLotNo eq '" + nInspectionLot +
						"'",
					$expand: ["OperationtoInspCharacteristic"]
				},
				success: function(oData) {
					that.oJsModel.setProperty("/Ops", oData.results);
					that.oJsModel.setProperty("/OpsDB", JSON.parse(JSON.stringify(oData.results)));
					// create dynamic tabs
					var oTabBar = that.byId("idTabBar");
					for (var i = 0; i < oData.results.length; i++) {
						var sPath = "data>/Ops/" + i;
						var oOperationTab = new sap.m.IconTabFilter({
							key: "OPR_{" + sPath + "/OperationNo}",
							icon: oData.results[i].Icon === "" ? "sap-icon://commission-check" : oData.results[i].Icon,
							iconColor: "Default",
							text: "{" + sPath + "/Description}",
							content: []
						});
						var index = oTabBar.getItems().length > 0 ? oTabBar.getItems().length : 99;

						that.addContentToOperation(oOperationTab, sPath, oData.results[i]);
						oTabBar.insertItem(oOperationTab, index);
					}

					oTabBar.addItem(new sap.m.IconTabSeparator({
						iconDensityAware: false
					}));

					//UD Tab
					var oUDFrg = sap.ui.xmlfragment(that.getView().getId(), "zqminspection.fragment.UsageDecision", that);
					oTabBar.addItem(oUDFrg);
					that.disableManualComboBoxInput("idUDCodeList");

					//Attachment List Tab
					var oAttchFrg = sap.ui.xmlfragment(that.getView().getId(), "zqminspection.fragment.Attachments", that);
					oTabBar.addItem(oAttchFrg);

					that.oJsModel.setProperty("/AttachmentList", []);
					that.attch.bindOperationSelectList.bind(that, oData)();

					that.generateUDScreen();
				},
				error: function(e) {
					that.oDataModel.fireBatchRequestFailed();
				},
				groupID: "getLot"
			});

			// Get Code list for qualitative characteristics
			that = this;
			this.oDataModel.read("/QualitativeCharSet", {
				urlParameters: {
					$filter: "CharKey eq '" + nInspectionLot +
						"'"
				},
				success: function(oData) {
					var aCodeList = that.util.groupBy(oData.results, "CharKey");
					that.oJsModel.setProperty("/QualCharCode", aCodeList);
				},
				groupID: "getLot"
			});

		},
		addContentToOperation: function(oItem, sPath, oOperation) {

			if (oItem.getContent().length === 0) {
				var oLot = this.oJsModel.getProperty("/Lot");
				var sTitle = oOperation.Description + " For " + oOperation.InspLotNo + " - " + oLot.Material + " - " + oLot.Batch + " - " + oLot.Customer +
					" - " + oLot.RPIN + " at Lab " + oOperation.WorkcenterDescription;
				var oFlagEditInput = oLot.UDMade === "" ? true : false;

				var oTitle = new sap.m.Toolbar();
				oTitle.addContent(new sap.m.Title({
					text: sTitle
				}));
				oTitle.addContent(new sap.m.ToolbarSpacer());
				oTitle.addContent(new sap.m.Button({
					text: "Next",
					type: "Accept",
					visible: oFlagEditInput,
					press: this.moveToNextTab.bind(this)
				}));
				oTitle.addContent(new sap.m.Button({
					text: "Clear",
					type: "Reject",
					visible: oFlagEditInput,
					press: this.resetResultChanges.bind(this)
				}));

				// has to be sorted by counter from backend
				var aChar = oOperation.OperationtoInspCharacteristic.results;
				var InspMethod = this.util.getInspectionMethod.bind(this, aChar)();
				this.calculateAverage(oOperation.OperationNo, aChar);

				if (InspMethod === "V" || oOperation.InspectionDirection === "VT") {
					var oOuterLayout = this.dynCtrl.buildVerticalControls.bind(this, sPath, oOperation)();
				} else {
					oOuterLayout = this.dynCtrl.buildHoriozontalControls.bind(this, sPath, oOperation)();
				}

				var oScrollContainer = (new sap.m.ScrollContainer({
					height: "95%",
					width: "100%",
					horizontal: true,
					vertical: true
				}));
				oScrollContainer.addContent(oOuterLayout);
				oItem.addContent(oTitle);
				oItem.addContent(oScrollContainer);

			}

		},
		calculateAverage: function(opertaionNumber, aChar) {
			var sum = 0.000;
			var nItems = 0;
			var aResults = JSON.parse(JSON.stringify(aChar));
			for (var i = 0; i < aResults.length; i++) {
				if (!aResults[i].MeasuredValue || aResults[i].MeasuredValue === "") {
					aResults[i].MeasuredValue = 0;
				} else {
					nItems++;
				}
				sum = sum + parseFloat(aResults[i].MeasuredValue);
			}

			var average = nItems > 0 ? sum / nItems : 0;
			this.oJsModel.setProperty("/Average/" + opertaionNumber + "/", parseFloat(average).toFixed(3));

		},
		moveToNextTab: function(oEvent) {
			var oCurrItem = oEvent.getSource().getParent().getParent();
			var oItems = this.byId("idTabBar").getItems();
			var index = oItems.indexOf(oCurrItem);
			if (index > 0) {
				while (index < oItems.length) {
					index++;
					var oNextItem = oItems[index];
					if (oNextItem.getMetadata().getElementName() === "sap.m.IconTabFilter") {
						var nextKey = oNextItem.getKey();
						break;
					}
				}
			}

			var sKey = oEvent.getSource().getParent().getParent().getKey();
			var sPath = this.getBindingPathfromKey(sKey);
			var oOperation = this.oJsModel.getProperty(sPath);
			var that = this;
			this.oDataModel.create("/InspectionOperationSet", oOperation, {
				success: function(oData) {
					that.updateOpsDB(sKey, oData);
					that.byId("idTabBar").setSelectedKey(nextKey);
					that.byId("idTabBar").fireSelect({
						key: nextKey
					});
					that.setFocusonInput();
				},
				error: function(e) {
					that.oDataModel.fireBatchRequestFailed();
				}
			});

		},
		resetResultChanges: function(oEvent) {
			var sKey = oEvent.getSource().getParent().getParent().getKey();
			this.resetOps(sKey);
		},
		saveUDTabData: function(oEvent) {

			var nUDCode = this.byId("idUDCodeList").getSelectedItem() ? this.byId("idUDCodeList").getSelectedItem().getKey() : "";
			var sComment = this.byId("idCommentText").getValue();
			var oInspLot = this.oJsModel.getProperty("/Lot");

			if (nUDCode === "") {
				this.showErrorMessage("Please choose UD Code");
			}

			var selPath = this.byId("idUDCodeList").getSelectedItem().getBindingInfo("key").binding.getContext().getPath();
			var oSelUD = this.oJsModel.getProperty(selPath);
			var oUD = {
				CodeGroup: oSelUD.CodeGroup,
				UDCode: nUDCode,
				Comments: sComment,
				InspLotNo: oInspLot.InspLotNo
			};
			var that = this;
			this.oDataModel.create("/UsageDecisionSet", oUD, {
				success: function(oData) {
					that.oJsModel.setProperty("/Lot/UDMade", "X");
					sap.m.MessageBox.information("UD Saved");
					that.resetForm();
				},
				error: function(e) {
					that.oDataModel.fireBatchRequestFailed();
				}
			});

		},
		getBindingPathfromKey: function(sKey) {
			var oItems = this.byId("idTabBar").getItems();
			var oItem = "";
			for (var i = 0; i < oItems.length; i++) {
				if (oItems[i].getBindingInfo("key") && oItems[i].getKey() === sKey) {
					oItem = oItems[i];
					break;
				}
			}
			if (oItem !== "") {
				var oKeyBinding = oItem.getBindingInfo("text");
				var sKeyPath = oKeyBinding.binding.getPath();
				var sPath = sKeyPath.substring(0, sKeyPath.lastIndexOf("/"));
			}

			return sPath;

		},
		updateOpsDB: function(sKey, oData) {
			var sPath = this.getBindingPathfromKey(sKey);
			var sPathDB = "/OpsDB" + sPath.substring(sPath.lastIndexOf("/"));
			this.oJsModel.setProperty(sPathDB, JSON.parse(JSON.stringify(oData)));
		},
		resetOps: function(sKey) {
			var sPath = this.getBindingPathfromKey(sKey);
			var sPathDB = "/OpsDB" + sPath.substring(sPath.lastIndexOf("/"));
			var oOperationDB = this.oJsModel.getProperty(sPathDB);
			this.oJsModel.setProperty(sPath, JSON.parse(JSON.stringify(oOperationDB)));
			this.calculateAverage(oOperationDB.OperationNo, oOperationDB.OperationtoInspCharacteristic.results);
		},
		savePreviousOperation: function(prevKey) {

			var sPath = this.getBindingPathfromKey(prevKey);
			if (sPath) {
				var oOperation = this.oJsModel.getProperty(sPath);

				var that = this;
				this.oDataModel.create("/InspectionOperationSet", oOperation, {
					success: function(oData, response) {
						that.updateOpsDB(that._selectedKey, oData);
						that._selectedKey = that.byId("idTabBar").getSelectedKey();
					},
					error: function(e) {
						that.byId("idTabBar").setSelectedKey(that._selectedKey);
						that.oDataModel.fireBatchRequestFailed();
					}
				});
			}

		},
		isOperationChanged: function(prevKey) {
			var sPath = this.getBindingPathfromKey(prevKey);
			if (sPath) {
				var oOperation = this.oJsModel.getProperty(sPath);

				var sPathDB = "/OpsDB" + sPath.substring(sPath.lastIndexOf("/"));
				var oOperationDB = this.oJsModel.getProperty(sPathDB);
				if (JSON.stringify(oOperation) !== JSON.stringify(oOperationDB)) {
					return true;
				}
			}

		},
		filterElements: function(oEvent) {
			var sKey = oEvent.getParameter("key");
			if (this._selectedKey.startsWith("OPR_") === true && this.isOperationChanged(this._selectedKey) === true) {
				var that = this;

				MessageBox.show(
					"Do you want to save operation?", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Confirm",
						actions: ["Yes", "No", "Back"],
						onClose: function(oAction) {
							if (oAction === "Yes") {
								that.savePreviousOperation(that._selectedKey);
							} else if (oAction === "No") {
								that.resetOps(that._selectedKey);
								that._selectedKey = sKey;
								
							} else if (oAction === "Back") {
								that.byId("idTabBar").setSelectedKey(that._selectedKey);
							}
							that.setFocusonInput();
						}
					}
				);

			} else {
				this._selectedKey = sKey;
			}

			if (sKey === "UD") {
				//generate data for UD
				this.populateUDResults();
			}

			var oFlag = (sKey === "Header" || sKey === "UD" || sKey.startsWith("OPR_")) ? true : false;
			this.byId("idBtnPhoto").setVisible(oFlag);

			this.setFocusonInput();

		},
		populateUDResults: function() {
			this.oJsModel.setProperty("/UDResults", []);
			var oInspLot = this.oJsModel.getProperty("/Lot");
			if (oInspLot.InspLotNo) {
				var that = this;
				this.oDataModel.read("/InspectionOperationSet", {
					urlParameters: {
						$filter: "InspLotNo eq '" + oInspLot.InspLotNo +
							"' and flagMeanValue eq 'X'",
						$expand: ["OperationtoInspCharacteristic"]
					},
					success: function(oData) {
						that.oJsModel.setProperty("/UDResults", that.jsonUDResults(oData.results));
					}
				});

			}
		},
		jsonUDResults: function(oData) {
			var aResults = [];
			var currOperationNo = "";
			var nGrossAvg = "";
			for (var i = 0; i < oData.length; i++) {
				var aChar = oData[i].OperationtoInspCharacteristic.results;
				for (var j = 0; j < aChar.length; j++) {
					nGrossAvg = "";
					if (currOperationNo !== oData[i].OperationNo) {
						nGrossAvg = this.oJsModel.getProperty("/Average/" + oData[i].OperationNo + "/");
						currOperationNo = JSON.parse(JSON.stringify(oData[i].OperationNo));
					}

					if (aChar[j].CharType === "02") {
						var aQualCode = this.oJsModel.getProperty("/QualCharCode/" + oData[i].InspLotNo + "" + oData[i].OperationNo + "" + aChar[j].InspChar +
							"/");
						var aQualCodeGrouped = this.util.groupBy(aQualCode, "Code");
					}

					aResults.push({
						OperationNo: oData[i].OperationNo,
						Description: oData[i].Description,
						InspChar: aChar[j].InspChar,
						InspCharName: aChar[j].InspCharName,
						MeasuredValue: aChar[j].CharType === "02" ? aQualCodeGrouped[aChar[j].Code][0].CodeText : aChar[j].MeasuredValue,
						grossAvg: aChar[j].CharType === "02" ? "" : nGrossAvg
					});
				}
			}
			return aResults;

		},
		getUDCodes: function(nInspectionLot) {
			var aUDCodes = this.oJsModel.getProperty("/UDCodes");
			if (aUDCodes.length === 0) {
				var that = this;
				this.oDataModel.read("/UsageDecisionSet", {
					urlParameters: {
						$filter: "InspLotNo eq '" + nInspectionLot + "'"
					},
					success: function(oData) {
						// Bind table
						if (oData.results.length > 0) {
							that.oJsModel.setProperty("/UDCodes", oData.results);
							that.setUDVisibility(oData);
						}
					},
					groupID: "getLot"
				});

			}

		},
		generateUDScreen: function() {
			var oInspLot = this.oJsModel.getProperty("/Lot");
			if (oInspLot.InspLotNo) {
				this.getUDCodes(oInspLot.InspLotNo);
			}
		},

		setUDVisibility: function(oData) {
			var editUD = true;
			if (oData.results[0].CodeDate !== null) {
				this.oJsModel.setProperty("/Lot/UDCode", oData.results[0].UDCode);
				this.oJsModel.setProperty("/Lot/UDComment", oData.results[0].Comments);
				editUD = false;
			}
			this.byId("idUDCodeList").setEditable(editUD);
			this.byId("idCommentText").setEditable(editUD);
			this.byId("idSaveUD").setVisible(editUD);
		},

		onPressBackMain: function() {
			var that = this;
			MessageBox.show(
				"Do you really want to go back ?", {
					icon: sap.m.MessageBox.Icon.WARNING,
					title: "Confirm",
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					onClose: function(oAction) {
						if (oAction === "YES") {
							that.resetForm();
						}
					}
				}
			);

		},
		onClickPhoto: function(oEvent) {
			var OprKey = "sel";
			var CharKey = "sel";
			var sSelKey = this.byId("idTabBar").getSelectedKey();
			var oInspectionLot = this.oJsModel.getProperty("/Lot/InspLotNo");
			if (oInspectionLot && oInspectionLot !== "") {

				if (sSelKey.startsWith("OPR_")) {
					var oOprData = this.oJsModel.getProperty(this.getBindingPathfromKey(this.byId("idTabBar").getSelectedKey()));
					OprKey = oOprData.OperationNo;
				}
				this.util.setSelectKey(this.byId("idCapImgOprSel"), OprKey);
				this.util.setSelectKey(this.byId("idCapImgCharSel"), CharKey);

				this.capimg.openCaptureImageDialog.bind(this)();
			}

		},
		resetForm: function() {
			this.oJsModel.setProperty("/LotFound", false);
			this.oJsModel.setProperty("/Ops", {});
			this.oJsModel.setProperty("/Lot", {});
			this.oJsModel.setProperty("/OpsDB", {});
			this.oJsModel.setProperty("/Average", {});
			this.oJsModel.setProperty("/UDCodes", []);
			this.oJsModel.setProperty("/AttachmentList", []);
			this.oJsModel.setProperty("/QualCharCode", []);

			this.byId("idHeaderForm").unbindElement();
			var oTabBar = this.byId("idTabBar");
			var oTabItems = oTabBar.getItems();
			for (var i = 0; i < oTabItems.length; i++) {
				if (i > 1) {
					oTabBar.removeItem(oTabItems[i]);
					oTabItems[i].destroy(true);
				}
			}
			sap.ui.getCore().getMessageManager().removeAllMessages();
		}
	});
});