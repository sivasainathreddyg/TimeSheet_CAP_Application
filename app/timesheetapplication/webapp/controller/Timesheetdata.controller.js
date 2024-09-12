sap.ui.define(
    [
      "sap/ui/core/mvc/Controller",
      "sap/ui/model/json/JSONModel",
      "sap/ui/core/Fragment",
    ],
    function (Controller, JSONModel,Fragment) {
      "use strict";
      var that = this;
  
      return Controller.extend("timesheetapplication.controller.Timesheetdata", {
        onInit: function () {
          // that.component= this.getOwnerComponent().getRouter().initialize();
          this.array = [];
          that.oGmodel = this.getOwnerComponent().getModel("oGmodel");
          this.byId("FullName").setText(that.oGmodel.oData.loggedInUser.FullName);
          var oModel = new JSONModel({
            array: that.oGmodel.oData.odata.FULLNAME
          });
          this.getView().byId("usersComboBox").setModel(oModel);
          this.getView().byId("usersComboBox").setSelectedKey(that.oGmodel.oData.loggedInUser.FullName);
          that.oGmodel = this.getOwnerComponent().getModel("oGmodel");
          var sEmpID = that.oGmodel.oData.odata.EMPLOYEEID;
          // this.onFetchTimesheetData(sEmpID);
          this.getOwnerComponent().getRouter().getRoute("Timesheetdata").attachPatternMatched(this._onPatternMatched, this);
  
        },
        _onPatternMatched: function () {
          that.oGmodel = this.getOwnerComponent().getModel("oGmodel");
          this.byId("FullName").setText(that.oGmodel.oData.loggedInUser.FullName);
          var oModel = new JSONModel({
            array: that.oGmodel.oData.odata.FULLNAME
          });
          this.getView().byId("usersComboBox").setModel(oModel);
          this.getView().byId("usersComboBox").setSelectedKey(that.oGmodel.oData.loggedInUser.Email);
          var sEmpID = that.oGmodel.oData.odata.EMPLOYEEID;
          this.onFetchTimesheetData(sEmpID);
          if (that.oGmodel.oData.odata) {
            this.getView().mAggregations.content[0].mAggregations.footer.removeStyleClass("classFooterHidden").addStyleClass(
              "classFooterVisible");
            this.getView().byId("usersComboBox").setVisible(false);
          } else {
            this.getView().mAggregations.content[0].mAggregations.footer.removeStyleClass("classFooterVisible").addStyleClass(
              "classFooterHidden");
            this.getView().byId("usersComboBox").setVisible(false);
  
          }
          if (!that.oGmodel.oData['loggedInUser']) {
            this.getOwnerComponent().getRouter().navTo("RouteView");
            return;
          }
        },
        readDataFromBackend: function () {
  
        },
        onFetchTimesheetData: function (sEmployeeID) {
          var oModel = this.getOwnerComponent().getModel("oModel");
          var oParams = {
              empid: sEmployeeID
          };
      
          oModel.callFunction("/TimeSheetdata", {
              method: "GET",
              urlParameters: oParams,
              success: function (oData) {
                  try {
                      // Parse the JSON string returned by the server
                      var parsedData = JSON.parse(oData.TimeSheetdata);  // Parse the JSON string
                      
                      if (parsedData && parsedData.length > 0) {
                          // Create a new JSON model and set the parsed data
                          var oTimesheetModel = new sap.ui.model.json.JSONModel();
                          oTimesheetModel.setData({ timesheetData: parsedData });
                          this.getView().setModel(oTimesheetModel, "timesheetModel");
      
                          // sap.m.MessageToast.show("Timesheet data fetched successfully.");
                      } else {
                          sap.m.MessageToast.show("No timesheet data found for the employee.");
                      }
                  } catch (e) {
                      sap.m.MessageBox.error("No timesheet data found for the employee");
                  }
              }.bind(this),
              error: function (oError) {
                  sap.m.MessageBox.error("An error occurred while fetching timesheet data.");
              }
          });
      },
      oncreatenewtimesheet: function () {
              var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
              var selectedDateRange = "D";
              var sEmail = "E";
              var Status = "ST"
              oRouter.navTo("NewTimesheet", {
                  dateRange: selectedDateRange,
                  Status: Status,
                  sEmail: sEmail
              });
              // this.getOwnerComponent().getRouter().navTo("Timesheet2")
          },
      onRowPress: function (oEvent) {
              var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
              var selectedDateRange = oEvent.oSource.mAggregations.cells[1].mProperties.text;
              var selectedStatus = oEvent.oSource.mAggregations.cells[2].mProperties.text
              var sEmail = this.getView().byId("usersComboBox").getSelectedKey();
              oRouter.navTo("NewTimesheet", {
                  dateRange: selectedDateRange,
                  Status: selectedStatus,
                  sEmail: sEmail
              });
          },
        onHomePress: function () {
          this.getOwnerComponent().getRouter().navTo("RouteView")
        },
        CustomerHeader: function (oEvent) {
          var oSource = oEvent.getSource(),
            oview = this.getView();
          var data = this.getOwnerComponent().getModel("oGmodel");
          that.Email = data.oData['loggedInUser'].Email;
          that.FullName = data.oData['loggedInUser'].FullName;
    
          if (!this._Logoutpopover) {
            this._Logoutpopover = Fragment.load({
              id: oview.getId(),
              name: "timesheetapplication.Fragments.Headericon",
              controller: this
    
            }).then(function (oLogoutpopover) {
              oview.addDependent(oLogoutpopover);
              oview.byId("title").setText(that.FullName);
              oview.byId("email").setText(that.Email);
              return oLogoutpopover
    
            });
          }
          this._Logoutpopover.then(function (oLogoutpopover) {
            oview.byId("title").setText(that.FullName);
            oview.byId("email").setText(that.Email);
            if (oLogoutpopover.isOpen()) {
              oLogoutpopover.close();
            } else {
              oLogoutpopover.openBy(oSource)
            }
          })
        },
        HandleSignout: function () {
          this.getOwnerComponent().getRouter().navTo("RouteView");
          this.byId("emailInput").setValue("");
          this.byId("passwordInput").setValue("");
    
        },
      });
    }
  );