sap.ui.define(function() {
	"use strict";

	return {
		onSnapshot: function(oEvent) {
			this.byId("idCameraImage").setVisible(true);
			this.byId("idCameraImage").setSrc(oEvent.getParameter("image"));
			this.byId("idCaptureImageCarousel").next();
		},
		openCaptureImageDialog: function() {

			var oCamera = this.byId("idCamera");
			//oCamera.rerender();
			this.byId("idCameraImage").setVisible(false);
			this.byId("idCameraImage").setSrc("");
			this.byId("idFileNameInput").setValue("");
			this.byId("idCaptureImageCarousel").setActivePage(oCamera);
			this._getCaptureImage().open();

		},
		onPressUploadImage: function() {
			var oImage = this.byId("idCameraImage").getSrc();
			if (oImage === "") {
				this.showErrorMessage("Please capture image");
				return false;
			}

			var key = this.attch.getKeyAttribute.bind(this, this.byId("idCapImgOprSel"), this.byId("idCapImgCharSel"))();
			var fileType = oImage.substring(oImage.indexOf(":") + 1, oImage.indexOf(";"));
			var fileData = oImage.split(",")[1];

			var oAttachment = {
				Key: key.Id,
				FileName: "",
				FileNameText: this.byId("idFileNameInput").getValue(),
				Object: key.Object,
				FileType: fileType,
				FileData: fileData
			};
			var that = this;
			this.oDataModel.create("/AttachmentSet", oAttachment, {
				success: function(oData) {
					//oData.FileData = oImage;
					var oAttachmentList = that.oJsModel.getProperty("/AttachmentList");
					oData.FileData = "data:" + oData.FileType + ";base64," + oData.FileData;
					oData.FileNameText = oData.FileNameText === "" ? oData.FileName : oData.FileNameText;
					oData.IdText = key.Text;
					oAttachmentList.splice(0, 0, oData);
					that.oJsModel.setProperty("/AttachmentList", oAttachmentList);

					that.byId("idCamera").stopCamera();
					that._getCaptureImage().close();
				},
				error: function(e) {
					var aMsg = that.getOwnerComponent().getModel("message").getData();
					that.showErrorMessage(aMsg[0].message);
					sap.ui.getCore().getMessageManager().removeAllMessages();
				}
			});

		},
		closeDialog: function() {
			this.byId("idCamera").stopCamera();
			this._getCaptureImage().close();
		},
		bindCharSelectList: function(oEvent) {
			var aChars = [];
			if (oEvent.getParameter("selectedItem").getKey() !== "sel") {
				var oSelOperation = oEvent.getParameter("selectedItem").getBinding("key").getContext().getProperty();
				var aCharsResults = JSON.parse(JSON.stringify(oSelOperation.OperationtoInspCharacteristic.results));
				aChars = this.util.getUnique(aCharsResults, "InspChar");
			}

			aChars.splice(0, 0, {
				InspChar: "sel",
				InspCharName: ""
			});
			this.oJsModel.setProperty("/CharSelcList", aChars);

		}

	};
});