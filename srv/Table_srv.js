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

    srv.on("TimeSheetdata", async req => {
        const empid = req.data.empid.trim();

        const employee = await cds.transaction(req).run(
            SELECT.one.from("TIMESHEETTABLE_EMPLOYEEDETAILS").where({ EmployeeID: empid })
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

    srv.on('submitTimeSheet', async (req) => {
        const { headerData, itemsData } = req.data;
        console.log("header", headerData);
        console.log("items", itemsData);
        const tx = cds.transaction(req);
        try {
            headerObject = JSON.parse(headerData);
            itemsArray = JSON.parse(itemsData);
            await tx.run(
                INSERT.into('TIMESHEETTABLE_TIMESHEETHEADER').entries(headerData)
            );

            const itemsInsertPromises = itemsData.map(item => {
                return tx.run(
                    INSERT.into('TIMESHEETTABLE_TIMESHEETITEM').entries(item)
                );
            });

            await Promise.all(itemsInsertPromises);
            await tx.commit();

            return {
                status: 'Success',
                message: 'Timesheet data saved successfully'
            };
        } catch (error) {
            await tx.rollback();
            console.error("Error inserting timesheet data:", error);
            return {
                status: 'Error',
                message: 'Failed to save timesheet data',
                error: error.message
            };
        }
    });

};
