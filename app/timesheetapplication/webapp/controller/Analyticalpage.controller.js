sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/viz/ui5/controls/VizFrame",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/controls/common/feeds/FeedItem",
    "sap/m/MessageToast"
], function (Controller, JSONModel, VizFrame, FlattenedDataset, FeedItem, MessageToast) {
    "use strict";

    return Controller.extend("timesheetapplication.controller.Analyticalpage", {
        onInit: function () {
            this.loadProjectData();
        },


        onProjectSelectionChange: function (oEvent) {
            var oModel = this.getOwnerComponent().getModel("oModel");
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var projectname = oSelectedItem.getText();
            var selectedProject = oEvent.getSource().getSelectedKey();

            var oParams = {
                projectid: selectedProject
            };


            // Fetch project details        
            oModel.callFunction("/projectdetails", {
                method: "GET",
                urlParameters: oParams,
                success: function (oData) {

                    this.createCharts(oData);
                }.bind(this),
                error: function () {
                    MessageToast.show("Failed to load project-specific data.");
                }
            });
        },

        createCharts: function (oData) {
            var projectData = JSON.parse(oData.projectdetails);
            var startDate = new Date(projectData[0].STARTDATE);
            var endDate = new Date(projectData[0].ENDDATE);
            var totalHours = projectData[0].TOTALHOURS;
            var remainingHours = projectData[0].REMAININGHOURS;
        
            // Clear existing charts
            var chartContainer = this.getView().byId("chartContainer");
            chartContainer.destroyItems();
        
            // Create an HBox to hold the charts horizontally
            var hBox = new sap.m.HBox({
                alignItems: "Start", // Align items horizontally
                justifyContent: "SpaceAround", // Space the charts evenly
                width: "auto" // Set auto width to fit all charts in the horizontal box
            });
        
            // Create a ScrollContainer to enable horizontal scrolling
            var oScrollContainer = new sap.m.ScrollContainer({
                horizontal: true, // Enable horizontal scrolling
                vertical: false,  // Disable vertical scrolling
                width: "100%",
                height: "600px",  // Adjust height according to your needs
                content: []       // Content will be added dynamically
            });
        
            // Loop through each month from start to end date
            for (var month = startDate.getMonth(); month <= endDate.getMonth(); month++) {
                var monthName = new Date(0, month).toLocaleString('default', { month: 'long' });
                var monthHours = this._getMonthlyHours(projectData[0], month + 1); // Adjust for correct month
                var monthremainingHours=this._getMonthlyRemainingHours(projectData[0],month+1)
        
                // Create the data for the chart
                var chartData = [{
                    Month: monthName,
                    TotalHours: totalHours, 
                    RemainingHours: monthremainingHours,
                    MonthHours: monthHours
                }];
        
                // Create a JSON model for the data
                var oChartModel = new sap.ui.model.json.JSONModel();
                oChartModel.setData(chartData);
        
                // Create a new VizFrame for each month
                var oVizFrame = new VizFrame({
                    width: "600px", // Set width to keep it aligned horizontally
                    height: "500px",
                    vizType: "column",
                    uiConfig: {
                        applicationSet: "fiori"
                    }
                });
        
                // Create a dataset for the VizFrame
                var oDataset = new FlattenedDataset({
                    dimensions: [{
                        name: "Month",
                        value: "{Month}"
                    }],
                    measures: [{
                        name: "Total Hours",
                        value: "{TotalHours}"
                    }, {
                        name: "Remaining Hours",
                        value: "{RemainingHours}"
                    }, {
                        name: "Billed Hours",
                        value: "{MonthHours}"
                    }],
                    data: {
                        path: "/"
                    }
                });
        
                // Set the dataset and model to the VizFrame
                oVizFrame.setDataset(oDataset);
                oVizFrame.setModel(oChartModel);
        
                // Enable tooltips and set chart title
                oVizFrame.setVizProperties({
                    title: {
                        visible: true,
                        text: monthName // Set the chart title for the particular month
                    },
                    plotArea: {
                        dataLabel: {
                            visible: true, // Show data labels on the chart
                            formatString: "#" // Use "#" to display full numbers (e.g., 1300 instead of 1.3k)
                        }
                    },
                    tooltip: {
                        visible: true // Enable tooltips for the chart
                    }
                });
                
        
                // Define the feeds
                oVizFrame.addFeed(new FeedItem({
                    uid: "valueAxis",
                    type: "Measure",
                    values: ["Total Hours", "Remaining Hours", "Billed Hours"]
                }));
                oVizFrame.addFeed(new FeedItem({
                    uid: "categoryAxis",
                    type: "Dimension",
                    values: ["Month"]
                }));
        
                // Add the VizFrame to the HBox (which holds all charts horizontally)
                hBox.addItem(oVizFrame);
            }
        
            // Add the HBox (with all charts) to the ScrollContainer
            oScrollContainer.addContent(hBox);
        
            // Add the ScrollContainer to the chartContainer
            chartContainer.addItem(oScrollContainer);
        },                
        // createCharts: function (oData) {
        //     var projectData = JSON.parse(oData.projectdetails);
        //     var startDate = new Date(projectData[0].STARTDATE);
        //     var endDate = new Date(projectData[0].ENDDATE);
        //     var totalHours = projectData[0].TOTALHOURS;
        //     var remainingHours = projectData[0].REMAININGHOURS;
        
        //     // Clear existing charts
        //     var chartContainer = this.getView().byId("chartContainer");
        //     chartContainer.destroyItems();
        
        //     // Create an HBox to hold the charts horizontally
        //     var hBox = new sap.m.HBox({
        //         alignItems: "Start", // Align items horizontally
        //         justifyContent: "SpaceAround", // Space the charts evenly
        //         width: "100%" // Full width
        //     });
        
        //     // Loop through each month from start to end date
        //     for (var month = startDate.getMonth(); month <= endDate.getMonth(); month++) {
        //         var monthName = new Date(0, month).toLocaleString('default', { month: 'long' });
        //         var monthHours = this._getMonthlyHours(projectData[0], month + 1); // Adjust for correct month
        
        //         // Create the data for the chart
        //         var chartData = [{
        //             Month: monthName,
        //             TotalHours: totalHours,
        //             RemainingHours: remainingHours,
        //             MonthHours: monthHours
        //         }];
        
        //         // Create a JSON model for the data
        //         var oChartModel = new sap.ui.model.json.JSONModel();
        //         oChartModel.setData(chartData);
        
        //         // Create a new VizFrame for each month
        //         var oVizFrame = new VizFrame({
        //             width: "300px", // Set width to keep it aligned horizontally
        //             height: "300px",
        //             vizType: "column",
        //             uiConfig: {
        //                 applicationSet: "fiori"
        //             }
        //         });
        
        //         // Create a dataset for the VizFrame
        //         var oDataset = new FlattenedDataset({
        //             dimensions: [{
        //                 name: "Month",
        //                 value: "{Month}"
        //             }],
        //             measures: [{
        //                 name: "Total Hours",
        //                 value: "{TotalHours}"
        //             }, {
        //                 name: "Remaining Hours",
        //                 value: "{RemainingHours}"
        //             }, {
        //                 name: "Hours for " + monthName,
        //                 value: "{MonthHours}"
        //             }],
        //             data: {
        //                 path: "/"
        //             }
        //         });
        
        //         // Set the dataset and model to the VizFrame
        //         oVizFrame.setDataset(oDataset);
        //         oVizFrame.setModel(oChartModel);
        
        //         // Define the feeds
        //         oVizFrame.addFeed(new FeedItem({
        //             uid: "valueAxis",
        //             type: "Measure",
        //             values: ["Total Hours", "Remaining Hours", "Hours for " + monthName]
        //         }));
        //         oVizFrame.addFeed(new FeedItem({
        //             uid: "categoryAxis",
        //             type: "Dimension",
        //             values: ["Month"]
        //         }));
        
        //         // Add the VizFrame to the HBox instead of directly to the chartContainer
        //         hBox.addItem(oVizFrame);
        //     }
        
        //     // Add the HBox (containing all the charts) to the chartContainer
        //     chartContainer.addItem(hBox);
        // },                

        // // Function to get monthly hours dynamically
        _getMonthlyHours: function (project, monthIndex) {
            var monthMapping = [
                "JANUARYHOURS", "FEBRUARYHOURS", "MARCHHOURS", "APRILHOURS",
                "MAYHOURS", "JUNEHOURS", "JULYHOURS", "AUGUSTHOURS",
                "SEPTEMBERHOURS", "OCTOBERHOURS", "NOVEMBERHOURS", "DECEMBERHOURS"
            ];
        
            // Adjust the monthIndex to map correctly (January is 1, but in array it is 0)
            var adjustedMonthIndex = monthIndex - 1;
        
            // Ensure the index is within bounds of the array
            if (adjustedMonthIndex >= 0 && adjustedMonthIndex < monthMapping.length) {
                // Return the hours for the specific month
                return project[monthMapping[adjustedMonthIndex]] || 0; // Default to 0 if undefined
            } else {
                return 0; // If the index is out of bounds, return 0
            }
        },
        _getMonthlyRemainingHours: function (project, monthIndex) {
            var monthMapping = [
                "JANUARYHOURSREMAINING", "FEBRUARYHOURSREMAINING", "MARCHHOURSREMAINING", "APRILHOURSREMAINING",
                "MAYHOURSREMAINING", "JUNEHOURSREMAINING", "JULYHOURSREMAINING", "AUGUSTHOURSREMAINING",
                "SEPTEMBERHOURSREMAINING", "OCTOBERHOURSREMAINING", "NOVEMBERHOURSREMAINING", "DECEMBERHOURSREMAINING"
            ];
        
            // Adjust the monthIndex to map correctly (January is 1, but in array it is 0)
            var adjustedMonthIndex = monthIndex - 1;
        
            // Ensure the index is within bounds of the array
            if (adjustedMonthIndex >= 0 && adjustedMonthIndex < monthMapping.length) {
                // Return the hours for the specific month
                return project[monthMapping[adjustedMonthIndex]] || 0; // Default to 0 if undefined
            } else {
                return 0; // If the index is out of bounds, return 0
            }
        },
        

        loadProjectData: function () {
            var oModel = this.getOwnerComponent().getModel("oModel");
            var that = this;

            // Perform OData read operation for project details
            oModel.callFunction("/Detailsofproject", {
                method: "GET",
                success: function (oData) {
                    // Parse the returned data
                    var projectData = JSON.parse(oData.Detailsofproject);

                    // Extract only the PROJECTNAME from the data
                    var projectNames = projectData.map(function (project) {
                        return {
                            PROJECTID: project.PROJECTID,
                            PROJECTNAME: project.PROJECTNAME
                        };
                    });

                    // Create JSON model and set the extracted project names data
                    var oProjectModel = new sap.ui.model.json.JSONModel();
                    oProjectModel.setData(projectNames);
                    that.getView().setModel(oProjectModel, "projectModel");
                },
                error: function (oError) {
                    sap.m.MessageToast.show("Failed to load project data.");
                }
            });
        },
    });
});
