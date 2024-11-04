
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function(Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("timesheetapplication.controller.EmployeeView", {
        onInit: function() {
            // Load data from the backend
            this.getOwnerComponent().getRouter().getRoute("EmployeeView").attachPatternMatched(this._onPatternMatched, this);
            
        },
        _onPatternMatched:function(){
            this._loadEmployeeData();    
        },
        _loadEmployeeData: function() {
            var oModel = this.getOwnerComponent().getModel("oModel");
            var that = this; 
        
            oModel.callFunction("/retriveemployeedetails", {
                method: "GET",
                success: function(oData) {
                    var employeeData = JSON.parse(oData.retriveemployeedetails.data); 
                    var jsonModel = new JSONModel();
                    jsonModel.setData({ employees: employeeData }); 
                    that.getView().setModel(jsonModel, "employeeModel"); 
                },
                // Define the error callback
                error: function(err) {
                    console.error("Error retrieving employee details:", err); 
                    sap.m.MessageToast.show("Failed to load employee data."); 
                }
            });
        },        
        onEditPress: function(oEvent) {
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

        onAddEmployee: function() {
            // Logic to add a new employee can be implemented here
            MessageToast.show("Add Employee functionality to be implemented.");
        }
    });
});
