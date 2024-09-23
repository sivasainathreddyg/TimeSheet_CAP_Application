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
            SELECT.from("TIMESHEETTABLE_PROJECTDETAILS")
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
                    .columns("period", "Status", "EMPLOYEENAME")
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
                    .columns("period", "Status", "EMPLOYEENAME")
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
    
        const { Status, EmpName, Period } = parsedData;
    
        try {
           
            await cds.update('TIMESHEETTABLE_TIMESHEETHEADER')
                .set({ STATUS: Status })
                .where({ EMPLOYEENAME: EmpName, PERIOD: Period });
    
            return 'Timesheet status updated successfully';
        } catch (error) {
            return req.error(500, 'Failed to update timesheet status: ' + error.message);
        }
    });
    


    srv.on('TimeSheetSubmit', async (req) => {
        try {
            const headerData = JSON.parse(req.data.headerData);
            const itemsData = JSON.parse(req.data.itemsData);
            const period = req.data.period;
            const empname = headerData.EMPLOYEENAME;

            const existingHeader = await cds.run(
                SELECT.one.from('TIMESHEETTABLE_TIMESHEETHEADER').where({ PERIOD: period, EMPLOYEENAME: empname })
            );

            if (existingHeader) {

                await cds.run(
                    DELETE.from('TIMESHEETTABLE_TIMESHEETHEADER').where({ PERIOD: period, EMPLOYEENAME: empname })
                );
                await cds.run(
                    DELETE.from('TIMESHEETTABLE_TIMESHEETITEM').where({ PERIOD: period, EMPLOYEENAME: empname })
                );
            }


            await cds.run(
                INSERT.into('TIMESHEETTABLE_TIMESHEETHEADER').entries(headerData)
            );


            const itemsInsertPromises = itemsData.map(item => {
                return cds.run(
                    INSERT.into('TIMESHEETTABLE_TIMESHEETITEM').entries(item)
                );
            });

            await Promise.all(itemsInsertPromises);

            if (headerData.STATUS = "Submitted") {
                const projectUpdatePromises = itemsData.map(async (item) => {
                    const { PROJECTID_PROJECTID: projectid, AvailableHours } = item;

                    await cds.run(
                        UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
                            .set({ REMAININGHOURS: AvailableHours })
                            .where({ PROJECTID: projectid })
                    );
                    await cds.run(
                        UPDATE('TIMESHEETTABLE_PROJECTKO')
                            .set({ REMAININGHOURS: AvailableHours })
                            .where({ PROJECTID: projectid })
                    )
                    if (AvailableHours === 0) {
                        await cds.run(
                            UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
                                .set({ STATUS: "Completed" })
                                .where({ PROJECTID: projectid })
                        );
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
