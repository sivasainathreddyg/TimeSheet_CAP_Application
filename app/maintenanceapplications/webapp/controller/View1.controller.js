// sap.ui.define([
//     "sap/ui/core/mvc/Controller"
// ],
// function (Controller) {
//     "use strict";

//     return Controller.extend("maintenanceapplications.controller.View1", {
//         onInit: function () {

//         }
//     });
// });

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, Fragment) {
    "use strict";

    return Controller.extend("maintenanceapplications.controller.View1", {

        onInit: function () {
            this.getView().setModel(new JSONModel(), "newEmployeeModel");
        },

        // When "New Employee" button is pressed
        onNewEmployeePress: function () {
            if (!this.newEmployeeDialog) {
                this.newEmployeeDialog = sap.ui.xmlfragment("maintenanceapplications.Fragments.NewEmployee", this);
                this.getView().addDependent(this.newEmployeeDialog);
            }
            this.newEmployeeDialog.open();
        },

        // Submit new employee data to backend
        onNewEmployeeSubmit: function () {
            // Define DateFormat instance for formatting
            var DateFormat = sap.ui.core.format.DateFormat.getInstance({
                pattern: "yyyy-MM-dd", // Desired date format
                strictParsing: true
            });
        
            // Get the data from the model
            var oModel = this.getView().getModel('newEmployeeModel').getData();
        
            // Validate required fields
            if (!oModel.EmployeeID || !oModel.FirstName || !oModel.LastName || !oModel.Designation ||
                !oModel.Password || !oModel.EmailID || !oModel.StartDate || !oModel.EndDate ||
                !oModel.EmployeeStatus || !oModel.EmployeeType) {
        
                // Show error message if any required field is empty
                sap.m.MessageBox.error("Please fill in all required fields.");
                return;
            }
        
            // Check if StartDate and EndDate are strings or Date objects
            var startDate = oModel.StartDate;
            var endDate = oModel.EndDate;
        
            // If the dates are strings like "MM/DD/YY", parse them into JavaScript Date objects
            if (typeof startDate === "string") {
                startDate = new Date(startDate); // Convert string to Date object
            }
            if (typeof endDate === "string") {
                endDate = new Date(endDate); // Convert string to Date object
            }
        
            // Format start and end dates (only if they exist)
            var formattedStartDate = startDate ? DateFormat.format(startDate) : "";
            var formattedEndDate = endDate ? DateFormat.format(endDate) : "";
        
            // Collect new employee data
            var newEmployeeData = {
                EmployeeID: oModel.EmployeeID,
                FirstName: oModel.FirstName,
                LastName: oModel.LastName,
                Designation: oModel.Designation,
                Password: oModel.Password,
                EmailID: oModel.EmailID,
                StartDate: formattedStartDate, // Use formatted date
                EndDate: formattedEndDate,     // Use formatted date
                EmployeeStatus: oModel.EmployeeStatus,
                EmployeeType: oModel.EmployeeType,
                ManagerFlag: oModel.ManagerFlag ? "Yes" : "No"
            };
        
            // Stringify the collected data
            var jsonString = JSON.stringify(newEmployeeData);
        
            var oModel = this.getOwnerComponent().getModel("oModel");
        
            oModel.callFunction("/CreateNewEmployeeDeatils", {
                method: "GET",
                urlParameters: { NewEmployeeData: jsonString },
                success: function (oData) {
                    // Handle success
                    sap.m.MessageToast.show("Employee Details Created successfully.");
        
                    // Close the dialog
                    this.newEmployeeDialog.close();
        
                    // Clear the form values by resetting the model data
                    var newEmployeeModel = this.getView().getModel('newEmployeeModel');
                    newEmployeeModel.setData({
                        EmployeeID: "",
                        FirstName: "",
                        LastName: "",
                        Designation: "",
                        Password: "",
                        EmailID: "",
                        StartDate: null, // Use null for DatePickers
                        EndDate: null,
                        EmployeeStatus: "",
                        EmployeeType: "",
                        ManagerFlag: false // Reset checkbox
                    });
        
                    // Update bindings after clearing the model
                    newEmployeeModel.updateBindings();
        
                }.bind(this),
                error: function (oError) {
                    // Handle error
                    sap.m.MessageBox.error("An error occurred while Employee Details Creating..");
                }
            });
        },        


        onCancelNewEmployee: function () {
            this.newEmployeeDialog.close();
        },

        // When "Existed Employee" button is pressed
        onExistedEmployeePress: function () {
            if (!this.existedEmployeeDialog) {
                this.existedEmployeeDialog = sap.ui.xmlfragment("maintenanceapplications.Fragments.ExistedEmployee", this);
                this.getView().addDependent(this.existedEmployeeDialog);
            }
            this.existedEmployeeDialog.open();
        },

        

        onCancelEditEmployee: function () {
            this.existedEmployeeDialog.close();
        }

    });
});

