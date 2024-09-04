sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox"
	],
	function (Controller,JSONModel,MessageToast,MessageBox,Fragment) {
		"use strict";
        var that=this;
		return Controller.extend("timesheetapplication.controller.NewTimesheet", {
			onInit: function () {
				this.array = [];
				that.oGmodel = this.getOwnerComponent().getModel("oGmodel");
				this.byId("FullName").setText(that.oGmodel.oData.loggedInUser.FullName);
				var oModel = new JSONModel({
					array: that.oGmodel.oData.odata
				});
				//this.getView().byId("usersComboBox").setModel(oModel);
				// this.getView().byId("usersComboBox").setSelectedKey(that.oGmodel.oData.odata.results[0].Email);
	
				that.oModel = new JSONModel({
					//currentStartDate: this._getMonday(new Date()), // Store the start date of the current week
					currentStartDate: null,
					allocations: [{
						project: "",
						description: "",
						hours: {
							mon: "0",
							tue: "0",
							wed: "0",
							thu: "0",
							fri: "0",
							sat: "0",
							sun: "0"
						},
						totalHours: "0",
						hidingProjNam: true,
						isDeleteButtonVisible: false,
						flags: {
							hidingTextarea: true,
							hidingTotalInt: false
						}
					}, {
						project: "",
						description: "",
						hours: {
							mon: "0",
							tue: "0",
							wed: "0",
							thu: "0",
							fri: "0",
							sat: "0",
							sun: "0"
						},
						totalHours: "0",
						hidingProjNam: false,
						isDeleteButtonVisible: false,
						flags: {
							hidingTextarea: false,
							hidingTotalInt: true
						}
					}],
					dateRanges: this._getDateRanges(),
					dates: ["", "", "", "", "", "", ""] // Populate date ranges
				});
				this.getView().setModel(that.oModel);
				this.loadProjectData();
				//	this.updateDeleteButtonVisibility();
				this.getOwnerComponent().getRouter().getRoute("NewTimesheet").attachPatternMatched(this._onPatternMatched,
					this);

			},
			_getDateRanges: function () {
				var dateRanges = [];
				var today = new Date();
				var startDate = new Date(today);
				startDate.setMonth(today.getMonth() - 3);
				var endDate = new Date(today);
				endDate.setMonth(today.getMonth() + 3);
	
				while (startDate <= endDate) {
					var startOfWeek = this._getMonday(startDate);
					var endOfWeek = new Date(startOfWeek);
					endOfWeek.setDate(endOfWeek.getDate() + 6);
					var formattedStartDate = this._formatDate(startOfWeek);
					var formattedEndDate = this._formatDate(endOfWeek);
					var formattedText = `${formattedStartDate}, ${startOfWeek.getFullYear()} - ${formattedEndDate}, ${endOfWeek.getFullYear()}`;
					dateRanges.push({
						key: startOfWeek.toISOString(),
						text: formattedText
					});
					startDate.setDate(startDate.getDate() + 7);
				}
				return dateRanges;
			},
	
			_formatDate: function (date) {
				var options = {
					month: "short",
					day: "numeric"
				};
				return date.toLocaleDateString("en-US", options);
			},
			_getMonday: function (date) {
				var d = new Date(date);
				var day = d.getDay();
				var diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
				return new Date(d.setDate(diff));
			},
			onDateRangeChange: function (oEvent) {
				var selectedKey = oEvent.getParameter("selectedItem").getKey();
				var newStartDate = new Date(selectedKey);
				this.getView().getModel().setProperty("/currentStartDate", newStartDate);
				this._updateWeek();
	
				console.log("Selected date range key:", selectedKey); // Log selected key
			},
			_updateWeek: function () {
				var oModel = this.getView().getModel();
				var currentStartDate = oModel.getProperty("/currentStartDate");
				var dates = [];
	
				if (currentStartDate) {
					for (var i = 0; i < 7; i++) {
						var date = new Date(currentStartDate);
						date.setDate(currentStartDate.getDate() + i);
						dates.push(this._formatDate(date));
					}
				} else {
					dates = ["", "", "", "", "", "", ""];
				}
	
				oModel.setProperty("/dates", dates);
			},
			onAddPress: function () {
				var oNewRow = {
					project: "",
					description: "",
					hours: {
						mon: "0",
						tue: "0",
						wed: "0",
						thu: "0",
						fri: "0",
						sat: "0",
						sun: "0"
					},
					totalHours: "0",
					hidingProjNam: true,
					flags: {
						hidingTextarea: true,
						hidingTotalInt: false
					}
				};
	
				// Get the current model data
				var oModelData = this.getView().getModel().getData();
	
				// Find the index of the allocation with hidingProjNam === false
				var insertIndex = oModelData.allocations.findIndex(function (allocation) {
					return !allocation.hidingProjNam;
				});
	
				if (insertIndex !== -1) {
					// Insert the new row just above the found index
					oModelData.allocations.splice(insertIndex, 0, oNewRow);
				} else {
					// If no such allocation exists, add the new row to the end of the array
					oModelData.allocations.push(oNewRow);
				}
	
				// Refresh the model
				this.getView().getModel().refresh(true);
	
				// Get the table and refresh the binding
				var oTable = this.byId("allocationTable");
				oTable.getBinding("items").refresh(true);
	
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
			_updateWeeks: function (sDateRange) {
				var currentStartDate = new Date(sDateRange);
				var dates = [];
	
				if (currentStartDate) {
					for (var i = 0; i < 7; i++) {
						var date = new Date(currentStartDate);
						date.setDate(currentStartDate.getDate() + i);
						dates.push(this._formatDate(date));
					}
				} else {
					dates = ["", "", "", "", "", "", ""];
				}
	
				return dates;
			},
			_onPatternMatched: function (oEvent) {
				var view = this.getView();
				this.oGmodel = this.getOwnerComponent().getModel("oGmodel");
				that.sDateRange = oEvent.getParameter("arguments").dateRange;
				that.Status = oEvent.getParameter("arguments").Status;
				if (this.oGmodel.oData.odata) {
					var sEmail = oEvent.getParameter("arguments").sEmail;
				} else if (that.Status === "Submitted") {
					this.getView().mAggregations.content[0].mAggregations.pages[0].mAggregations.footer.addStyleClass("classFooterHidden");
					this.getView().byId("Addiconbtn").setVisible(false);
					this.getView().byId("dateRangeComboBox").setEnabled(false);
					var sEmail = this.oGmodel.oData['loggedInUser'].Email;
				} else {
					this.getView().mAggregations.content[0].mAggregations.pages[0].mAggregations.footer.addStyleClass("classFooterVisible");
					this.getView().byId("Addiconbtn").setVisible(true);
					this.getView().byId("dateRangeComboBox").setEnabled(true);
					var sEmail = this.oGmodel.oData['loggedInUser'].Email;
				}
				if (that.sDateRange === "D") {
					var oModel = new JSONModel({
						array: this.oGmodel.oData.odata.results
					});
					// this.getView().byId("usersComboBox").setModel(oModel);
					// this.getView().byId("usersComboBox").setSelectedKey(this.oGmodel.oData.odata.results[0].Email);
					that.oModel = new JSONModel({
						//currentStartDate: this._getMonday(new Date()), // Store the start date of the current week
						currentStartDate: null,
						allocations: [{
							project: "",
							description: "",
							hours: {
								mon: "0",
								tue: "0",
								wed: "0",
								thu: "0",
								fri: "0",
								sat: "0",
								sun: "0"
							},
							totalHours: "0",
							hidingProjNam: true,
							isDeleteButtonVisible: false,
							flags: {
								hidingTextarea: true,
								hidingTotalInt: false
							}
						}, {
							project: "",
							description: "",
							hours: {
								mon: "0",
								tue: "0",
								wed: "0",
								thu: "0",
								fri: "0",
								sat: "0",
								sun: "0"
							},
							totalHours: "0",
							hidingProjNam: false,
							isDeleteButtonVisible: false,
							flags: {
								hidingTextarea: false,
								hidingTotalInt: true
							}
						}],
						dateRanges: this._getDateRanges(),
						dates: ["", "", "", "", "", "", ""] // Populate date ranges
					});
					this.getView().setModel(that.oModel);
	
				} else {
					this._loadData(sEmail);
				}
				this.byId("FullName").setText(that.oGmodel.oData.loggedInUser.FullName);
				var oModel = new JSONModel({
					array: that.oGmodel.oData.odata
				});
				// this.getView().byId("usersComboBox").setModel(oModel);
				// this.getView().byId("usersComboBox").setSelectedKey(that.oGmodel.oData.odata.results[0].Email);
				// this.getView().byId("dateRangeComboBox").setSelectedKey(that.sDateRange);
	
				if (!that.oGmodel.oData['loggedInUser']) {
					this.getOwnerComponent().getRouter().navTo("Loginpage");
					return;
				}
				// view.setBusy(false);
			},
			onHoursChange: function (oEvent) {
				var oInput = oEvent.getSource();
				var sPath = oInput.getBindingContext().getPath();
				var sDay = sPath.split("/").pop(); // Extract the day from the binding path
				var oModel = this.getView().getModel();
				var oData = oModel.getProperty(sPath);
				var sday = oEvent.getSource().mBindingInfos.value.parts[0].path.split("/")[1];
	
				var sValue = oInput.getValue();
				var fValue = parseFloat(sValue);
	
				// Validate input value
				if (fValue < 0 || fValue > 8) {
					sap.m.MessageBox.error("Please enter a valid number between 0 and 8.");
					oInput.setValue("0");
					return;
				}
				if (!/^0?[0-8]$/.test(sValue) || isNaN(fValue)) {
					sap.m.MessageBox.error("Please enter a valid number between 0 and 8.");
					oInput.setValue("0");
					return;
				}
				// Update the specific day's hours from the input
				oData.hours[sday] = sValue;
	
				// Calculate horizontal total for the current row
				var iHorizontalTotal = 0;
				for (var day in oData.hours) {
					iHorizontalTotal += parseFloat(oData.hours[day]) || 0;
				}
				if (iHorizontalTotal > 40) {
					sap.m.MessageBox.error("Total hours for the week cannot exceed 40.");
					oInput.setValue("0");
					return;
				}
	
				// Set horizontal total
				oModel.setProperty(sPath + "/totalHours", iHorizontalTotal);
	
				// Calculate vertical total for the specific day (sDay) across all rows
				var aAllocations = oModel.getProperty("/allocations");
				var iVerticalTotal = 0;
	
				for (var i = 0; i < aAllocations.length - 1; i++) {
					var row = aAllocations[i];
					iVerticalTotal += parseFloat(row.hours[sday]) || 0;
				}
	
				var bHasError = iVerticalTotal > 8;
	
				// Validate vertical total
				if (bHasError) {
					sap.m.MessageBox.error("The total hours for " + sday + " cannot exceed 8 hours.");
					oInput.setValue("0");
					return;
				}
	
				var iTotalRowIndex = aAllocations.length;
				var iTotal = iTotalRowIndex - 1;
				var sTotalRowPath = "/allocations/" + iTotal;
	
				// Set vertical totals in the model for the total row
				oModel.setProperty(sTotalRowPath + "/hours/" + sday, iVerticalTotal);
	
				var iTotalHours = 0;
				for (var i = 0; i < aAllocations.length - 1; i++) {
					iTotalHours += aAllocations[i].totalHours || 0;
				}
				oModel.setProperty(sTotalRowPath + "/totalHours", iTotalHours);
	
			},
			onDeletePress: function (oEvent) {
				var oTable = this.getView().byId("allocationTable");
				var oModel = this.getView().getModel();
				var aAllocations = oModel.getProperty("/allocations");
	
				// Get the index of the item to be removed
				var oItemToRemove = oEvent.getParameter("listItem") || oEvent.getSource().getParent();
				var sPath = oItemToRemove.getBindingContextPath();
				var iIndex = parseInt(sPath.split("/")[sPath.split("/").length - 1]);
	
				// Ensure index is valid and within bounds
				if (iIndex > -1 && iIndex < aAllocations.length) {
					// Remove the item from the array
					aAllocations.splice(iIndex, 1);
	
					// Update the model with the modified array
					oModel.setProperty("/allocations", aAllocations);
				}
				oTable.addItem(that.oTotalRow);
			},
			loadProjectData: function() {
				var oModel = this.getOwnerComponent().getModel();
				var that = this;
			
				// Perform OData read operation for project details
				oModel.callFunction("/Detailsofproject", {
					method: "GET",
					success: function(oData) {
						// Parse the returned data
						var projectData = JSON.parse(oData.Detailsofproject);
						
						// Extract only the PROJECTNAME from the data
						var projectNames = projectData.map(function(project) {
							return { PROJECTNAME: project.PROJECTNAME };
						});
			
						// Create JSON model and set the extracted project names data
						var oProjectModel = new sap.ui.model.json.JSONModel();
						oProjectModel.setData(projectNames);
						that.getView().setModel(oProjectModel, "projectModel");
					},
					error: function(oError) {
						sap.m.MessageToast.show("Failed to load project data.");
					}
				});
			},
			onHomePress: function () {
				this.getOwnerComponent().getRouter().navTo("View")
			},
			onBackPressTimeSheetPage: function () {
				this.getOwnerComponent().getRouter().navTo("Timesheetdata")
			},
			onSave: function (oEvent) {
				var button = oEvent.getSource().getText();
				var operation = button === "Save" ? "S" : "A";
				this.submit(operation);
			},
	
			submit: function (operation) {
				var oView = this.getView();
				var data = this.getOwnerComponent().getModel("oGmodel");
				var sEmail = data.oData['loggedInUser'].Email;
				var sDateRange = this.byId("dateRangeComboBox").getSelectedItem().getText() || this.byId("dateRangeComboBox").getValue();
				var sFullName = data.oData.loggedInUser.FullName;
				var now = new Date();
				var year = now.getFullYear();
				var month = String(now.getMonth() + 1).padStart(2, '0');
				var day = String(now.getDate()).padStart(2, '0');
				var hours = String(now.getHours()).padStart(2, '0');
				var minutes = String(now.getMinutes()).padStart(2, '0');
				var seconds = String(now.getSeconds()).padStart(2, '0');
				var timesheetId = `T${year}${month}${day}${hours}${minutes}${seconds}`;
			
				// Create the Header data object
				var oHeader = {
					TIMESHEETID: timesheetId,
					PERIOD: sDateRange,
					EMPLOYEENAME: sFullName,
					STATUS: operation
				};
			
				// Collect data from the table
				var aItemsData = [];
				var oTable = this.byId("allocationTable");
				var aItems = oTable.getItems();
			
				for (var i = 0; i < aItems.length; i++) {
					var oItem = aItems[i];
					var oCells = oItem.getCells();
			
					var oEntry = {
						TIMESHEETID_TIMESHEETID: timesheetId,
						PROJECTNAME: oCells[0].getValue(),
						DELIVERABLE: oCells[1].getItems()[0].getValue(),
						MONDAY: parseInt(oCells[2].getValue(), 10),
						TUESDAY: parseInt(oCells[3].getValue(), 10),
						WEDNESDAY: parseInt(oCells[4].getValue(), 10),
						THURSDAY: parseInt(oCells[5].getValue(), 10),
						FRIDAY: parseInt(oCells[6].getValue(), 10),
						SATURDAY: parseInt(oCells[7].getValue(), 10),
						SUNDAY: parseInt(oCells[8].getValue(), 10),
						WORKINGHOURS: parseInt(oCells[9].getText(), 10)
					};
			
					aItemsData.push(oEntry);
				}
				
			
				// Prepare the payload
				var oPayload = {
					headerData: JSON.stringify(oHeader),  
				itemsData: JSON.stringify(aItemsData)
				};
			
				// Get the OData model and create the entry
				var oModel = this.getOwnerComponent().getModel();
				oModel.callFunction("/submitTimeSheet", oPayload, {
					method: "POST",  
					contentType: "application/json",
					success: function (oData) {
						if(oData.submitTimeSheet.status==="Error"){
							MessageToast.show("Timesheet failed");

						}else{
							MessageToast.show("Timesheet saved successfully!");

						}
					},
					error: function (oError) {
						MessageToast.show("Error: " + oError.message);
					}
				});
			}
						
			
		});
	}
);