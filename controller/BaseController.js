sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"zqminspection/js/Utilities",
	"zqminspection/js/CreateInspection",
	"zqminspection/js/SearchInspection",
	"zqminspection/js/Attachments",
	"zqminspection/js/CaptureImage"
], function(Controller, History, Utilities, CreateInspection, SearchInspection, Attachments, CaptureImage) {
	"use strict";

	return Controller.extend("zqminspection.controller.main", {

		crt: CreateInspection,
		srch: SearchInspection,
		attch: Attachments,
		capimg: CaptureImage,
		util: Utilities,
		getRouter: function() {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		onNavBack: function() {

			if (this.oJsModel.getProperty("/LotFound") === true) {
				var that = this;
				sap.m.MessageBox.show(
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

			} else {

				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				if (oCrossAppNavigator) {
					oCrossAppNavigator.toExternal({
						target: {
							semanticObject: "#"
						}
					});
				}
			}
		},
		onBackDialog: function(oEvent) {
			var oDialog = oEvent.getSource().getParent();
			if (oDialog) {
				oDialog.close();
			}
			this.setFocusonBin();
		},
		onNavBackStd: function(oEvent) {
			var oHistory, sPreviousHash;

			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("appHome", {}, true /*no history*/ );
			}
		},

		onMessagePopoverPress: function(oEvent) {
			this._getMessagePopover().openBy(oEvent.getSource());
		},

		//################ Private APIs ###################

		_getCreateInspection: function() {
			// create popover lazily
			if (!this._oCreateInspection) {
				this._oCreateInspection = sap.ui.xmlfragment(this.getView().getId(), "zqminspection.fragment.CreateInspection", this);
				this.getView().addDependent(this._oCreateInspection);
			}
			return this._oCreateInspection;
		},
		_getSearchInspection: function() {
			// create popover lazily
			if (!this._oSearchInspection) {
				this._oSearchInspection = sap.ui.xmlfragment(this.getView().getId(), "zqminspection.fragment.SearchInspection", this);
				this.getView().addDependent(this._oSearchInspection);
			}
			return this._oSearchInspection;
		},
		_getCaptureImage: function() {
			// create popover lazily
			if (!this._oCaptureImage) {
				this._oCaptureImage = sap.ui.xmlfragment(this.getView().getId(), "zqminspection.fragment.CaptureImage", this);
				this.getView().addDependent(this._oCaptureImage);
			}
			return this._oCaptureImage;
		},
		showErrorMessage: function(sMessage) {
			var that = this;
			sap.m.MessageBox.show(
				sMessage, {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Error",
					actions: [sap.m.MessageBox.Action.OK]
				}
			);
		},
		setFocusonInput: function() {

			jQuery.sap.delayedCall(500, this, function() {
				$('input').first().focus();
			});

		},
		moveToNextInput: function() {

			jQuery.sap.delayedCall(200, this, function() {
				var activeElement = document.activeElement;
				var aInputElements = $('input');
				var currIndex = aInputElements.index(activeElement);
				var nextIndex = currIndex + 1;
				if (aInputElements.length > nextIndex) {
					aInputElements[nextIndex].focus();
				}
			});

		}

	});

});