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
  
      return Controller.extend("timesheetapplication.controller.Tileview", {
        onInit: function() {
        that.component = this.getOwnerComponent().getRouter().initialize(); 
        this.array = [];
        that.oGmodel = this.getOwnerComponent().getModel("oGmodel");
        this.getOwnerComponent().getRouter().getRoute("Tileview").attachPatternMatched(this._onPatternMatched, this);
        },
        _onPatternMatched: function () {
        
            that.oGmodel = this.getOwnerComponent().getModel("oGmodel");
            if (!that.oGmodel.oData['loggedInUser']) {
              this.getOwnerComponent().getRouter().navTo("RouteView");
              return;
            }
            this.byId("FullNames").setText(that.oGmodel.oData.loggedInUser.FullName);
            var oModel = new JSONModel({
              array: that.oGmodel.oData.odata.FULLNAME
            });
            // this.getView().byId("usersComboBox").setModel(oModel);
            // this.getView().byId("usersComboBox").setSelectedKey(that.oGmodel.oData.loggedInUser.Email);
            var sEmpID = that.oGmodel.oData.odata.EMPLOYEEID;
            // this.onFetchTimesheetData(sEmpID);
            if (!that.oGmodel.oData['loggedInUser']) {
              this.getOwnerComponent().getRouter().navTo("RouteView");
              return;
            }
            
           
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
          onTimeSheetView:function(){
            that.component.navTo("Timesheetdata");
          },
          onAnalyticalView:function(){
            that.component.navTo("Analyticalpage");
          }
      });
    }
  );
  