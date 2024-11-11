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
            sap.m.MessageBox.information("Select any project from the Combobox to see the analytical view.");

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
        //         width: "auto" // Set auto width to fit all charts in the horizontal box
        //     });

        //     // Create a ScrollContainer to enable horizontal scrolling
        //     var oScrollContainer = new sap.m.ScrollContainer({
        //         horizontal: true, // Enable horizontal scrolling
        //         vertical: false,  // Disable vertical scrolling
        //         width: "100%",
        //         height: "100%",  // Adjust height according to your needs
        //         content: []       // Content will be added dynamically
        //     });

        //     // Loop through each month from start to end date
        //     for (var month = startDate.getMonth(); month <= endDate.getMonth(); month++) {
        //         var monthName = new Date(0, month).toLocaleString('default', { month: 'long' });
        //         var monthHours = this._getMonthlyHours(projectData[0], month + 1); // Adjust for correct month
        //         var monthremainingHours = this._getMonthlyRemainingHours(projectData[0], month + 1)

        //         // Create the data for the chart
        //         var chartData = [{
        //             Month: monthName,
        //             TotalHours: totalHours,
        //             RemainingHours: monthremainingHours,
        //             MonthHours: monthHours
        //         }];

        //         // Create a JSON model for the data
        //         var oChartModel = new sap.ui.model.json.JSONModel();
        //         oChartModel.setData(chartData);

        //         // Create a new VizFrame for each month
        //         var oVizFrame = new VizFrame({
        //             width: "600px", // Set width to keep it aligned horizontally
        //             height: "600px",
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
        //                 name: "Billed Hours",
        //                 value: "{MonthHours}"
        //             }],
        //             data: {
        //                 path: "/"
        //             }
        //         });

        //         // Set the dataset and model to the VizFrame
        //         oVizFrame.setDataset(oDataset);
        //         oVizFrame.setModel(oChartModel);

        //         // Enable tooltips and set chart title
        //         oVizFrame.setVizProperties({
        //             title: {
        //                 visible: true,
        //                 text: monthName // Set the chart title for the particular month
        //             },
        //             plotArea: {
        //                 dataLabel: {
        //                     visible: true, // Show data labels on the chart
        //                     formatString: "#" // Use "#" to display full numbers (e.g., 1300 instead of 1.3k)
        //                 }
        //             },
        //             tooltip: {
        //                 visible: true // Enable tooltips for the chart
        //             }
        //         });


        //         // Define the feeds
        //         oVizFrame.addFeed(new FeedItem({
        //             uid: "valueAxis",
        //             type: "Measure",
        //             values: ["Total Hours", "Remaining Hours", "Billed Hours"]
        //         }));
        //         oVizFrame.addFeed(new FeedItem({
        //             uid: "categoryAxis",
        //             type: "Dimension",
        //             values: ["Month"]
        //         }));

        //         // Add the VizFrame to the HBox (which holds all charts horizontally)
        //         hBox.addItem(oVizFrame);
        //     }

        //     // Add the HBox (with all charts) to the ScrollContainer
        //     oScrollContainer.addContent(hBox);

        //     // Add the ScrollContainer to the chartContainer
        //     chartContainer.addItem(oScrollContainer);
        // },
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
                height: "100%",  // Adjust height according to your needs
                content: []       // Content will be added dynamically
            });
        
            // Loop through each month from start to end date
            for (var month = startDate.getMonth(); month <= endDate.getMonth(); month++) {
                var monthName = new Date(0, month).toLocaleString('default', { month: 'long' });
                var monthHours = this._getMonthlyHours(projectData[0], month + 1); // Adjust for correct month
                var monthremainingHours = this._getMonthlyRemainingHours(projectData[0], month + 1)
        
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
                    height: "600px",
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
        onHomePress: function () {
            this.getOwnerComponent().getRouter().navTo("Tileview");
        },
        // onDownloadanalyticalgraph: function () {
        //     // var chartContainer = this.getView().byId("chartContainer");  // Ensure this is the correct container
        //     var oVizFrame = this.getView().byId("chartContainer");

        //     // Use html2canvas to capture the chart
        //     html2canvas(oVizFrame.getDomRef()).then(function (canvas) {
        //         // Convert canvas to a PNG image
        //         var link = document.createElement("a");
        //         link.href = canvas.toDataURL("image/png");
        //         link.download = "chart.png";
        //         link.click();
        //     }).catch(function (error) {
        //         console.error("Error capturing chart: ", error);
        //     });
        // }


        

        // onDownloadanalyticalgraph: function() {
        //     var doc =  new window.jspdf.jsPDF(); 
        //     var hBox = this.getView().byId("chartContainer").getItems()[0].getContent()[0]; // Assuming your HBox is the first item in chartContainer

        //     var promises = [];
        //     var index = 0; // To keep track of the position in the PDF
        
        //     hBox.getItems().forEach(function(chart) {
        //         // Ensure each chart is rendered before capturing
        //         promises.push(new Promise(function(resolve) {
        //             // Use html2canvas to render the chart
        //             html2canvas(chart.getDomRef()).then(function(canvas) {
        //                 var imgData = canvas.toDataURL("image/png");
        //                 doc.addImage(imgData, 'PNG', 10, 10 + index * 70, 180, 60); // Adjust position and size accordingly
        //                 index++; // Increment index for the next chart position
        //                 resolve();
        //             });
        //         }));
        //     });
        
        //     // Once all charts are captured, save the PDF
        //     Promise.all(promises).then(function() {
        //         doc.save('charts.pdf');
        //     });
        
        // }

        // onDownloadanalyticalgraph: function() {
        //     var doc = new window.jspdf.jsPDF(); 
        //     var hBox = this.getView().byId("chartContainer").getItems()[0].getContent()[0]; // Assuming your HBox is the first item in chartContainer
        
        //     var promises = [];
            
        //     hBox.getItems().forEach(function(chart, index) {
        //         // Ensure each chart is rendered before capturing
        //         promises.push(new Promise(function(resolve) {
        //             // Use html2canvas to render the chart
        //             html2canvas(chart.getDomRef()).then(function(canvas) {
        //                 var imgData = canvas.toDataURL("image/png");
                        
        //                 // Calculate positioning for the image on the PDF
        //                 var imgWidth = 180; // Desired width of the image
        //                 var imgHeight = 100; // Adjusted height for the image
        
        //                 // Check if the current index is more than 0, if yes, add a new page
        //                 if (index > 0) {
        //                     doc.addPage(); // Add new page for each chart after the first
        //                 }
        
        //                 // Add the image to the PDF
        //                 doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight); // Adjust position and size accordingly
        //                 resolve();
        //             });
        //         }));
        //     });
        
        //     // Once all charts are captured, save the PDF
        //     Promise.all(promises).then(function() {
        //         doc.save('charts.pdf');
        //     });
        // }

        // onDownloadanalyticalgraph: function() {
        //     var doc = new window.jspdf.jsPDF(); 
        //     var hBox = this.getView().byId("chartContainer").getItems()[0].getContent()[0]; // Assuming your HBox is the first item in chartContainer
        
        //     var promises = [];
        //     var chartPerPage = 2; // Number of charts per page
        //     var index = 0; // To keep track of the number of charts added to the current page
        
        //     hBox.getItems().forEach(function(chart) {
        //         // Ensure each chart is rendered before capturing
        //         promises.push(new Promise(function(resolve) {
        //             // Use html2canvas to render the chart
        //             html2canvas(chart.getDomRef()).then(function(canvas) {
        //                 var imgData = canvas.toDataURL("image/png");
        
        //                 // Calculate positioning for the image on the PDF
        //                 var imgWidth = 90; // Desired width of each image
        //                 var imgHeight = 100; // Adjusted height for the image
        //                 var margin = 10; // Margin between charts
        
        //                 // Calculate x position for the image based on index
        //                 var xPos = (index % chartPerPage) * (imgWidth + margin) + 10; // Space charts horizontally
        //                 var yPos = Math.floor(index / chartPerPage) * (imgHeight + margin) + 10; // Space charts vertically
        
        //                 // Check if the current index is more than 0 and if it's the start of a new page
        //                 if (index > 0 && index % chartPerPage === 0) {
        //                     doc.addPage(); // Add a new page for every two charts
        //                 }
        
        //                 // Add the image to the PDF
        //                 doc.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight); // Add chart image to PDF
        //                 index++; // Increment index for the next chart position
        //                 resolve();
        //             });
        //         }));
        //     });
        
        //     // Once all charts are captured, save the PDF
        //     Promise.all(promises).then(function() {
        //         doc.save('charts.pdf');
        //     });
        // }

        onDownloadanalyticalgraph: function() {
            var that = this; // Keep reference to the controller
            that.busyDialog = new sap.m.BusyDialog();
            that.busyDialog.setBusyIndicatorDelay(0);
            that.busyDialog.setBusyIndicatorSize("Large");
            that.busyDialog.open();
        
            // Create a new jsPDF instance
            var doc = new window.jspdf.jsPDF(); 
            var hBox = this.getView().byId("chartContainer").getItems()[0].getContent()[0]; // Assuming your HBox is the first item in chartContainer
        
            var promises = [];
            var chartPerPage = 2; // Number of charts per page
            var index = 0; // To keep track of the number of charts added to the current page
        
            // Get the selected project name from the ComboBox
            var projectComboBox = this.getView().byId("projectComboBox"); // Ensure this ID matches your ComboBox's ID
            var projectName = projectComboBox.getSelectedItem().getText(); // Get the selected item's text
        
            hBox.getItems().forEach(function(chart) {
                // Ensure each chart is rendered before capturing
                promises.push(new Promise(function(resolve) {
                    // Use html2canvas to render the chart
                    html2canvas(chart.getDomRef()).then(function(canvas) {
                        var imgData = canvas.toDataURL("image/png");
        
                        // Calculate positioning for the image on the PDF
                        var imgWidth = 180; // Desired width of each image
                        var imgHeight = 100; // Adjusted height for the image
                        var margin = 10; // Margin between charts
                        var titleMargin = 5; // Margin between title and chart
        
                        // Calculate y position for the image based on index
                        var yPos = (index % chartPerPage) * (imgHeight + margin + titleMargin + 10) + 10; // Space charts vertically
        
                        // Check if the current index is more than 0 and if it's the start of a new page
                        if (index > 0 && index % chartPerPage === 0) {
                            doc.addPage(); // Add a new page for every two charts
                        }
        
                        // Add the project name as a title
                        doc.setFontSize(12); // Set font size for the title
                        doc.text(10, yPos, projectName); // Add the project name above the chart
        
                        // Add the image to the PDF
                        doc.addImage(imgData, 'PNG', 10, yPos + titleMargin, imgWidth, imgHeight); // Add chart image below the title
                        index++; // Increment index for the next chart position
                        resolve();
                    });
                }));
            });
        
            // Once all charts are captured, save the PDF
            Promise.all(promises).then(function() {
                doc.save('charts.pdf');
                that.busyDialog.close(); // Close the busy dialog after saving
            }).catch(function(error) {
                console.error("Error generating PDF:", error);
                that.busyDialog.close(); // Ensure busy dialog is closed even if there's an error
            });
        
            // Optional: Close the busy dialog after a timeout if needed
            // setTimeout(() => {
            //     that.busyDialog.close();
            // }, 5000);
        }
        
        


//         Vertical Arrangement:

// The y position is calculated with yPos = (index % chartPerPage) * (imgHeight + margin) + 10, 
// allowing the charts to be stacked vertically on the page.
// Page Break Logic:

// The condition if (index > 0 && index % chartPerPage === 0) ensures that a new page is added after every two charts, allowing for a vertical layout.
// Image Sizing:

// Adjust imgWidth and imgHeight as needed to ensure the charts fit well on the PDF pages.
        
        
        
        















    });
});
