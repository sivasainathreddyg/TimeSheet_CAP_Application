// 
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";
    var that = this;

    return Controller.extend("timesheetapplication.controller.View", {
        onInit: function () {
            that.component = this.getOwnerComponent().getRouter().initialize();
            var oComponent = this.getOwnerComponent();
            that.oGmodel = oComponent.getModel("oGmodel");
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

            oModel.refreshMetadata()
                .then(function () {
                    console.log("Metadata refreshed successfully.");
                    // Proceed with your function call or any further logic here
                })
                .catch(function (error) {
                    console.error("Error refreshing metadata:", error);
                });

            if (!sEmail || !sPassword) {
                MessageBox.error("Please enter both email and password.");
                return;
            }
            var oModel = this.getView().getModel("oModel");
            var oParams = {
                email: sEmail,
                password: sPassword
            };

            oModel.callFunction("/checkCredentials", {
                method: "GET",
                urlParameters: oParams,
                success: function (oData, response) {
                    if (response.data !== true) {
                        MessageToast.show("Success! Credentials are valid.");
                        that.oGmodel.setData({
                            loggedInUser: {
                                Email: oData.EMAILID,
                                FullName: oData.FULLNAME,
                                MANAGERFLAG: oData.MANAGERFLAG
                            },
                            odata: oData
                        });
                        that.component.navTo("Timesheetdata");
                    } else {
                        MessageBox.error("Invalid credentials. Please try again.");
                    }
                },
                error: function (oError) {
                    MessageBox.error("An error occurred while checking credentials.");
                }
            });
        }
    });
});
