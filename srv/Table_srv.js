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
            const { PASSWORD, EMPLOYEESTATUS, EMPLOYEETYPE, MANAGERFALG, ...filteredEmployee } = employee;
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

        if (employee) {
            const fullName = `${employee.FIRSTNAME} ${employee.LASTNAME}`;

            const timesheetData = await cds.transaction(req).run(
                SELECT.from("TIMESHEETTABLE_TIMESHEETHEADER")
                    .columns("period", "Status", "EMPLOYEENAME")
                    .where({ EMPLOYEEID_EMPLOYEEID: empid })
            );
            //  console.log("timesheet:",timesheetData);
            //  console.log("employee:",employee);

            if (timesheetData && timesheetData.length > 0) {
                // const result = timesheetData.map(timesheet => ({
                //     EMPLOYEENAME: fullName,
                //     PERIOD: timesheet.period,
                //     STATUS: timesheet.Status
                // }));

                return JSON.stringify(timesheetData);
            } else {
                return JSON.stringify();
            }
        } else {
            return JSON.stringify();
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
                    const { PROJECTID_PROJECTID, AvailableHours } = item;

                    await cds.run(
                        UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
                            .set({ REMAININGHOURS: AvailableHours })
                            .where({ PROJECTID: PROJECTID_PROJECTID })
                    );
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
