const cds = require("@sap/cds");

module.exports = srv => {
    // Function to check credentials and return employee details
    srv.on("checkCredentials", async req => {
        const { email, password } = req.data;

        var employee = await cds.transaction(req).run(
            SELECT.one.from("TIMESHEETTABLE_EMPLOYEEDETAILS").where({ EmailID: email, Password: password })
        );

        console.log("employee found:", employee);

        if (employee) {
            const { PASSWORD, EMPLOYEESTATUS, EMPLOYEETYPE, ...filteredEmployee } = employee;
            const fullName = `${filteredEmployee.FIRSTNAME} ${filteredEmployee.LASTNAME}`;
            filteredEmployee.FULLNAME = fullName;

            return [filteredEmployee];
        } else {
            return [];
        }
    });



    // srv.on("checkCredentials", async req => {
    //     try {
    //         const allEmployees = await cds.run(
    //             'SELECT * FROM TIMESHEETTABLE_HOILDAY'
    //         );
    //         console.log("All employees:", allEmployees);

    //         if (allEmployees.length > 0) {
    //             console.log("Data found:", allEmployees);
    //         } else {
    //             console.log("No data found.");
    //         }
    //     } catch (error) {
    //         console.error("Error executing query:", error);
    //     }
    // });



    srv.on("Detailsofproject", async req => {
        const projectDetails = await cds.transaction(req).run(
            SELECT.from("TIMESHEETTABLE_PROJECTDETAILS").where({STATUS:"Active"})
        );

        if (projectDetails && projectDetails.length > 0) {
            return JSON.stringify(projectDetails); // Return project details as JSON string
        } else {
            return JSON.stringify()
        }
    });

    srv.on("AvailableHours", async req => {
        const projectid = req.data.ProjectID;
        const AvailableHours = await cds.transaction(req).run(
            SELECT.one('REMAININGHOURS').from('TIMESHEETTABLE_PROJECTDETAILS').where({ ProjectID: projectid })
        );

        if (AvailableHours) {
            return { AvailableHours: AvailableHours.REMAININGHOURS };
        } else {
            return { AvailableHours: 0 };
        }
    });


    srv.on("TimeSheetdata", async req => {
        const empid = req.data.empid.trim();

        const employee = await cds.transaction(req).run(
            SELECT.one.from("TIMESHEETTABLE_EMPLOYEEDETAILS").where({ EMPLOYEEID: empid })
        );

        if (employee.MANAGERFLAG === "No") {
            const fullName = `${employee.FIRSTNAME} ${employee.LASTNAME}`;

            const timesheetData = await cds.transaction(req).run(
                SELECT.from("TIMESHEETTABLE_TIMESHEETHEADER")
                    .columns("period", "Status", "EMPLOYEENAME","Date","SubmittedBy")
                    .where({ EMPLOYEEID_EMPLOYEEID: empid })
            );
            if (timesheetData && timesheetData.length > 0) {

                return JSON.stringify(timesheetData);
            } else {
                return JSON.stringify();
            }
        } else {
            const fullName = `${employee.FIRSTNAME} ${employee.LASTNAME}`;

            const ALLtimesheetData = await cds.transaction(req).run(
                SELECT.from("TIMESHEETTABLE_TIMESHEETHEADER")
                    .columns("period", "Status", "EMPLOYEENAME","Date","SubmittedBy")
                    .where({ Status: { in: ['Submitted', 'Approved'] } })
            );
            if (ALLtimesheetData && ALLtimesheetData.length > 0) {

                return JSON.stringify(ALLtimesheetData);
            }
        }
    });

    srv.on('HolidayCheck', async (req) => {
        try {
            const dateArray = JSON.parse(req.data.dates);

            const onlyDates = dateArray.map(item => item.date);

            // Query the holiday table for matching dates
            const results = await SELECT.from('TIMESHEETTABLE_HOILDAY').where({ Date: { in: onlyDates } });

            // If results exist, map them to a new array with the desired format
            if (results.length > 0) {
                const matchingHolidays = results.map(holiday => ({
                    HoildayName: holiday.HOILDAYNAME,
                    Date: holiday.DATE  // Format Date to 'YYYY-MM-DD'
                }));

                // Return the matching holidays as a JSON response
                return JSON.stringify(matchingHolidays);
            } else {
                // No matching holidays found
                return JSON.stringify({ message: 'No holidays found for the given dates.' });
            }

        } catch (error) {
            console.error('Error in Hoildaycheck action:', error);
            return JSON.stringify({ error: 'An error occurred while checking holidays.' });
        }
    });
    srv.on('TimeSheetApproved', async (req) => {
        // Parse the stringified JSON data
        const { data } = req.data;
        let parsedData;
    
        try {
            parsedData = JSON.parse(data);
        } catch (error) {
            return req.error(400, 'Invalid JSON data provided.');
        }
    
        const { Status, EmpName, Period,sDate,sSubmittedby} = parsedData;
    
        try {
           
            await cds.update('TIMESHEETTABLE_TIMESHEETHEADER')
                .set({ STATUS: Status ,DATE:sDate,SUBMITTEDBY:sSubmittedby})
                .where({ EMPLOYEENAME: EmpName, PERIOD: Period });
    
            return 'Timesheet status updated successfully';
        } catch (error) {
            return req.error(500, 'Failed to update timesheet status: ' + error.message);
        }
    });


    srv.on('TimeSheetDelete', async (req) => {
        const { deleteddata } = req.data;
        let parsedData;
    
        try {
            parsedData = JSON.parse(deleteddata);
        } catch (error) {
            return req.error(400, 'Invalid JSON data provided.');
        }
        const { Period, EmpName } = parsedData;
        try {
            // Step 1: Fetch the existing header data
            const existingHeaderData = await cds.run(
                SELECT.one.from('TIMESHEETTABLE_TIMESHEETHEADER').where({ PERIOD: Period, EMPLOYEENAME: EmpName })
            );
    
            if (existingHeaderData) {
                // Step 2: Fetch the items data related to this timesheet
                const existingItemsData = await cds.run(
                    SELECT.from('TIMESHEETTABLE_TIMESHEETITEM').where({ PERIOD: Period, EMPLOYEENAME: EmpName })
                );
    
                // Exclude the last item from the array
                const itemsWithoutLast = existingItemsData.slice(0, -1);  // Exclude the last row
    
                // Step 3: Accumulate hours by project ID
                let projectHoursMap = {};
    
                itemsWithoutLast.forEach(item => {
                    const projectId = item.PROJECTID_PROJECTID;
                    const workedHours = item.WORKINGHOURS;
    
                    // Accumulate hours for the same project
                    if (projectHoursMap[projectId]) {
                        projectHoursMap[projectId] += workedHours;
                    } else {
                        projectHoursMap[projectId] = workedHours;
                    }
                });
    
                // Step 4: Process each project and update remaining hours and status
                const projectUpdatePromises = Object.keys(projectHoursMap).map(async (projectId) => {
                    const totalWorkedHours = projectHoursMap[projectId];
    
                    // Fetch project details to get the remaining hours and status
                    const projectDetails = await cds.run(
                        SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS').where({ PROJECTID: projectId })
                    );
    
                    if (projectDetails) {
                        const newRemainingHours = projectDetails.REMAININGHOURS + totalWorkedHours;
                        let newStatus = projectDetails.STATUS;
    
                        // If remaining hours were 0 and now it's greater than 0, set status to Active
                        if (newRemainingHours > 0 && projectDetails.REMAININGHOURS === 0) {
                            newStatus = "Active";
                        }
    
                        // If remaining hours are 0 after update, set status to Completed
                        if (newRemainingHours === 0) {
                            newStatus = "Completed";
                        }
    
                        // Update project details with new remaining hours and status
                        await cds.run(
                            UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
                                .set({ REMAININGHOURS: newRemainingHours, STATUS: newStatus })
                                .where({ PROJECTID: projectId })
                        );
                    }
                });
    
                await Promise.all(projectUpdatePromises);  // Ensure all updates are processed
    
                // Step 5: Delete the header and items data
                await cds.run(
                    DELETE.from('TIMESHEETTABLE_TIMESHEETHEADER').where({ PERIOD: Period, EMPLOYEENAME: EmpName })
                );
                await cds.run(
                    DELETE.from('TIMESHEETTABLE_TIMESHEETITEM').where({ PERIOD: Period, EMPLOYEENAME: EmpName })
                );
    
                return {
                    status: 'Success',
                    message: 'Timesheet data deleted and project hours restored successfully'
                };
            } else {
                return {
                    status: 'Error',
                    message: 'No timesheet data found for the provided period and employee name'
                };
            }
        } catch (error) {
            console.error("Error processing timesheet data:", error);
            return {
                status: 'Error',
                message: 'Failed to delete timesheet data and restore project hours',
                error: error.message
            };
        }
    });
    
    

    // srv.on('TimeSheetDelete', async (req) => {
        // const { deleteddata } = req.data;
        // let parsedData;
    
        // try {
        //     parsedData = JSON.parse(deleteddata);
        // } catch (error) {
        //     return req.error(400, 'Invalid JSON data provided.');
        // }
        // const { Period, EmpName } = parsedData;

    //     try {
    //         // Step 1: Fetch the existing header data
    //         const existingHeaderData = await cds.run(
    //             SELECT.one.from('TIMESHEETTABLE_TIMESHEETHEADER').where({ PERIOD: Period, EMPLOYEENAME: EmpName })
    //         );
    
    //         if (existingHeaderData) {
    //             // Step 2: Fetch the items data related to this timesheet
    //             const existingItemsData = await cds.run(
    //                 SELECT.from('TIMESHEETTABLE_TIMESHEETITEM').where({ PERIOD: Period, EMPLOYEENAME: EmpName })
    //             );
    //             const itemsWithoutLast = existingItemsData.slice(0, -1);
    //             // Step 3: Restore available hours in TIMESHEETTABLE_PROJECTDETAILS and TIMESHEETTABLE_PROJECTKO
    //             const projectUpdatePromises = itemsWithoutLast.map(async (item) => {
    //                 const projectId = item.PROJECTID_PROJECTID;
    //                 const workedHours = item.WORKINGHOURS;  // The hours worked that we need to restore
    
    //                 // Add the worked hours back to the project details table
    //                 await cds.run(
    //                     UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
    //                         .set({ REMAININGHOURS: { '+=': workedHours } })
    //                         .where({ PROJECTID: projectId })
    //                 );
    //                 // Optionally, update the PROJECTKO table as well
    //                 await cds.run(
    //                     UPDATE('TIMESHEETTABLE_PROJECTKO')
    //                         .set({ REMAININGHOURS: { '+=': workedHours } })
    //                         .where({ PROJECTID: projectId })
    //                 );
    //             });
    
    //             await Promise.all(projectUpdatePromises);  // Ensure all updates are processed
    
    //             // Step 4: Delete the header and items data
    //             await cds.run(
    //                 DELETE.from('TIMESHEETTABLE_TIMESHEETHEADER').where({ PERIOD: Period, EMPLOYEENAME: EmpName })
    //             );
    //             await cds.run(
    //                 DELETE.from('TIMESHEETTABLE_TIMESHEETITEM').where({ PERIOD: Period, EMPLOYEENAME: EmpName })
    //             );
    
    //             return {
    //                 status: 'Success',
    //                 message: 'Timesheet data deleted and project hours restored successfully'
    //             };
    //         } else {
    //             return {
    //                 status: 'Error',
    //                 message: 'No timesheet data found for the provided period and employee name'
    //             };
    //         }
    //     } catch (error) {
    //         console.error("Error processing timesheet data:", error);
    //         return {
    //             status: 'Error',
    //             message: 'Failed to delete timesheet data and restore project hours',
    //             error: error.message
    //         };
    //     }
    // });
    

    // srv.on('TimeSheetDelete',async(req) =>{
    //     const { Period, EmpName } = req.data;
    //     try{
    //        const existinghederdata=await cds.run(
    //         SELECT.one.from('TIMESHEETTABLE_TIMESHEETHEADER').where({PERIOD:Period,EMPLOYEENAME:EmpName})
    //        );
    //        if(existinghederdata){
    //         await cds.run(
    //             DELETE.from('TIMESHEETTABLE_TIMESHEETHEADER').where({PERIOD:Period,EMPLOYEENAME:EmpName})
    //         );
    //         await cds.run(
    //             DELETE.from('TIMESHEETTABLE_TIMESHEETITEM').where({PERIOD:Period,EMPLOYEENAME:EmpName})
    //         );
    //        }
    //     }catch(error){
    //         console.error("Error processing timesheet data:", error);
    //         return {
    //             status: 'Error',
    //             message: 'Failed to delete project details',
    //             error: error.message
    //         };

    //     }
    // })
    srv.on('TimeSheetSubmit', async (req) => {
        try {
            const headerData = JSON.parse(req.data.headerData);
            const itemsData = JSON.parse(req.data.itemsData);
            const period = req.data.period;
            const empname = headerData.EMPLOYEENAME;
    
            // Check if the timesheet for this period and employee already exists
            const existingHeader = await cds.run(
                SELECT.one.from('TIMESHEETTABLE_TIMESHEETHEADER').where({ PERIOD: period, EMPLOYEENAME: empname })
            );
    
            if (existingHeader) {
                // Delete existing timesheet data if already present
                await cds.run(
                    DELETE.from('TIMESHEETTABLE_TIMESHEETHEADER').where({ PERIOD: period, EMPLOYEENAME: empname })
                );
                await cds.run(
                    DELETE.from('TIMESHEETTABLE_TIMESHEETITEM').where({ PERIOD: period, EMPLOYEENAME: empname })
                );
            }
    
            // Insert new header data
            await cds.run(
                INSERT.into('TIMESHEETTABLE_TIMESHEETHEADER').entries(headerData)
            );
    
            // Insert new item data
            const itemsInsertPromises = itemsData.map(item => {
                return cds.run(
                    INSERT.into('TIMESHEETTABLE_TIMESHEETITEM').entries(item)
                );
            });
            await Promise.all(itemsInsertPromises);
    
            // Handle project hours update only if status is "Submitted"
            if (headerData.STATUS === "Submitted") {
                // Create a map to track total hours worked per project
                const projectHoursMap = {};
    
                // Calculate total hours for each project by summing up the hours worked on the same project
                itemsData.forEach((item, index) => {
                    // Skip the last row of items
                    if (index === itemsData.length - 1) {
                        return;
                    }
                
                    const projectid = item.PROJECTID_PROJECTID;
                    const workedHours = item.WORKINGHOURS; // Assuming `WORKINGHOURS` is the field that stores the hours worked
                
                    // Accumulate hours for the same project
                    if (projectHoursMap[projectid]) {
                        projectHoursMap[projectid] += workedHours;
                    } else {
                        projectHoursMap[projectid] = workedHours;
                    }
                });
                
                // Update project details for each project based on the total hours worked
                const projectUpdatePromises = Object.keys(projectHoursMap).map(async (projectid) => {
                    const totalWorkedHours = projectHoursMap[projectid];
    
                    // Get available hours from the project details
                    const projectDetails = await cds.run(
                        SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS').where({ PROJECTID: projectid })
                    );
    
                    if (projectDetails) {
                        const availableHours = projectDetails.REMAININGHOURS;
    
                        // Calculate remaining hours
                        const remainingHours = availableHours - totalWorkedHours;
    
                        // Update the project details and project KO table
                        await cds.run(
                            UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
                                .set({ REMAININGHOURS: remainingHours })
                                .where({ PROJECTID: projectid })
                        );
                        await cds.run(
                            UPDATE('TIMESHEETTABLE_PROJECTKO')
                                .set({ REMAININGHOURS: remainingHours })
                                .where({ PROJECTID: projectid })
                        );
    
                        // If remaining hours are zero, mark the project as "Completed"
                        if (remainingHours === 0) {
                            await cds.run(
                                UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
                                    .set({ STATUS: "Completed" })
                                    .where({ PROJECTID: projectid })
                            );
                        }
                    }
                });
    
                await Promise.all(projectUpdatePromises);
            }
    
            return {
                status: 'Success',
                message: 'Timesheet data saved and project details updated successfully'
            };
    
        } catch (error) {
            console.error("Error processing timesheet data:", error);
            return {
                status: 'Error',
                message: 'Failed to save timesheet data and update project details',
                error: error.message
            };
        }
    });
      

    // srv.on('TimeSheetSubmit', async (req) => {
    //     try {
    //         const headerData = JSON.parse(req.data.headerData);
    //         const itemsData = JSON.parse(req.data.itemsData);
    //         const period = req.data.period;
    //         const empname = headerData.EMPLOYEENAME;

    //         const existingHeader = await cds.run(
    //             SELECT.one.from('TIMESHEETTABLE_TIMESHEETHEADER').where({ PERIOD: period, EMPLOYEENAME: empname })
    //         );

    //         if (existingHeader) {

    //             await cds.run(
    //                 DELETE.from('TIMESHEETTABLE_TIMESHEETHEADER').where({ PERIOD: period, EMPLOYEENAME: empname })
    //             );
    //             await cds.run(
    //                 DELETE.from('TIMESHEETTABLE_TIMESHEETITEM').where({ PERIOD: period, EMPLOYEENAME: empname })
    //             );
    //         }


    //         await cds.run(
    //             INSERT.into('TIMESHEETTABLE_TIMESHEETHEADER').entries(headerData)
    //         );


    //         const itemsInsertPromises = itemsData.map(item => {
    //             return cds.run(
    //                 INSERT.into('TIMESHEETTABLE_TIMESHEETITEM').entries(item)
    //             );
    //         });

    //         await Promise.all(itemsInsertPromises);

    //         if (headerData.STATUS = "Submitted") {
    //             const projectUpdatePromises = itemsData.map(async (item) => {
    //                 const { PROJECTID_PROJECTID: projectid, AvailableHours } = item;

    //                 await cds.run(
    //                     UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
    //                         .set({ REMAININGHOURS: AvailableHours })
    //                         .where({ PROJECTID: projectid })
    //                 );
    //                 await cds.run(
    //                     UPDATE('TIMESHEETTABLE_PROJECTKO')
    //                         .set({ REMAININGHOURS: AvailableHours })
    //                         .where({ PROJECTID: projectid })
    //                 )
    //                 if (AvailableHours === 0) {
    //                     await cds.run(
    //                         UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
    //                             .set({ STATUS: "Completed" })
    //                             .where({ PROJECTID: projectid })
    //                     );
    //                 }
    //             });

    //             await Promise.all(projectUpdatePromises);

    //         }


    //         return {
    //             status: 'Success',
    //             message: 'Timesheet data saved and project details updated successfully'
    //         };

    //     } catch (error) {
    //         console.error("Error processing timesheet data:", error);
    //         return {
    //             status: 'Error',
    //             message: 'Failed to save timesheet data and update project details',
    //             error: error.message
    //         };
    //     }
    // });


    // srv.on('TimeSheetSubmit', async (req) => {
    //     try {

    //         const headerData = JSON.parse(req.data.headerData);
    //         const itemsData = JSON.parse(req.data.itemsData);
    //         const period = req.data.period;
    //         const empname = headerData.EMPLOYEENAME;
    //         const existingHeader = await cds.run(
    //             SELECT.one.from('TIMESHEETTABLE_TIMESHEETHEADER').where({ PERIOD: period, EMPLOYEENAME: empname })
    //         );

    //         if (existingHeader) {
    //             await cds.run(
    //                 DELETE.from('TIMESHEETTABLE_TIMESHEETHEADER').where({ PERIOD: period, EMPLOYEENAME: empname })
    //             );
    //             await cds.run(
    //                 DELETE.from('TIMESHEETTABLE_TIMESHEETITEM').where({ PERIOD: period, EMPLOYEENAME: empname })
    //             );
    //         }
    //         await cds.run(
    //             INSERT.into('TIMESHEETTABLE_TIMESHEETHEADER').entries(headerData)
    //         );
    //         const itemsInsertPromises = itemsData.map(item => {
    //             return cds.run(
    //                 INSERT.into('TIMESHEETTABLE_TIMESHEETITEM').entries(item)
    //             );
    //         });

    //         await Promise.all(itemsInsertPromises);

    //         return {
    //             status: 'Success',
    //             message: 'Timesheet data saved successfully'
    //         };

    //     } catch (error) {
    //         console.error("Error inserting timesheet data:", error);
    //         return {
    //             status: 'Error',
    //             message: 'Failed to save timesheet data',
    //             error: error.message
    //         };
    //     }
    // });


    // srv.on('TimeSheetSubmit', async (req) => {
    //     try {
    //         // Parse the stringified data into objects
    //         const headerData = JSON.parse(req.data.headerData);
    //         const itemsData = JSON.parse(req.data.itemsData);

    //         // Insert header data
    //         await cds.run(
    //             INSERT.into('TIMESHEETTABLE_TIMESHEETHEADER').entries(headerData)
    //         );

    //         // Insert each item from the items array
    //         const itemsInsertPromises = itemsData.map(item => {
    //             return cds.run(
    //                 INSERT.into('TIMESHEETTABLE_TIMESHEETITEM').entries(item)
    //             );
    //         });

    //         await Promise.all(itemsInsertPromises);


    //         return {
    //             status: 'Success',
    //             message: 'Timesheet data saved successfully'
    //         };
    //     } catch (error) {
    //         console.error("Error inserting timesheet data:", error);
    //         return {
    //             status: 'Error',
    //             message: 'Failed to save timesheet data',
    //             error: error.message
    //         };
    //     }
    // });

    srv.on('RetriveTimeSheetdata', async (req) => {
        const { EmployeeName, period, Status } = req.data;

        try {
            // Fetch the header from TIMESHEETTABLE_TIMESHEETHEADER
            const header = await SELECT.one.from("TIMESHEETTABLE_TIMESHEETHEADER")
                .where({ EMPLOYEENAME: EmployeeName, PERIOD: period });

            // If no header is found, return an empty response
            if (!header) {
                return JSON.stringify({ header: [], items: [] });
            }

            // Fetch associated TimeSheetItem data using the TimeSheetID from header
            let items = await SELECT.from("TIMESHEETTABLE_TIMESHEETITEM")
                .where({ EMPLOYEENAME: EmployeeName, PERIOD: period });

            if (Status === "Save") {
                // If Status is "Save", update AvailableHours in the items
                const updatedItemsPromises = items.map(async (item) => {
                    const { PROJECTID_PROJECTID } = item;

                    // Fetch available hours from TIMESHEETTABLE_PROJECTDETAILS based on ProjectID
                    const projectDetails = await SELECT.one.from("TIMESHEETTABLE_PROJECTDETAILS")
                        .where({ PROJECTID: PROJECTID_PROJECTID });

                    if (projectDetails) {
                        // Update AvailableHours in the item
                        item.AVAILABLEHOURS = projectDetails.REMAININGHOURS;
                    } else {
                        // Set to 0 or some default value if project details are not found
                        item.AVAILABLEHOURS = 0;
                    }

                    return item;  // Return the updated item
                });

                // Wait for all promises to resolve
                items = await Promise.all(updatedItemsPromises);
            }

            // Combine header and items into a single object
            const responseData = {
                header: [header],
                items: items
            };

            // Return the response as a stringified JSON object
            return JSON.stringify(responseData);

        } catch (error) {
            console.error("Error retrieving timesheet data:", error);
            req.error(500, "Failed to retrieve timesheet data.");
        }
    });



};
