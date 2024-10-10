sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/model/json/JSONModel",
		"sap/m/MessageToast",
		"sap/ui/core/Fragment",
		"sap/m/MessageBox"
	],
	function (Controller, JSONModel, MessageToast, Fragment, MessageBox) {
		"use strict";
		var that = this;


		return Controller.extend("timesheetapplication.controller.NewTimesheet", {
			onInit: function () {
				that.array = [];
				that.oGmodel = this.getOwnerComponent().getModel("oGmodel");
				// that.sEmpID = that.oGmodel.oData.odata.EMPLOYEEID;
				// this.byId("FullName").setText(that.oGmodel.oData.loggedInUser.FullName);
				// var oModel = new JSONModel({
				// 	array: that.oGmodel.oData.odata
				// });

				// // Setting up the view's model
				// that.oModel = new JSONModel({
				// 	allocations: [{
				// 		Type: "",
				// 		project: "",
				// 		Phase: "",
				// 		description: "",
				// 		hours: {
				// 			mon: "0",
				// 			tue: "0",
				// 			wed: "0",
				// 			thu: "0",
				// 			fri: "0",
				// 			sat: "0",
				// 			sun: "0"
				// 		},
				// 		totalHours: "0",
				// 		AvailableHours:"0",
				// 		hidingProjNam: true,
				// 		isDeleteButtonVisible: false,
				// 		flags: {
				// 			hidingTextarea: true,
				// 			hidingTotalInt: false
				// 		}
				// 	}, {
				// 		Type: "",
				// 		project: "",
				// 		Phase: "",
				// 		description: "",
				// 		hours: {
				// 			mon: "0",
				// 			tue: "0",
				// 			wed: "0",
				// 			thu: "0",
				// 			fri: "0",
				// 			sat: "0",
				// 			sun: "0"
				// 		},
				// 		totalHours: "0",
				// 		hidingProjNam: false,
				// 		isDeleteButtonVisible: false,
				// 		flags: {
				// 			hidingTextarea: false,
				// 			hidingTotalInt: true
				// 		}
				// 	}],
				// 	currentStartDate: null, // For dynamic date updates
				// 	dateRanges: this.getDateRanges(), // Prepopulate the date ranges
				// 	dates: ["", "", "", "", "", "", ""] ,// Initially empty
				// 	isHoliday: { 
				// 		mon: true,
				// 		tue: true,
				// 		wed: true,
				// 		thu: true,
				// 		fri: true,
				// 		sat: true,
				// 		sun: true
				// 	},
				// 	holidayName : {
				// 		mon: "",
				// 		tue: "",
				// 		wed: "",
				// 		thu: "",
				// 		fri: "",
				// 		sat: "",
				// 		sun: ""
				// 	},
				// });

				// this.getView().setModel(oModel);
				// this.loadProjectData();
				this.getOwnerComponent().getRouter().getRoute("NewTimesheet").attachPatternMatched(this._onPatternMatched, this);
			},
			_onPatternMatched: function (oEvent) {
				var view = this.getView();
				this.getDateRanges();
				this.oGmodel = this.getOwnerComponent().getModel("oGmodel");
				if (!that.oGmodel.oData['loggedInUser']) {
					this.getOwnerComponent().getRouter().navTo("RouteView");
					return;
				  }
				that.sDateRange = oEvent.getParameter("arguments").dateRange;
				that.Status = oEvent.getParameter("arguments").Status;
				that.Sdate=oEvent.getParameter("arguments").Sdate;
				that.Ssubmit=oEvent.getParameter("arguments").submit;
				// if (that.Status === "Approved") {
				// 	that.sName=oEvent.getParameter("arguments").ApprovedByName ? oEvent.getParameter("arguments").ApprovedByName : '';
				// } else {
				// 	that.sName=oEvent.getParameter("arguments").Name;
				// }
				var date = new Date(that.Sdate);

				// Extract day, month, and year
				var day = String(date.getDate()).padStart(2, '0');  // Add leading zero if needed
				var month = String(date.getMonth() + 1).padStart(2, '0');  // Month is zero-indexed, so +1
				var year = date.getFullYear();
			
				// Format the date as DD-MM-YYYY
				var formattedDate = day + '-' + month + '-' + year;
				
				that.sName=oEvent.getParameter("arguments").Name;
				// var oStatus = { Status: that.Status,
				// 	SubName: that.sName
				//  };
				var statusModel = new sap.ui.model.json.JSONModel();
				//statusModel.setData(oStatus); 
				this.getView().setModel(statusModel, "ostatusModel");
				this.getView().getModel("ostatusModel").setProperty("/Status", that.Status); 
				this.getView().getModel("ostatusModel").setProperty("/SubName",that.Ssubmit); 
				this.getView().getModel("ostatusModel").setProperty("/SubDate", formattedDate); 

				// that.Status = oEvent.getParameter("arguments").Status;
				// var oStatus=that.Status;
				// var statusModel = new sap.ui.model.json.JSONModel();
				// statusModel.setData(oStatus);
				// that.getView().setModel(statusModel, "ostatusModel");
				
				var ManagerFlag=that.oGmodel.oData.odata.MANAGERFLAG ;
				var Employeename = this.oGmodel.oData.loggedInUser.FullName;
				this.getView().byId("dateRangeComboBox").setSelectedKey("");

				if (that.Status === "Submitted" && ManagerFlag === "Yes") {
					this.getView().mAggregations.content[0].mAggregations.pages[0].mAggregations.footer
						.removeStyleClass("classFooterHidden")
						.addStyleClass("classFooterVisible");
					this.getView().byId("idsavebtn").setVisible(false);
					this.getView().byId("idsubmitforapproval").setVisible(false);
					this.getView().byId("idapproval").setVisible(true);
					this.getView().byId("iddelete").setVisible(true);
					this.getView().byId("Addiconbtn").setVisible(false);
					this.getView().byId("dateRangeComboBox").setSelectedKey(that.sDateRange);
					this.getView().byId("dateRangeComboBox").setEnabled(false);
					var sEmail = this.oGmodel.oData['loggedInUser'].Email;
					this.getView().byId("statusvisible").setVisible(true);
					this.getView().byId("subdatevisible").setVisible(true);
					this.getView().byId("substatusvisible").setVisible(true);
					
				} else if (that.Status === "Saved") {
					this.getView().mAggregations.content[0].mAggregations.pages[0].mAggregations.footer
						.removeStyleClass("classFooterHidden")
						.addStyleClass("classFooterVisible");
					this.getView().byId("idsavebtn").setVisible(true);
					this.getView().byId("idsubmitforapproval").setVisible(true);
					this.getView().byId("idapproval").setVisible(false);
					this.getView().byId("Addiconbtn").setVisible(true);
					this.getView().byId("dateRangeComboBox").setEnabled(true);
					this.getView().byId("dateRangeComboBox").setSelectedKey(that.sDateRange);
					this.getView().byId("statusvisible").setVisible(true);
					this.getView().byId("subdatevisible").setVisible(true);
					this.getView().byId("substatusvisible").setVisible(true);
					this.getView().byId("iddelete").setVisible(false);
			
					var sEmail = this.oGmodel.oData['loggedInUser'].Email;
				} else if (that.Status === "Approved") {
					this.getView().mAggregations.content[0].mAggregations.pages[0].mAggregations.footer
						.removeStyleClass("classFooterVisible")
						.addStyleClass("classFooterHidden");
					this.getView().byId("Addiconbtn").setVisible(false);
					this.getView().byId("dateRangeComboBox").setSelectedKey(that.sDateRange);
					this.getView().byId("dateRangeComboBox").setEnabled(false);
					this.getView().byId("statusvisible").setVisible(true);
					this.getView().byId("subdatevisible").setVisible(true);
					this.getView().byId("substatusvisible").setVisible(true);
					this.getView().byId("iddelete").setVisible(false);
				} else if (that.Status === "Submitted" && ManagerFlag === "No") {
					this.getView().mAggregations.content[0].mAggregations.pages[0].mAggregations.footer
						.removeStyleClass("classFooterVisible")
						.addStyleClass("classFooterHidden");
					this.getView().byId("Addiconbtn").setVisible(false);
					this.getView().byId("dateRangeComboBox").setSelectedKey(that.sDateRange);
					this.getView().byId("dateRangeComboBox").setEnabled(false);
					this.getView().byId("statusvisible").setVisible(true);
					this.getView().byId("subdatevisible").setVisible(true);
					this.getView().byId("substatusvisible").setVisible(true);
					this.getView().byId("iddelete").setVisible(false);
				} else {
					this.getView().mAggregations.content[0].mAggregations.pages[0].mAggregations.footer
						.removeStyleClass("classFooterHidden")
						.addStyleClass("classFooterVisible");
					this.getView().byId("idsavebtn").setVisible(true);
					this.getView().byId("idsubmitforapproval").setVisible(true);
					this.getView().byId("idapproval").setVisible(false);
					this.getView().byId("Addiconbtn").setVisible(true);
					this.getView().byId("dateRangeComboBox").setSelectedKey(that.sDateRange);
					this.getView().byId("dateRangeComboBox").setEnabled(true);
					this.getView().byId("statusvisible").setVisible(false);
					this.getView().byId("subdatevisible").setVisible(false);
					this.getView().byId("substatusvisible").setVisible(false);
					this.getView().byId("iddelete").setVisible(false);
					var sEmail = oEvent.getParameter("arguments").sEmail;
					var Employeename = this.oGmodel.oData.loggedInUser.FullName;
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
							Type: "",
							project: "",
							Phase: "",
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
							AvailableHours:"0",
							hidingProjNam: true,
							isDeleteButtonVisible: false,
							flags: {
								hidingTextarea: true,
								hidingTotalInt: false
							}
						}, {
							Type: "",
							project: "",
							Phase: "",
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
						dateRanges: this.getDateRanges(),
						dates: ["", "", "", "", "", "", ""] ,
						isHoliday: { 
							mon: true,
							tue: true,
							wed: true,
							thu: true,
							fri: true,
							sat: true,
							sun: true
						},
						holidayName : {
						mon: "",
						tue: "",
						wed: "",
						thu: "",
						fri: "",
						sat: "",
						sun: ""
					},
					});
					this.getView().setModel(that.oModel);

				} else {
					this.loadData();
				}
				this.byId("FullName").setText(that.oGmodel.oData.loggedInUser.FullName);
				var oModel = new JSONModel({
					array: that.oGmodel.oData.odata
				});
				// this.getView().byId("usersComboBox").setModel(oModel);
				// this.getView().byId("usersComboBox").setSelectedKey(that.oGmodel.oData.odata.results[0].Email);
				// this.getView().byId("dateRangeComboBox").setSelectedKey(that.sDateRange);
				this.loadProjectData();
				if (!that.oGmodel.oData['loggedInUser']) {
					this.getOwnerComponent().getRouter().navTo("Loginpage");
					return;
				}
			},
			onProjectSelectionChange: function (oEvent) {
				var oModel = this.getOwnerComponent().getModel("oModel"); 
				var oSelectedItem = oEvent.getParameter("selectedItem");
				var sSelectedKey = oSelectedItem.getKey();
				var oParams = {
					ProjectID: sSelectedKey
				};
				new Promise(function(resolve,reject){
					oModel.callFunction("/AvailableHours", {
						method: "GET",
						urlParameters: oParams,
						success: function (oData, response) {
							var AvailHours = oData.AvailableHours.AvailableHours;   
							resolve(AvailHours)
						},
						error: function (err) {
							console.error("Error retrieving available hours:", err);
							reject(err)
						}
					});
				})
				.then(function(AvailHours){
					oEvent.getParameters().selectedItem.getBindingContext().getObject().AvailableHours = AvailHours;
					this.getView().getModel().refresh(true);
				}.bind(this))
				.catch(function(err){
					MessageToast.show("Error retrieving available hours:", err)
				})
				
			},		
			getDateRanges: function () {
				that.dateRanges = [];
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
// startOfWeek.toISOString(),
					that.dateRanges.push({
						key:formattedText,
						text: formattedText
					});
					startDate.setDate(startDate.getDate() + 7);
				}
				return dateRanges;

			},

			_formatDate: function (date) {
				var options = { month: "short", day: "numeric" };
				return date.toLocaleDateString("en-US", options);
			},

			_getMonday: function (date) {
				var d = new Date(date);
				var day = d.getDay();
				var diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
				return new Date(d.setDate(diff));
			},

			onDateRangeChange: function (oEvent) {
				var selectedKey = oEvent.getParameter("selectedItem").getText();
				var startDateString = selectedKey.split(" - ")[0];
				var newStartDate = new Date(startDateString);
				this.getView().getModel().setProperty("/currentStartDate", newStartDate);
				this._updateWeek(); // Update dates based on the selected start date
			},

			// _updateWeek: function () {
			// 	var oModel = this.getView().getModel();
			// 	var currentStartDate = oModel.getProperty("/currentStartDate");
			// 	var dates = [];

			// 	if (currentStartDate) {
			// 		for (var i = 0; i < 7; i++) {
			// 			var date = new Date(currentStartDate);
			// 			date.setDate(currentStartDate.getDate() + i);
			// 			dates.push(this._formatDate(date));
			// 		}
			// 	} else {
			// 		dates = ["", "", "", "", "", "", ""];
			// 	}

			// 	oModel.setProperty("/dates", dates);
			// },
			 formatDateToISO:function(date) {
				var year = date.getFullYear();
				var month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
				var day = String(date.getDate()).padStart(2, '0');
				return `${year}-${month}-${day}`;
			},

			_updateWeek: function () {
				var Model = this.getView().getModel();
				var currentStartDate = Model.getProperty("/currentStartDate");
				var dates = [];
				var isHoliday = { 
					mon: true,
					tue: true,
					wed: true,
					thu: true,
					fri: true,
					sat: true,
					sun: true
				};
				var holidayName = {
					mon: "",
					tue: "",
					wed: "",
					thu: "",
					fri: "",
					sat: "",
					sun: ""
				};
				var dateArray = [];
			
				if (currentStartDate) {
					for (var i = 0; i < 7; i++) {
						var date = new Date(currentStartDate);
						date.setDate(currentStartDate.getDate() + i);
						var formattedDate = this.formatDateToISO(date);
						dateArray.push({
							date: formattedDate
						});
						dates.push(this._formatDate(date));  // For displaying the date
					}
				} else {
					dates = ["", "", "", "", "", "", ""];
				}
			
				var jsonString = JSON.stringify(dateArray);
				this.holidaycheck(jsonString, dateArray, dates, isHoliday, holidayName, Model);
			},
			
			holidaycheck: function (dates, dateObjects, displayDates, isHoliday, holidayName, Model) {
				var oModel = this.getOwnerComponent().getModel("oModel");
			
				oModel.callFunction("/HolidayCheck", {
					method: "GET",
					urlParameters: {
						dates: dates
					},
					success: function (oData, response) {
						var holidays = JSON.parse(oData.HolidayCheck);
						if (holidays.length > 0) {
							holidays.forEach(function(holiday) {
								var holidayDate = holiday.Date.split('T')[0];
								var holidayNameValue = holiday.HoildayName;
			
								// Find the date in dateObjects and update isHoliday and holidayName fields
								dateObjects.forEach(function(dateObj, index) {
									if (dateObj.date === holidayDate) {
										switch(index) {
											case 0: isHoliday.mon = false; holidayName.mon = holidayNameValue; break;
											case 1: isHoliday.tue = false; holidayName.tue = holidayNameValue; break;
											case 2: isHoliday.wed = false; holidayName.wed = holidayNameValue; break;
											case 3: isHoliday.thu = false; holidayName.thu = holidayNameValue; break;
											case 4: isHoliday.fri = false; holidayName.fri = holidayNameValue; break;
											case 5: isHoliday.sat = false; holidayName.sat = holidayNameValue; break;
											case 6: isHoliday.sun = false; holidayName.sun = holidayNameValue; break;
										}
									}
								});
							});
						}
			
						// Set the dates, isHoliday, and holidayName properties in the model
						Model.setProperty("/dates", displayDates);
						Model.setProperty("/isHoliday", isHoliday);
						Model.setProperty("/holidayName", holidayName);
					},
					error: function (err) {
						console.error("Error occurred while fetching holidays:", err);
					}
				});
			},
				

			onAddPress: function () {
				var oNewRow = {
					Type: "",
					project: "",
					Phase: "",
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
					AvailableHours:"0",
					hidingProjNam: true,
					flags: {
						hidingTextarea: true,
						hidingTotalInt: false
					}
				};

				var oModelData = this.getView().getModel().getData();
				var insertIndex = oModelData.allocations.findIndex(function (allocation) {
					return !allocation.hidingProjNam;
				});

				if (insertIndex !== -1) {
					oModelData.allocations.splice(insertIndex, 0, oNewRow);
				} else {
					oModelData.allocations.push(oNewRow);
				}

				this.getView().getModel().refresh(true);
				var oTable = this.byId("allocationTable");
				oTable.getBinding("items").refresh(true);
			},

			CustomerHeader: function (oEvent) {
				var oSource = oEvent.getSource(),
					oview = this.getView();
				var data = this.getOwnerComponent().getModel("oGmodel");
				var FullName = data.oData['loggedInUser'].FullName;
				var Email = data.oData['loggedInUser'].Email;

				if (!this._Logoutpopover) {
					this._Logoutpopover = Fragment.load({
						id: oview.getId(),
						name: "timesheetapplication.Fragments.Headericon",
						controller: this
					}).then(function (oLogoutpopover) {
						oview.addDependent(oLogoutpopover);
						oview.byId("title").setText(FullName);
						oview.byId("email").setText(Email);
						return oLogoutpopover;
					});
				}

				this._Logoutpopover.then(function (oLogoutpopover) {
					oview.byId("title").setText(FullName);
					oview.byId("email").setText(Email);
					if (oLogoutpopover.isOpen()) {
						oLogoutpopover.close();
					} else {
						oLogoutpopover.openBy(oSource);
					}
				});
			},

			HandleSignout: function () {
				this.getOwnerComponent().getRouter().navTo("RouteView");
				this.byId("emailInput").setValue("");
				this.byId("passwordInput").setValue("");
			},

			
			loadData: function () {
				var oModel = this.getOwnerComponent().getModel("oModel");
				that.view = this.getView();
				var aItems = []
				//view.setBusyIndicatorDelay(0);
				//view.setBusy(true);
				that.busyDialog = new sap.m.BusyDialog();
				that.busyDialog.open();

				var oParams = {
					EmployeeName: that.sName,
					period: that.sDateRange,
					Status:that.Status
				};
				// Assuming the response contains the stringified data
				oModel.callFunction("/RetriveTimeSheetdata", {
					method: "GET",
					urlParameters: oParams,
					success: function (oData, response) {
						// Parse the stringified data
						var parsedData = JSON.parse(oData.RetriveTimeSheetdata)
						var header = parsedData.header;
						aItems = parsedData.items;

						// Proceed with frontend logic to display data in table
						// that._processData(aItems);  // Pass items to your data processing function

						if (aItems.length === 0) {
							// If there are no items, just create the default item
							var oDefaultItem = {
								Type: "",
								project: "",
								Phase: "",
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
								AvailableHours:"0",
								hidingProjNam: true,
								isDeleteButtonVisible: false,
								flags: {
									hidingTextarea: true,
									hidingTotalInt: false
								}

							};

							var oTimesheetModel = new JSONModel({
								currentStartDate: this.sDateRange,
								dates: ["", "", "", "", "", "", ""], // Set this as required
								isHoliday: { 
									mon: true,
									tue: true,
									wed: true,
									thu: true,
									fri: true,
									sat: true,
									sun: true
								},
								allocations: [oDefaultItem]
							});
							this.getView().setModel(oTimesheetModel);
							return;
						}

						// Process the retrieved items
						var aProcessedData = aItems.slice(0, -1).map(function (item) {
							return {
								Type: item.PROJECTTYPE,
								Project: item.PROJECTNAME,
								ProjectId: item.PROJECTID_PROJECTID,
								Phase: item.PHASE,
								description: item.DELIVERABLE,
								hours: {
									mon: item.MONDAY || "0",
									tue: item.TUESDAY || "0",
									wed: item.WEDNESDAY || "0",
									thu: item.THURSDAY || "0",
									fri: item.FRIDAY || "0",
									sat: item.SATURDAY || "0",
									sun: item.SUNDAY || "0"
								},
								totalHours: item.WORKINGHOURS || "0",
								AvailableHours:item.AVAILABLEHOURS,
								hidingProjNam: true,
								isDeleteButtonVisible: false,
								flags: {
									hidingTextarea: true,
									hidingTotalInt: false
								}
							};
						});

						// Create the default item from the last element
						var oLastItem = aItems[aItems.length - 1];
						var oDefaultItem = {
							project: oLastItem.PROJECTNAME || "",
							description: oLastItem.DELIVERABLE || "",
							hours: {
								mon: oLastItem.MONDAY || "0",
								tue: oLastItem.TUESDAY || "0",
								wed: oLastItem.WEDNESDAY || "0",
								thu: oLastItem.THURSDAY || "0",
								fri: oLastItem.FRIDAY || "0",
								sat: oLastItem.SATURDAY || "0",
								sun: oLastItem.SUNDAY || "0"
							},
							totalHours: oLastItem.WORKINGHOURS || "0",
							hidingProjNam: false,
							isDeleteButtonVisible: false,
							flags: {
								hidingTextarea: false,
								hidingTotalInt: true
							}
						};

						// Append the default item to the end of the processed data
						aProcessedData.push(oDefaultItem);
						var dateRange = that.sDateRange;

						var startDateString = dateRange.split(" - ")[0];

						// Parse the date parts
						var parts = startDateString.split(" ");
						var month = parts[0];
						var day = parseInt(parts[1].replace(",", ""), 10);
						var year = parseInt(parts[2], 10);

						// Map month name to month number
						var monthMap = {
							"Jan": 0,
							"Feb": 1,
							"Mar": 2,
							"Apr": 3,
							"May": 4,
							"Jun": 5,
							"Jul": 6,
							"Aug": 7,
							"Sep": 8,
							"Oct": 9,
							"Nov": 10,
							"Dec": 11
						};


						var monthNumber = monthMap[month];

						// Create a new Date object
						var date = new Date(year, monthNumber, day);

						// Convert to ISO string
						var isoString = date.toISOString();


						var currentStartDate = new Date(isoString);
						var dates = [];

						if (currentStartDate) {
							for (var i = 0; i < 7; i++) {
								var date = new Date(currentStartDate);
								date.setDate(currentStartDate.getDate() + i);
								var options = { month: "short", day: "numeric" };
								var option = date.toLocaleDateString("en-US", options);
								dates.push(option);
							}
						} else {
							dates = ["", "", "", "", "", "", ""];
						}


						var arrDateRanges = [{
							key: that.sDateRange,
							text: that.sDateRange
						}];

						var oTimesheetModel = new JSONModel({
							dateRanges: that.dateRanges,
							dates: dates,
							allocations: aProcessedData
						});

						that.view.setModel(oTimesheetModel);
						 that.view.byId("dateRangeComboBox").setSelectedKey(that.sDateRange);
						setTimeout(function () {
							that.busyDialog.close();
						}, 3000);
					},
					error: function (oError) {
						MessageToast.show("Failed to retrieve timesheet data.");
					}
				});
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

			// _formatDate: function (date) {
			// 	var day = date.getDate();
			// 	var month = date.getMonth() + 1; // Months are zero-based
			// 	var year = date.getFullYear();
			// 	return day + "/" + month + "/" + year;
			// },

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
				this.getOwnerComponent().getRouter().navTo("RouteViewnenu")
			},
			onBackPressTimeSheetPage: function () {
				this.getOwnerComponent().getRouter().navTo("Timesheetdata")
			},
			onApproved: function() {
				var data = this.getOwnerComponent().getModel("oGmodel");
				var FullName = data.oData['loggedInUser'].FullName;
				var now = new Date();
				var year = now.getFullYear();
				var month = String(now.getMonth() + 1).padStart(2, '0');
				var day = String(now.getDate()).padStart(2, '0');
				var formatedDate = year + '-' + month + '-' + day;
				var Status = "Approved"; 			
				var detailsForApproved = {
					Status: Status,
					EmpName: that.sName,
					Period: that.sDateRange,
					sDate:formatedDate,
					sSubmittedby:FullName
				};
			
				// Stringify the data
				var jsonData = JSON.stringify(detailsForApproved);
			
				var oModel = this.getOwnerComponent().getModel("oModel");
			
				oModel.callFunction("/TimeSheetApproved", {
					method: "GET",
					urlParameters: { data: jsonData },
					success: function(oData) {
						// Handle success
						sap.m.MessageToast.show("Timesheet Approved successfully.");
						this.getOwnerComponent().getRouter().navTo("Timesheetdata");
						// this.getOwnerComponent().getRouter().navTo("Loginpage");
					}.bind(this),
					error: function(oError) {
						// Handle error
						sap.m.MessageBox.error("An error occurred while Approved the timesheet status.");
					}
				});
			},
			onDelete:function(){
				var detailsForDelete = {
					Period: that.sDateRange,
					EmpName: that.sName
				};
				var jsonData=JSON.stringify(detailsForDelete);
				var oModel=this.getOwnerComponent().getModel("oModel");
				oModel.callFunction("/TimeSheetDelete",{
					method: "GET",
					urlParameters: {deleteddata:jsonData},
					success:function(odata){
						sap.m.MessageToast.show("Time Deleted successfully")
					},
					error:function(err){
						sap.m.MessageBox.error("An error occurred while Deleting the timesheet status.")
					}
				})

			},
			onSave: function (oEvent) {
				var button = oEvent.getSource().getText();
				var operation = button === "Save" ? "Saved" : "Submitted";
				this.submit(operation);
			},
			// submit: function (operation) {
			// 	var oView = this.getView();
			// 	var data = this.getOwnerComponent().getModel("oGmodel");
			// 	var sEmail = data.oData['loggedInUser'].Email;
			// 	var sDateRange = this.byId("dateRangeComboBox").getSelectedItem() ? this.byId("dateRangeComboBox").getSelectedItem().getKey() : "";
			// 	var sFullName = data.oData.loggedInUser.FullName;
			
			// 	// First validation: Check if the date range is selected
			// 	if (!sDateRange) {
			// 		sap.m.MessageBox.error("Please select a date range before submitting.");
			// 		return;
			// 	}
			
			// 	var now = new Date();
			// 	var year = now.getFullYear();
			// 	var month = String(now.getMonth() + 1).padStart(2, '0');
			// 	var day = String(now.getDate()).padStart(2, '0');
			// 	var hours = String(now.getHours()).padStart(2, '0');
			// 	var minutes = String(now.getMinutes()).padStart(2, '0');
			// 	var seconds = String(now.getSeconds()).padStart(2, '0');
			// 	var timesheetId = `T${year}${month}${day}${hours}${minutes}${seconds}`;
			// 	var formatedDate = year + '-' + month + '-' + day;
			
			// 	// Create the Header data object
			// 	var oHeader = {
			// 		TIMESHEETID: timesheetId,
			// 		PERIOD: sDateRange,
			// 		EMPLOYEENAME: sFullName,
			// 		STATUS: operation,
			// 		DATE: formatedDate,
			// 		EMPLOYEEID_EMPLOYEEID: that.sEmpID
			// 	};
			
			// 	// Collect data from the table
			// 	var aItemsData = [];
			// 	var oTable = this.byId("allocationTable");
			// 	var aItems = oTable.getItems();
			
			// 	for (var i = 0; i < aItems.length; i++) {
			// 		var oItem = aItems[i];
			// 		var oCells = oItem.getCells();
			// 		var uniqueID = Date.now() % 1000000000 + Math.floor(Math.random() * 1000);
			
			// 		var totalHours = parseInt(oCells[11].getText(), 10) || 0;
			// 		var availableHours = parseInt(oCells[12].getText(), 10) || 0;
			// 		var remainingHours = availableHours; 
			
			// 		if (operation === "Submitted" && i < aItems.length - 1) {
			// 			remainingHours = availableHours - totalHours;
			// 		}
			
			// 		// Second validation: Check Project Type, Project Name, and Project Phase
					// var sProjectType = oCells[0].getSelectedKey();
					// var sProjectName = oCells[1].getSelectedKey();
					// var sProjectPhase = oCells[2].getSelectedKey();
			
					// if (!sProjectType || !sProjectName || !sProjectPhase) {
					// 	sap.m.MessageBox.error("Please select Project Type, Project Name, and Project Phase for all entries.");
					// 	return;  // Stop submission if validation fails
					// }
			
			// 		// Existing validation: Check working hours vs available hours
			// 		if (i !== aItems.length - 1 && totalHours > availableHours) {
			// 			sap.m.MessageBox.error("Working Hours is greater than available hours for one of the entries.");
			// 			return;
			// 		}
			
			// 		// Create entry for the table item
			// 		var oEntry = {
			// 			AUTO_INCREMENT_ID: uniqueID,
			// 			TIMESHEETID: timesheetId,
			// 			EMPLOYEENAME: sFullName,
			// 			PERIOD: sDateRange,
			// 			PROJECTID_PROJECTID: sProjectName || "",
			// 			PROJECTNAME: oCells[1].getSelectedItem() ? oCells[1].getSelectedItem().getText() : "",
			// 			PROJECTTYPE: sProjectType || "",
			// 			PHASE: sProjectPhase || "",
			// 			DELIVERABLE: oCells[3].getItems().length > 0 ? oCells[3].getItems()[0].getValue() : "",
			// 			MONDAY: parseInt(oCells[4].getValue(), 10) || 0,
			// 			TUESDAY: parseInt(oCells[5].getValue(), 10) || 0,
			// 			WEDNESDAY: parseInt(oCells[6].getValue(), 10) || 0,
			// 			THURSDAY: parseInt(oCells[7].getValue(), 10) || 0,
			// 			FRIDAY: parseInt(oCells[8].getValue(), 10) || 0,
			// 			SATURDAY: parseInt(oCells[9].getValue(), 10) || 0,
			// 			SUNDAY: parseInt(oCells[10].getValue(), 10) || 0,
			// 			WORKINGHOURS: totalHours,
			// 			AvailableHours: remainingHours
			// 		};
			// 		aItemsData.push(oEntry);
			// 	}
			
			// 	// Prepare the payload by stringifying the objects
			// 	var oPayload = {
			// 		headerData: JSON.stringify(oHeader),
			// 		itemsData: JSON.stringify(aItemsData),
			// 		period: that.sDateRange
			// 	};
			
			// 	// Get the OData model and call the function
			// 	var oModel = this.getOwnerComponent().getModel("oModel");
			// 	oModel.callFunction("/TimeSheetSubmit", {
			// 		urlParameters: oPayload,  // Send the stringified data as parameters
			// 		success: function (oData) {
			// 			if (oData.TimeSheetSubmit.status === "Error") {
			// 				sap.m.MessageBox.error("TimeSheet already submitted for this time period");
			// 			} else {
			// 				MessageToast.show("Timesheet saved successfully!");
			// 			}
			// 		},
			// 		error: function (oError) {
			// 			MessageToast.show("Error: " + oError.message);
			// 		}
			// 	});
			// },	
			
			submit: function (operation) {
				var oView = this.getView();
				var data = this.getOwnerComponent().getModel("oGmodel");
				var sEmail = data.oData['loggedInUser'].Email;
				that.sEmpID=data.oData.odata.EMPLOYEEID;
				var sDateRange = this.byId("dateRangeComboBox").getSelectedItem() ? this.byId("dateRangeComboBox").getSelectedItem().getKey() : "";
				var sFullName = data.oData.loggedInUser.FullName;
				var now = new Date();
				var year = now.getFullYear();
				var month = String(now.getMonth() + 1).padStart(2, '0');
				var day = String(now.getDate()).padStart(2, '0');
				var hours = String(now.getHours()).padStart(2, '0');
				var minutes = String(now.getMinutes()).padStart(2, '0');
				var seconds = String(now.getSeconds()).padStart(2, '0');
				var timesheetId = `T${year}${month}${day}${hours}${minutes}${seconds}`;
				var formatedDate = year + '-' + month + '-' + day;
			
				// Create the Header data object
				if (!sDateRange) {
					sap.m.MessageBox.error("Please select a date range before submitting.");
					return;
				}
			
				var oHeader = {
					TIMESHEETID: timesheetId,
					PERIOD: sDateRange,
					EMPLOYEENAME: sFullName,
					SUBMITTEDBY:sFullName,
					STATUS: operation,
					DATE: formatedDate,
					EMPLOYEEID_EMPLOYEEID: that.sEmpID
				};
			
				// Collect data from the table
				var aItemsData = [];
				var oTable = this.byId("allocationTable");
				var aItems = oTable.getItems();
			
				// Object to track project hours
				var projectHoursMap = {};
			
				for (var i = 0; i < aItems.length; i++) {
					var oItem = aItems[i];
					var oCells = oItem.getCells();
					var uniqueID = Date.now() % 1000000000 + Math.floor(Math.random() * 1000);
			
					var totalHours = parseInt(oCells[11].getText(), 10) || 0;
					var availableHours = parseInt(oCells[12].getText(), 10) || 0;

					var remainingHours ; 
			
					if (operation === "Submitted" && i < aItems.length - 1) {
						
						remainingHours = availableHours - totalHours;
					}
					if( i !== aItems.length-1){
			
					// Combine total hours for entries with the same project
					var projectName = oCells[1].getSelectedKey(); // Assuming column 1 is Project Name
					
					if (!projectName) {
						sap.m.MessageBox.error("Please select Project Name before submitting.");
						return;
					}
					
					if (!projectHoursMap[projectName]) {
						projectHoursMap[projectName] = {
							totalHours: 0,
							availableHour: availableHours
						};
					}
			
					projectHoursMap[projectName].totalHours += totalHours;
			
					// Ensure the total combined hours do not exceed available hours
					if (projectHoursMap[projectName].totalHours > projectHoursMap[projectName].availableHour) {
						sap.m.MessageBox.error("Combined working hours exceed available hours for project: " + oCells[1].getSelectedItem().getText());
						return;
					}
			
					// Collect other required data
					var sProjectType = oCells[0].getSelectedKey();
					var sProjectPhase = oCells[2].getSelectedKey();
			
					if (!sProjectType) {
						sap.m.MessageBox.error("Please select Project Type before submitting.");
						return;
					}
					
					if (!sProjectPhase) {
						sap.m.MessageBox.error("Please select Project Phase before submitting.");
						return;
					}
				}
			
					var oEntry = {
						AUTO_INCREMENT_ID: uniqueID,
						TIMESHEETID: timesheetId,
						EMPLOYEENAME: sFullName,
						PERIOD: sDateRange,
						PROJECTID_PROJECTID: projectName,
						PROJECTNAME: oCells[1].getSelectedItem() ? oCells[1].getSelectedItem().getText() : "",
						PROJECTTYPE: sProjectType,
						PHASE: sProjectPhase,
						DELIVERABLE: oCells[3].getItems().length > 0 ? oCells[3].getItems()[0].getValue() : "",
						MONDAY: parseInt(oCells[4].getValue(), 10) || 0,
						TUESDAY: parseInt(oCells[5].getValue(), 10) || 0,
						WEDNESDAY: parseInt(oCells[6].getValue(), 10) || 0,
						THURSDAY: parseInt(oCells[7].getValue(), 10) || 0,
						FRIDAY: parseInt(oCells[8].getValue(), 10) || 0,
						SATURDAY: parseInt(oCells[9].getValue(), 10) || 0,
						SUNDAY: parseInt(oCells[10].getValue(), 10) || 0,
						WORKINGHOURS: totalHours,
						AvailableHours:availableHours					};
			
					aItemsData.push(oEntry);
				}
			
				// Prepare the payload by stringifying the objects
				var oPayload = {
					headerData: JSON.stringify(oHeader),
					itemsData: JSON.stringify(aItemsData),
					period: sDateRange
				};
			
				// Get the OData model and call the function
				var oModel = this.getOwnerComponent().getModel("oModel");
				oModel.callFunction("/TimeSheetSubmit", {
					urlParameters: oPayload,  // Send the stringified data as parameters
					success: function (oData) {
						if (oData.TimeSheetSubmit.status === "Error") {
							sap.m.MessageBox.error("TimeSheet already submitted for this time period");
						} else {
							MessageToast.show("Timesheet" +operation+ " successfully!");
						}
					},
					error: function (oError) {
						MessageToast.show("Error: " + oError.message);
					}
				});
			}
			

			// submit: function (operation) {
			// 	var oView = this.getView();
			// 	var data = this.getOwnerComponent().getModel("oGmodel");
			// 	var sEmail = data.oData['loggedInUser'].Email;
			// 	var sDateRange =  this.byId("dateRangeComboBox").getSelectedItem() ? this.byId("dateRangeComboBox").getSelectedItem().getKey() : ""
			// 	var sFullName = data.oData.loggedInUser.FullName;
			// 	var now = new Date();
			// 	var year = now.getFullYear();
			// 	var month = String(now.getMonth() + 1).padStart(2, '0');
			// 	var day = String(now.getDate()).padStart(2, '0');
			// 	var hours = String(now.getHours()).padStart(2, '0');
			// 	var minutes = String(now.getMinutes()).padStart(2, '0');
			// 	var seconds = String(now.getSeconds()).padStart(2, '0');
			// 	var timesheetId = `T${year}${month}${day}${hours}${minutes}${seconds}`;
			// 	var formatedDate = year + '-' + month + '-' + day;

			// 	// Create the Header data object
			// 	if (!sDateRange) {
			// 			sap.m.MessageBox.error("Please select a date range before submitting.");
			// 			return;
			// 		}
				
			// 	var oHeader = {
			// 		TIMESHEETID: timesheetId,
			// 		PERIOD: sDateRange,
			// 		EMPLOYEENAME: sFullName,
			// 		STATUS: operation,
			// 		DATE: formatedDate,
			// 		EMPLOYEEID_EMPLOYEEID: that.sEmpID
			// 	};

			// 	// Collect data from the table
			// 	var aItemsData = [];
			// 	var oTable = this.byId("allocationTable");
			// 	var aItems = oTable.getItems();

			// 	for (var i = 0; i < aItems.length; i++) {
			// 		var oItem = aItems[i];
			// 		var oCells = oItem.getCells();
			// 		var uniqueID = Date.now() % 1000000000 + Math.floor(Math.random() * 1000);

			// 		var totalHours = parseInt(oCells[11].getText(), 10) || 0;
			// 		var availableHours = parseInt(oCells[12].getText(), 10) || 0;
			// 		var remainingHours = availableHours; 
			
			// 		if (operation === "Submitted" && i < aItems.length - 1) {
						
			// 			remainingHours = availableHours - totalHours;
			// 		}
			// 		// for(var j=0;j< aItems.length - 1;j++){
			// 		if( i !== aItems.length-1){
			// 			if (totalHours > availableHours) {
			// 				sap.m.MessageBox.error("WorkingHours is greater than available hours for one of the entries.");
			// 				// MessageToast.show("WorkingHours is greater than available hours for one of the entries.");
			// 				return; 
			// 			}
					

			// 		var sProjectType = oCells[0].getSelectedKey();
			// 		var sProjectName = oCells[1].getSelectedKey();
			// 		var sProjectPhase = oCells[2].getSelectedKey();
			
			// 		if (!sProjectType ) {
			// 			sap.m.MessageBox.error("Please select Project Type before submitting.");
			// 			return;  
			// 		}
					
			// 		if ( !sProjectName) {
			// 			sap.m.MessageBox.error("Please select Project Name before submitting.");
			// 			return;  
			// 		}
					
			// 		if ( !sProjectPhase) {
			// 			sap.m.MessageBox.error("Please  Project Phase before submitting.");
			// 			return;  
			// 		}
			// 	}
					

			// 		// }
					
			// 		var oEntry = {
			// 			AUTO_INCREMENT_ID: uniqueID,
			// 			TIMESHEETID: timesheetId,
			// 			EMPLOYEENAME: sFullName,
			// 			PERIOD: sDateRange,
			// 			PROJECTID_PROJECTID: oCells[1].getSelectedKey() || "",
			// 			PROJECTNAME: oCells[1].getSelectedItem() ? oCells[1].getSelectedItem().getText() : "",
			// 			PROJECTTYPE: oCells[0].getSelectedKey() || "",
			// 			PHASE: oCells[2].getSelectedKey() || "",
			// 			DELIVERABLE: oCells[3].getItems().length > 0 ? oCells[3].getItems()[0].getValue() : "",
			// 			MONDAY: parseInt(oCells[4].getValue(), 10) || 0,
			// 			TUESDAY: parseInt(oCells[5].getValue(), 10) || 0,
			// 			WEDNESDAY: parseInt(oCells[6].getValue(), 10) || 0,
			// 			THURSDAY: parseInt(oCells[7].getValue(), 10) || 0,
			// 			FRIDAY: parseInt(oCells[8].getValue(), 10) || 0,
			// 			SATURDAY: parseInt(oCells[9].getValue(), 10) || 0,
			// 			SUNDAY: parseInt(oCells[10].getValue(), 10) || 0,
			// 			WORKINGHOURS: totalHours,
			// 			AvailableHours:remainingHours
			// 		};
			// 		aItemsData.push(oEntry);
			// 	}

			// 	// Prepare the payload by stringifying the objects
			// 	var oPayload = {
			// 		headerData: JSON.stringify(oHeader),
			// 		itemsData: JSON.stringify(aItemsData),
			// 		period: that.sDateRange
			// 	};

			// 	// Get the OData model and call the function
			// 	var oModel = this.getOwnerComponent().getModel("oModel");
			// 	oModel.callFunction("/TimeSheetSubmit", {
			// 		urlParameters: oPayload,  // Send the stringified data as parameters
			// 		success: function (oData) {
			// 			if (oData.TimeSheetSubmit.status === "Error") {
			// 				sap.m.MessageBox.error("TimeSheet already submitted for this time period");
			// 			} else {
			// 				MessageToast.show("Timesheet saved successfully!");
			// 			}
			// 		},
			// 		error: function (oError) {
			// 			MessageToast.show("Error: " + oError.message);
			// 			// sap.m.MessageBox("TimeSheet already submitted for this time period")
			// 		}
			// 	});
			// }
		});
	}
);