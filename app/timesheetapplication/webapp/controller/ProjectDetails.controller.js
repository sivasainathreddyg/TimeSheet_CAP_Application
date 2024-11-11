sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("timesheetapplication.controller.ProjectDetails", {
        onInit: function () {
            // Load data from the backend
            this.getOwnerComponent().getRouter().getRoute("ProjectDetails").attachPatternMatched(this._onPatternMatched, this);

        },
        _onPatternMatched: function () {
            this._loadProjectDetailsData();
        },
        _loadProjectDetailsData: function () {
            var oModel = this.getOwnerComponent().getModel("oModel");
            var that = this;

            oModel.callFunction("/retriveProjectDetailsData", {
                method: "GET",
                success: function (oData) {
                    var projectdetailsdata = JSON.parse(oData.retriveProjectDetailsData.data);
                    projectdetailsdata.forEach(function (projectdetails) {
                        projectdetails.isEditable = false;
                    });
                    var jsonModel = new JSONModel();
                    jsonModel.setData({ projectdetails: projectdetailsdata });
                    that.getView().setModel(jsonModel, "projectdetailsdataModel");
                },
                // Define the error callback
                error: function (err) {
                    console.error("Error retrieving employee details:", err);
                    sap.m.MessageToast.show("Failed to load employee data.");
                }
            });
        },
        onBackPressEmployeepage:function(){
            this.getOwnerComponent().getRouter().navTo("Tileview");
        },
        onAddProject:function(){
            var projectmodel=this.getView().getModel("projectdetailsdataModel");
            var projectdata=projectmodel.getProperty("/projectdetails");
            projectdata.push({
                PROJECTID:"",
                KY:"",
                PROJECTNAME:"",
                DEPARTMENT:"",
                STARTDATE:"",
                ENDDATE:"",
                TOTALHOURS:"",
                REMAININGHOURS:"",
                isNew: true

            })
            projectmodel.setProperty("/projectdetails",projectdata);
        },
        onActionPress: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext("projectdetailsdataModel");
            var oEmployee = oContext.getObject();
            var text = oButton.getText();
        
            if (text === "Save") {
                this.oncreatenewemployee(oContext);
                // After saving, set isNew to false and isEdited to true
                 // Assuming the employee is now being edited
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
        oncreatenewemployee: function (oContext) {
            // Define DateFormat instance for formatting
            var DateFormat = sap.ui.core.format.DateFormat.getInstance({
                pattern: "yyyy-MM-dd", // Desired date format
                strictParsing: true
            });

            // Get the data from the model
            // var dataoModel = this.getView().getModel('projectdetailsdataModel').getData();
            // var oContext=dataoModel
            var oModel = oContext.getObject();
            var oEmployee = oContext.getObject();


            // Validate required fields
            if (!oModel.PROJECTID || !oModel.KY || !oModel.PROJECTNAME || !oModel.DEPARTMENT ||
                !oModel.STARTDATE || !oModel.ENDDATE ||
                !oModel.TOTALHOURS || !oModel.REMAININGHOURS) {

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
            var newprojectdetailsData = {
                PROJECTID: oModel.PROJECTID,
                KY: oModel.KY,
                PROJECTNAME: oModel.PROJECTNAME,
                DEPARTMENT: oModel.DEPARTMENT,
                StartDate: formattedStartDate, // Use formatted date
                EndDate: formattedEndDate,     // Use formatted date
                TOTALHOURS: oModel.TOTALHOURS,
                REMAININGHOURS: oModel.REMAININGHOURS,
                STATUS:oModel.STATUS
            };

            // Stringify the collected data
            var jsonString = JSON.stringify(newprojectdetailsData);

            var oModel = this.getOwnerComponent().getModel("oModel");

            oModel.callFunction("/CreateNewProjectDeatils", {
                method: "GET",
                urlParameters: { NewprojectdetailsData: jsonString },
                success: function (oData) {
                    // Handle success
                    sap.m.MessageToast.show("project Details Created successfully.");
                    oEmployee.isNew = false;
                oEmployee.isEdited = false;
                    oModel.isNew = false;
                    this.getView().getModel('projectdetailsdataModel').refresh();
                }.bind(this),
                error: function (oError) {
                    // Handle error
                    sap.m.MessageBox.error("An error occurred while project Details Creating..");
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
            if (!oModel.PROJECTID || !oModel.KY || !oModel.PROJECTNAME || !oModel.DEPARTMENT ||
                !oModel.STARTDATE || !oModel.ENDDATE ||
                !oModel.TOTALHOURS || !oModel.REMAININGHOURS) {

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
            var updateprojectdetailsData = {
                PROJECTID: oModel.PROJECTID,
                KY: oModel.KY,
                PROJECTNAME: oModel.PROJECTNAME,
                DEPARTMENT: oModel.DEPARTMENT,
                StartDate: formattedStartDate, // Use formatted date
                EndDate: formattedEndDate,     // Use formatted date
                TOTALHOURS: oModel.TOTALHOURS,
                REMAININGHOURS: oModel.REMAININGHOURS,
              
            };



            // Stringify the collected data
            var jsonString = JSON.stringify(updateprojectdetailsData);

            var oModel = this.getOwnerComponent().getModel("oModel");

            oModel.callFunction("/UpdateProjectDeatils", {
                method: "GET",
                urlParameters: { updateprojectdetailsData: jsonString },
                success: function (oData) {
                    // Handle success
                    sap.m.MessageToast.show("Project Details Updated successfully.");



                }.bind(this),
                error: function (oError) {
                    // Handle error
                    sap.m.MessageBox.error("An error occurred while project Details Creating..");
                }
            });
        },
        onDeletePress:function(oEvent){
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext("projectdetailsdataModel");
            var oModel = oContext.getObject();

            var PROJECTID=oModel.PROJECTID;
            var oModel = this.getOwnerComponent().getModel("oModel");

            oModel.callFunction("/DeleteprojectDetails", {
                method: "GET",
                urlParameters: { PROJECTID: PROJECTID },
                success: function (oData) {
                    // Handle success
                    sap.m.MessageToast.show("project Details Deleted successfully.");



                }.bind(this),
                error: function (oError) {
                    // Handle error
                    sap.m.MessageBox.error("An error occurred while project Details Deleating..");
                }
            });


        }

    });
});