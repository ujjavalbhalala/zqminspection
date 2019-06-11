sap.ui.define([
	"zcustomlibrary/img/ImageViewer",
	"sap/m/MessageBox"
], function(ImageViewer, MessageBox) {
	"use strict";

	return {

		getAttachmentList: function(oKey) {
			var that = this;
			this.oDataModel.read("/AttachmentSet", {
				urlParameters: {
					$filter: "Key eq '" + oKey.Id +
						"' and Object eq '" + oKey.Object + "'"
				},
				success: function(oData) {
					var aAttachments = that.oJsModel.getProperty("/AttachmentList");
					var aAttachmentFilter = aAttachments.filter(function(elem) {
						return elem.Key === oKey.Id;
					});

					if (oData.results.length > 0 && aAttachmentFilter.length === 0) {

						for (var i = 0; i < oData.results.length; i++) {
							var oAttachment = oData.results[i];
							oAttachment["IdText"] = oKey.IdText;
							aAttachments.push(oAttachment);
						}

						that.oJsModel.setProperty("/AttachmentList", aAttachments);
					}

				},
				groupID: "getAttachments"
			});

		},
		bindOperationSelectList: function(oData) {
			var aOperations = JSON.parse(JSON.stringify(oData.results));
			this.attch.fetchAllAttachments.bind(this, aOperations)();
			aOperations.splice(0, 0, {
				OperationNo: "sel",
				Description: ""
			});
			this.oJsModel.setProperty("/OperationSelcList", aOperations);

		},
		fetchAllAttachments: function(aOperations) {
			var oInspectionLot = this.oJsModel.getProperty("/Lot/InspLotNo");
			this.attch.getAttachmentList.bind(this, {
				Id: oInspectionLot,
				IdText: "Inspection Lot",
				Object: "BUS2045"
			})();
			for (var i = 0; i < aOperations.length; i++) {
				this.attch.getAttachmentList.bind(this, {
					Id: oInspectionLot + "" + aOperations[i].OperationNo,
					IdText: aOperations[i].Description,
					Object: "BUS204501"
				})();

				if (aOperations[i].hasOwnProperty("OperationtoInspCharacteristic") === true) {
					var aChar = aOperations[i].OperationtoInspCharacteristic.results;
					for (var j = 0; j < aChar.length; j++) {

						this.attch.getAttachmentList.bind(this, {
							Id: oInspectionLot + "" + aChar[j].OperationNo + "" + aChar[j].InspChar,
							IdText: aChar[j].InspCharName,
							Object: 'BUS204502'
						})();
					}
				}
			}
		},
		/*bindCharSelectList: function(oEvent) {
			var aChars = [];
			if (this.byId("idOperSelcList").getSelectedKey() !== "sel") {
				var oSelOperation = oEvent.getParameter("selectedItem").getBinding("key").getContext().getProperty();
				var aCharsResults = JSON.parse(JSON.stringify(oSelOperation.OperationtoInspCharacteristic.results));
				aChars = this.util.getUnique(aCharsResults, "InspChar");
			}

			aChars.splice(0, 0, {
				InspChar: "sel",
				InspCharName: ""
			});
			this.oJsModel.setProperty("/CharSelcList", aChars);

			this.util.setSelectKey(this.byId("idCharSelcList"), "sel");

		},
		filterAttachmentList: function() {
			var key = this.attch.getKeyAttribute.bind(this, this.byId("idOperSelcList"), this.byId("idCharSelcList"))();
			
			this.byId("idAttachmentListTitle").setText(key.Text);
			this.byId("idAttachmentList").getBinding("items").filter([
				new sap.ui.model.Filter("Key", "EQ", key.Id)
			]);

		},*/
		getKeyAttribute: function(oOprControl, oCharControl) {

			var key = {
				Id: "",
				Text: "",
				Object: ""
			};

			var oInspectionLot = this.oJsModel.getProperty("/Lot/InspLotNo");

			var oOperSelcListValue = oOprControl.getSelectedItem().getBinding("key").getContext().getProperty();
			var oCharSelcListValue = oCharControl.getSelectedItem().getBinding("key").getContext().getProperty();

			if (oCharSelcListValue && oCharSelcListValue.InspChar !== "sel") {
				//key.Text = "Attachments for " + oCharSelcListValue.InspCharName;
				key.Text = oCharSelcListValue.InspCharName;
				key.Id = oInspectionLot + "" + oOperSelcListValue.OperationNo + "" + oCharSelcListValue.InspChar;
				key.Object = "BUS204502";
			} else if (oOperSelcListValue && oOperSelcListValue.OperationNo !== "sel") {
				//key.Text = "Attachments for " + oOperSelcListValue.Description;
				key.Text = oOperSelcListValue.Description;
				key.Id = oInspectionLot + "" + oOperSelcListValue.OperationNo;
				key.Object = "BUS204501";
			} else {
				//key.Text = "Attachments for Lot " + oInspectionLot;
				key.Text = "Inspection Lot";
				key.Id = oInspectionLot;
				key.Object = "BUS2045";
			}

			return key;

		},
		onPressImageLink: function(oEvent) {
			var oImage = oEvent.getSource().getBinding("text").getContext().getProperty();
			var sPath = oEvent.getSource().getBinding("text").getContext().getPath();

			if (oImage.FileData === "") {

				var that = this;
				this.oDataModel.read("/AttachmentSet(AttachmentID='" + oImage.AttachmentID + "')", {
					success: function(oData) {
						oImage.FileData = oData.FileData;
						that.oJsModel.setProperty(sPath, oImage);

						var Img = new ImageViewer({
							src: oImage.FileData
						});
						Img.open();
					},
					groupID: "getAttachments"
				});

			} else {
				var Img = new ImageViewer({
					src: oImage.FileData
				});
				Img.open();
			}

		},
		/*onAddAttachment: function() {
			this.util.setSelectKey(this.byId("idCapImgOprSel"), this.byId("idOperSelcList").getSelectedKey());
			this.util.setSelectKey(this.byId("idCapImgCharSel"), this.byId("idCharSelcList").getSelectedKey());

			this.capimg.openCaptureImageDialog.bind(this)();
		},*/
		onDeleteAttachment: function() {
			var that = this;
			MessageBox.show(
				"Do you really want to delete the attachment ?", {
					icon: sap.m.MessageBox.Icon.WARNING,
					title: "Confirm",
					actions: ["Yes", "No"],
					onClose: function(oAction) {
						if (oAction === "Yes") {
							that.attch.deleteAttachment.bind(that)();
						}
					}
				}
			);

		},
		deleteAttachment: function() {
			var oSelectedItem = this.byId("idAttachmentList").getSelectedItem();
			var oItem = oSelectedItem.oBindingContexts.data.getProperty();
			var sPath = oSelectedItem.oBindingContexts.data.getPath();
			var oItemIndex = parseInt(sPath.substring(sPath.lastIndexOf("/") + 1, sPath.length));
			var that = this;
			this.oDataModel.remove("/AttachmentSet(AttachmentID='" + oItem.AttachmentID + "')", {
				method: "DELETE",
				success: function() {
					var oAttachmentList = that.oJsModel.getProperty("/AttachmentList");
					oAttachmentList.splice(oItemIndex, 1);
					that.oJsModel.setProperty("/AttachmentList", oAttachmentList);
				},
				error: function() {
					var aMsg = that.getOwnerComponent().getModel("message").getData();
					that.showErrorMessage(aMsg[0].message);
					sap.ui.getCore().getMessageManager().removeAllMessages();
				}
			});
		}

	};
});