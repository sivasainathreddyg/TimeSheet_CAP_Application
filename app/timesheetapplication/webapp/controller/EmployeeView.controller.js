
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("timesheetapplication.controller.EmployeeView", {
        onInit: function () {
            // Load data from the backend
            this.getOwnerComponent().getRouter().getRoute("EmployeeView").attachPatternMatched(this._onPatternMatched, this);

        },
        _onPatternMatched: function () {
            this._loadEmployeeData();
        },
        _loadEmployeeData: function () {
            var oModel = this.getOwnerComponent().getModel("oModel");
            var that = this;

            oModel.callFunction("/retriveemployeedetails", {
                method: "GET",
                success: function (oData) {
                    var employeeData = JSON.parse(oData.retriveemployeedetails.data);
                    employeeData.forEach(function (employee) {
                        employee.isEditable = false;
                    });
                    var jsonModel = new JSONModel();
                    jsonModel.setData({ employees: employeeData });
                    that.getView().setModel(jsonModel, "employeeModel");
                },
                // Define the error callback
                error: function (err) {
                    console.error("Error retrieving employee details:", err);
                    sap.m.MessageToast.show("Failed to load employee data.");
                }
            });
        },
        onEditPress: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext("employeeModel");
            var oData = oContext.getObject();
            var bEditable = !oData.isEditable;

            // Toggle edit mode
            oData.isEditable = bEditable;
            oData.buttonText = bEditable ? "Save" : "Edit";

            // Update the model to reflect changes
            this.getView().getModel("employeeModel").refresh(true);

            // Handle save logic if in editable mode
            if (bEditable) {
                // Implement your save logic here
                // This could include sending updated data back to the backend
                // For example:
                // this._saveChanges(oData);
                MessageToast.show("Changes saved!"); // Placeholder for actual save logic
            }
        },

        // onAddEmployee: function() {
        //     // Logic to add a new employee can be implemented here
        //     MessageToast.show("Add Employee functionality to be implemented.");
        // },
        onAddEmployee: function () {
            // Get the employee model
            var oEmployeeModel = this.getView().getModel("employeeModel");
            var aEmployees = oEmployeeModel.getProperty("/employees");

            // Add a new empty row with isNew set to true
            aEmployees.push({
                EMPLOYEEID: "",
                FIRSTNAME: "",
                LASTNAME: "",
                DESIGNATION: "",
                PASSWORD: "",
                EMAILID: "",
                STARTDATE: "",
                ENDDATE: "",
                EMPLOYEESTATUS: "",
                EMPLOYEETYPE: "",
                MANAGERFLAG: "",
                isNew: true // Flag to identify as a new row
            });

            oEmployeeModel.setProperty("/employees", aEmployees);
        },
        onDeletePress: function (oEvent) {
            // Get the binding context of the selected row
            var oContext = oEvent.getSource().getBindingContext("employeeModel");
            var oEmployeeModel = this.getView().getModel("employeeModel");
            var aEmployees = oEmployeeModel.getProperty("/employees");

            // Find the index of the row to be deleted
            var iIndex = aEmployees.indexOf(oContext.getObject());
            if (iIndex !== -1) {
                aEmployees.splice(iIndex, 1);
                oEmployeeModel.setProperty("/employees", aEmployees);
            }
        },
        // onActionPress: function (oEvent) {
        //     var text = oEvent.getSource().getText();
        //     if (text === "Save") {
        //         this.oncreatenewemployee();
        //     } else {
        //         var oContext = oEvent.getSource().getBindingContext("employeeModel");
        //         var oEmployee = oContext.getObject();

        //         // Toggle the isEditable property
        //         oEmployee.isEditable = !oEmployee.isEditable;

        //         // Update the model to reflect changes in the UI
        //         oContext.getModel().refresh();
        //         // this.onEmployeeUpdate();
        //     }

        // },
        onActionPress: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext("employeeModel");
            var oEmployee = oContext.getObject();
            var text = oButton.getText();
        
            if (text === "Save") {
                this.oncreatenewemployee();
                // After saving, set isNew to false and isEdited to true
                oEmployee.isNew = false;
                oEmployee.isEdited = false; // Assuming the employee is now being edited
            } else if (text === "Update") {
                this.onEmployeeUpdate(oContext);
                // Optionally, set isEdited to false if you want to reset the state after update
                oEmployee.isNew = false;
                oEmployee.isEdited = false;
            } else { // This means text is "Edit"
                // Toggle the isEditable property
                oEmployee.isEditable = !oEmployee.isEditable;
                oEmployee.isNew = false;
                oEmployee.isEdited = true;
            }
        
            // Refresh the model to reflect changes in the UI
            oContext.getModel().refresh();
        },
        

        oncreatenewemployee: function () {
            // Define DateFormat instance for formatting
            var DateFormat = sap.ui.core.format.DateFormat.getInstance({
                pattern: "yyyy-MM-dd", // Desired date format
                strictParsing: true
            });

            // Get the data from the model
            var dataoModel = this.getView().getModel('employeeModel').getData();
            var length = dataoModel.employees.length - 1;
            var oModel = dataoModel.employees[length];

            // Validate required fields
            if (!oModel.EMPLOYEEID || !oModel.FIRSTNAME || !oModel.LASTNAME || !oModel.DESIGNATION ||
                !oModel.PASSWORD || !oModel.EMAILID || !oModel.STARTDATE || !oModel.ENDDATE ||
                !oModel.EMPLOYEESTATUS || !oModel.EMPLOYEETYPE) {

                // Show error message if any required field is empty
                sap.m.MessageBox.error("Please fill in all required fields.");
                return;
            }

            // Check if StartDate and EndDate are strings or Date objects
            var startDate = oModel.STARTDATE;
            var endDate = oModel.ENDDATE;

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
                EmployeeID: oModel.EMPLOYEEID,
                FirstName: oModel.FIRSTNAME,
                LastName: oModel.LASTNAME,
                Designation: oModel.DESIGNATION,
                Password: oModel.PASSWORD,
                EmailID: oModel.EMAILID,
                StartDate: formattedStartDate, // Use formatted date
                EndDate: formattedEndDate,     // Use formatted date
                EmployeeStatus: oModel.EMPLOYEESTATUS,
                EmployeeType: oModel.EMPLOYEETYPE,
                ManagerFlag: oModel.MANAGERFLAG
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
                    oModel.isNew = false;
                    this.getView().getModel('employeeModel').refresh();
                }.bind(this),
                error: function (oError) {
                    // Handle error
                    sap.m.MessageBox.error("An error occurred while Employee Details Creating..");
                }
            });
        },
        onEmployeeUpdate: function (oContext) {
            // Define DateFormat instance for formatting
            var DateFormat = sap.ui.core.format.DateFormat.getInstance({
                pattern: "yyyy-MM-dd", // Desired date format
                strictParsing: true
            });

            // Get the data from the model
            // var oModel = this.getView().getModel('employeeModel').getData();
            var oModel = oContext.getObject();

            // Validate required fields
            if (!oModel.EMPLOYEEID || !oModel.FIRSTNAME || !oModel.LASTNAME || !oModel.DESIGNATION ||
                !oModel.PASSWORD || !oModel.EMAILID || !oModel.STARTDATE || !oModel.ENDDATE ||
                !oModel.EMPLOYEESTATUS || !oModel.EMPLOYEETYPE) {

                // Show error message if any required field is empty
                sap.m.MessageBox.error("Please fill in all required fields.");
                return;
            }

            // Check if StartDate and EndDate are strings or Date objects
            var startDate = oModel.STARTDATE;
            var endDate = oModel.ENDDATE;

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
                EmployeeID: oModel.EMPLOYEEID,
                FirstName: oModel.FIRSTNAME,
                LastName: oModel.LASTNAME,
                Designation: oModel.DESIGNATION,
                Password: oModel.PASSWORD,
                EmailID: oModel.EMAILID,
                StartDate: formattedStartDate, // Use formatted date
                EndDate: formattedEndDate,     // Use formatted date
                EmployeeStatus: oModel.EMPLOYEESTATUS,
                EmployeeType: oModel.EMPLOYEETYPE,
                ManagerFlag: oModel.MANAGERFLAG
            };


            // Stringify the collected data
            var jsonString = JSON.stringify(newEmployeeData);

            var oModel = this.getOwnerComponent().getModel("oModel");

            oModel.callFunction("/UpdateEmployeeDeatils", {
                method: "GET",
                urlParameters: { updateemployeedata: jsonString },
                success: function (oData) {
                    // Handle success
                    sap.m.MessageToast.show("Employee Details Created successfully.");



                }.bind(this),
                error: function (oError) {
                    // Handle error
                    sap.m.MessageBox.error("An error occurred while Employee Details Creating..");
                }
            });
        },
    });
});
