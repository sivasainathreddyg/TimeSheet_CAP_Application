sap.ui.define([
    "sap/ui/core/mvc/Controller",
     "sap/m/MessageBox"
],
function (Controller) {
    "use strict";
    var that=this;



    return Controller.extend("maintenanceapplications.controller.View", {
        onInit: function () {
            that.component = this.getOwnerComponent().getRouter().initialize();
           
           
            that.busyDialog = new sap.m.BusyDialog();
            that.busyDialog.setBusyIndicatorDelay(0);
            that.busyDialog.setBusyIndicatorSize("Large");
            that.busyDialog.open();
            setTimeout(() => {
                that.busyDialog.close();
            }, 5000);

        },
        onSignUpPress: function () {
            var oView = this.getView();
            var sEmail = oView.byId("emailInput").getValue();
            var sPassword = oView.byId("passwordInput").getValue();
            var oModel = this.getOwnerComponent().getModel("oModel");
        
            // Ensure email and password fields are not empty
            if (!sEmail || !sPassword) {
                sap.m.MessageBox.error("Please enter both email and password.");
                return;
            }
        
            var oParams = {
                email: sEmail,
                password: sPassword
            };
        
            // Call the function "Authorizechecking" on the backend
            oModel.callFunction("/Authorizechecking", {
                method: "GET",
                urlParameters: oParams,
                success: function (oData, response) {
                    // Check if manager flag is valid and successful login
                    if (response.statusCode === "200" && oData.Authorizechecking === "success") {
                        sap.m.MessageToast.show("Login successful! Redirecting...");
        
                        // Navigate to another view (assuming View1)
                        that.component.navTo("RouteView1");
                    } else if (response.statusCode === 403) {
                        // Unauthorized user, manager privileges required
                        sap.m.MessageBox.error("Unauthorized user: You do not have manager privileges.");
                    } else {
                        // Invalid credentials
                        sap.m.MessageBox.error("Invalid credentials. Please try again.");
                    }
                }.bind(this), // Bind this to retain context
                error: function (oError) {
                    // Handle errors from the backend
                    if (oError.statusCode === 401) {
                        sap.m.MessageBox.error("Invalid credentials. Please try again.");
                    } else {
                        sap.m.MessageBox.error("An error occurred while checking credentials.");
                    }
                }
            });
        }
        
    });
});
  