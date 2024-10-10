sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
   "sap/m/MessageBox"
  ],
  function (Controller, JSONModel, Fragment,MessageBox) {
    "use strict";
    var that = this;

    return Controller.extend("timesheetapplication.controller.Timesheetdata", {
      onInit: function () {
        // that.component= this.getOwnerComponent().getRouter().initialize();
       
        this.array = [];
        that.oGmodel = this.getOwnerComponent().getModel("oGmodel");
       
        // this.byId("FullName").setText(that.oGmodel.oData.loggedInUser.FullName);
        // var oModel = new JSONModel({
        //   array: that.oGmodel.oData.odata.FULLNAME
        // });
        // this.getView().byId("usersComboBox").setModel(oModel);
        // this.getView().byId("usersComboBox").setSelectedKey(that.oGmodel.oData.loggedInUser.FullName);
        // that.oGmodel = this.getOwnerComponent().getModel("oGmodel");
        // var sEmpID = that.oGmodel.oData.odata.EMPLOYEEID;
        // this.onFetchTimesheetData(sEmpID);
        this.getOwnerComponent().getRouter().getRoute("Timesheetdata").attachPatternMatched(this._onPatternMatched, this);

      },
      _onPatternMatched: function () {
        
        that.oGmodel = this.getOwnerComponent().getModel("oGmodel");
        if (!that.oGmodel.oData['loggedInUser']) {
          this.getOwnerComponent().getRouter().navTo("RouteView");
          return;
        }
        this.byId("FullName").setText(that.oGmodel.oData.loggedInUser.FullName);
        var oModel = new JSONModel({
          array: that.oGmodel.oData.odata.FULLNAME
        });
        this.getView().byId("usersComboBox").setModel(oModel);
        this.getView().byId("usersComboBox").setSelectedKey(that.oGmodel.oData.loggedInUser.Email);
        var sEmpID = that.oGmodel.oData.odata.EMPLOYEEID;
        this.onFetchTimesheetData(sEmpID);
        if (!that.oGmodel.oData['loggedInUser']) {
          this.getOwnerComponent().getRouter().navTo("RouteView");
          return;
        }
        if (that.oGmodel.oData.odata.MANAGERFLAG === "No") {
          this.getView().byId("NewTimeSheet").setVisible(true);
          this.getView().mAggregations.content[0].mAggregations.footer.removeStyleClass("classFooterHidden").addStyleClass(
            "classFooterVisible");
          this.getView().byId("usersComboBox").setVisible(false);
        } else {
          this.getView().mAggregations.content[0].mAggregations.footer.removeStyleClass("classFooterVisible").addStyleClass(
            "classFooterHidden");
          this.getView().byId("NewTimeSheet").setVisible(false);
          this.getView().byId("usersComboBox").setVisible(true);

        }
       
      },

      // readDataFromBackend: function () {

      // },
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
                var oTimesheetModel = new sap.ui.model.json.JSONModel();

                var uniqueEmployeeNames = [...new Set(parsedData.map(item => item.EMPLOYEENAME))]; // Extract unique names of arraty

                var oComboBoxModel = new sap.ui.model.json.JSONModel();
                oComboBoxModel.setData({ employees: uniqueEmployeeNames.map(name => ({ name })) });
                this.getView().setModel(oComboBoxModel, "employeeModel");

                // sap.m.MessageToast.show("Timesheet data fetched successfully.");
              } else {
                sap.m.MessageToast.show("No timesheet data avalible");
              }
            } catch (e) {
              sap.m.MessageBox.error("No timesheet data avalible");
            }
          }.bind(this),
          error: function (oError) {
            sap.m.MessageBox.error("An error occurred while fetching timesheet data.");
          }
        });
      },
      onSelectusername: function (oEvent) {
        // Get the selected employee name from the ComboBox
        var sSelectedEmployeeName = oEvent.getSource().getSelectedItem() ? oEvent.getSource().getSelectedItem().getKey() : "";

        // Get the timesheet model
        var oTable = this.getView().byId("timesheetTable");
        var oBinding = oTable.getBinding("items");

        // If the selected key is empty, reset the filter to show all data
        if (sSelectedEmployeeName === "") {
          oBinding.filter([]);  // Remove all filters, showing all data
        } else {
          // Create a new filter to filter timesheet data based on employee name
          var oFilter = new sap.ui.model.Filter("EMPLOYEENAME", sap.ui.model.FilterOperator.EQ, sSelectedEmployeeName);

          // Apply the filter to the table's binding
          oBinding.filter([oFilter]);
        }
      },
      onBefore: function () {
        // Check for unsaved changes before rendering the view (on refresh or navigate)
        if (true) {
          sap.m.MessageBox.confirm("You have unsaved changes. Do you want to proceed without saving?", {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: function (oAction) {
              if (oAction === MessageBox.Action.YES) {
                this.getOwnerComponent().getRouter().navTo("RouteView"); // Navigate to login
              } else {
                // Stay on the current page
              }
            }.bind(this)
          });
        }
      },

      oncreatenewtimesheet: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        var selectedDateRange = "D";
        var sEmail = "E";
        var Status = "ST";
        var submitted="SB";
        var sdate="DT"
        oRouter.navTo("NewTimesheet", {
          dateRange: selectedDateRange,
          Status: Status,
          Name: sEmail,
          submit:submitted,
          Sdate:sdate
        });
        // this.getOwnerComponent().getRouter().navTo("Timesheet2")
      },
      onRowPress: function (oEvent) {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        var items=oEvent.getSource().getBindingContext("timesheetModel").getObject();
        // var sName=oEvent.oSource.mAggregations.cells[0].mProperties.text;
        // var selectedDateRange = oEvent.oSource.mAggregations.cells[1].mProperties.text;
        // var selectedStatus = oEvent.oSource.mAggregations.cells[2].mProperties.text
        var sName=items.EMPLOYEENAME;
        var selectedDateRange =items.PERIOD;
        var selectedStatus = items.STATUS;
        var submitted=items.SUBMITTEDBY;
        var sdate=items.DATE;
        // var sEmail="E"
        // var sEmail = this.getView().byId("usersComboBox").getSelectedKey();
        oRouter.navTo("NewTimesheet", {
          dateRange: selectedDateRange,
          Status: selectedStatus,
          Name: sName,
          submit:submitted,
          Sdate:sdate
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