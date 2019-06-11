sap.ui.define(function() {
  "use strict";

  return {

    generateCreateDialog: function(that) {
      var oContext = that.oDataModel.createEntry("/InspectionLotSet");
      that.byId("idCrtPlant").setBindingContext(oContext);
      that.byId("idCrtMaterial").setBindingContext(oContext);
      that.byId("idCrtBatch").setBindingContext(oContext);
      that.oJsModel.setProperty("/SamplTypeList", []);

      that.byId("idCrtInspectionType").setSelectedKey("");
      that.byId("idCrtInspectionType").fireSelectionChange();

      //Set Max date
      that.byId("idCrtStartdate").setMaxDate(new Date());

      that._oCreateInspection.open();

    },
    getSampleType: function(oEvent) {
      this.oJsModel.setProperty("/SamplTypeList", []);
      var nPlant = this.byId("idCrtPlant").getValue();
      var nMaterial = this.byId("idCrtMaterial").getValue();
      var nBatch = this.byId("idCrtBatch").getValue();

      if (nPlant !== "" && (nMaterial !== "" || nBatch !== "")) {
        var that = this;
        this.oDataModel.read("/InspectionTypeMaterialSet", {
          urlParameters: {
            $filter: "Plant eq '" + nPlant +
              "' and Material eq '" + nMaterial +
              "' and Batch eq '" + nBatch +
              "'"
          },
          success: function(oData) {
            that.oJsModel.setProperty("/SamplTypeList", oData.results);
            that.byId("idCrtMaterial").setValue(oData.results[0].Material);
          },
          error: function(e) {
            that.oDataModel.fireBatchRequestFailed();
          }
        });
      }
    },
    getInspectionLotChar: function(oEvent) {
      // pass sample type n source and get Control field
      // on success : add fields using control field in "idCrInspectionFrm"

      var oContext = this.byId("idCrtInspForm").getBindingContext();
      if (oContext) {
        var sPath = oContext.getPath();
        if (this.oDataModel.getProperty(sPath)) {
          this.oDataModel.deleteCreatedEntry(oContext);
          this.byId("idCrtInspForm").unbindElement();
        }
      }

      var sInspectionType = oEvent.getParameter("selectedItem") ? oEvent.getParameter("selectedItem").getKey() : "";
      var that = this;
      this.oDataModel.read("/InspectionLotSet('')", {
        urlParameters: {
          $filter: "InspectionType eq '" + sInspectionType + "'"
        },
        success: function(oData) {
          var sPath = "/InspectionLotSet('000000000000')";
          var oInspContext = that.oDataModel.getContext(sPath);

          if (oData.InspectionType !== "") {
            oData.Plant = that.byId("idCrtPlant").getValue();
            oData.Material = that.byId("idCrtMaterial").getValue();
            that.oDataModel.setProperty(sPath + "/Plant", oData.Plant);
            that.oDataModel.setProperty(sPath + "/Material", oData.Material);
            var batchVal = that.byId("idCrtBatch").getValue();
            if (batchVal !== "") {
              oData.Batch = that.byId("idCrtBatch").getValue();
              that.oDataModel.setProperty(sPath + "/Batch", oData.Batch);
            }
            that.byId("idCrtBatch").setBindingContext(oInspContext);
          }

          that.byId("idCrtInspForm").setBindingContext(oInspContext);
          that.byId("idCrtInspLotQty").setValue(oData.InspLotQty);
          if (that.byId("idCrtPlant").getValue() === "" && oData.Plant !== "") {
            that.byId("idCrtPlant").setValue(oData.Plant);
          }
        },
        error: function(e) {
          that.oDataModel.fireBatchRequestFailed();
        }
      });

    },
    onBatchvalueHelpRequest: function(oEvent) {
      debugger;
    },
    checkInputValues: function(that) {
      var sPath = that.byId("idCrtStartdate").getBindingContext().getPath();
      var oLot = that.oDataModel.getProperty(sPath);
      //var today = new Date();

      var oInspLot = {
        Plant: that.byId("idCrtPlant").getValue(),
        Material: that.byId("idCrtMaterial").getValue(),
        Batch: that.byId("idCrtBatch").getValue(),
        RPIN: that.byId("idCrtRPIN").getValue(),
        Customer: that.byId("idCrtCustomer").getValue(),
        Manufacturer: that.byId("idCrtManufacturer").getValue(),
        InspLotQty: that.byId("idCrtInspLotQty").getValue(),
        Startdate: that.util.getJSONDate(oLot.Startdate),  //oLot.Startdate,
        ManagementArea: that.byId("idCrtManagementArea").getValue(),
        Subdivision: that.byId("idCrtSubdivision").getValue(),
        Vendor: that.byId("idCrtVendor").getValue(),
        Region: that.byId("idCrtRegion").getValue()

      };

      var oSelSampleTypeItem = that.byId("idCrtInspectionType").getSelectedItem();
      oInspLot.InspectionType = oSelSampleTypeItem ? oSelSampleTypeItem.getKey() : "";

      if (oInspLot.Plant === "") {
        that.showErrorMessage("Please Enter Plant");
        return false;
      } else if (oInspLot.Material === "") {
        that.showErrorMessage("Please Enter Material number");
        return false;
      } else if (oInspLot.InspectionType === "") {
        that.showErrorMessage("Please Enter Inspection Type");
        return false;
        /*} else if (oInspLot.Startdate === null || oInspLot.Startdate > today) {
          that.showErrorMessage("Please Choose Start date as current or past date");
          return false;
        */

      } else if (that.byId("idCrtBatch").getMandatory() === true && oInspLot.Batch === "") {
        that.showErrorMessage("Please Enter Batch");
        return false;
      } else if (that.byId("idCrtInspLotQty").getMandatory() === true && parseFloat(oInspLot.InspLotQty) <= 0) {
        that.showErrorMessage("Please Enter Sample quantity");
        return false;
      } else if (that.byId("idCrtRPIN").getMandatory() === true && oInspLot.RPIN === "") {
        that.showErrorMessage("Please Enter RPIN");
        return false;
      } else if (that.byId("idCrtCustomer").getMandatory() === true && oInspLot.Customer === "") {
        that.showErrorMessage("Please Enter Customer");
        return false;
      } else if (that.byId("idCrtManufacturer").getMandatory() === true && oInspLot.Manufacturer === "") {
        that.showErrorMessage("Please Enter Manufacturer");
        return false;

      } else if (that.byId("idCrtManagementArea").getMandatory() === true && oInspLot.ManagementArea === "") {
        that.showErrorMessage("Please Enter ManagementArea");
        return false;
      } else if (that.byId("idCrtSubdivision").getMandatory() === true && oInspLot.Subdivision === "") {
        that.showErrorMessage("Please Enter Subdivision");
        return false;
      } else if (that.byId("idCrtVendor").getMandatory() === true && oInspLot.Vendor === "") {
        that.showErrorMessage("Please Enter Vendor");
        return false;
      } else if (that.byId("idCrtRegion").getMandatory() === true && oInspLot.Region === "") {
        that.showErrorMessage("Please Enter Region");
        return false;
      }

      return oInspLot;
    },
    onPressSaveInspectionLot: function(oEvent) {
      //this.byId("idCrtStartdate").getBindingContext().getPath()
      //this.oDataModel.getProperty("/InspectionLotSet('000000000000')");
      var oInspectionLot = this.crt.checkInputValues(this);
      if (oInspectionLot !== false) {

        var that = this;
        this.oDataModel.create("/InspectionLotSet", oInspectionLot, {
          success: function(oData, response) {
            sap.m.MessageBox.show(
              "Inspection Lot " + oData.InspLotNo + " created", {
                icon: sap.m.MessageBox.Icon.INFORMATION,
                title: "Success",
                actions: [sap.m.MessageBox.Action.OK],
                onClose: function(oAction) {
                  //that.setDefaultFocus();
                  that.oJsModel.setProperty("/Lot", oData);
                  that.oJsModel.setProperty("/LotFound", true);
                  that.byId("idHeaderForm").bindElement("data>/Lot/");
                  that.readInspectionCharacteristics(oData.InspLotNo);
                  that._oCreateInspection.close();
                }
              }
            );

          },
          error: function(e) {
            that.oDataModel.fireBatchRequestFailed();
          }
        });

      }
      return true;

      // Save / Create Inspection Lot
      // close dialog on save & retrieve operation n mic for inspection lot
    },
    onBackDialog: function(oEvent) {
      this._oCreateInspection.close();
    }
  };
});