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
    srv.on("Authorizechecking", async req => {
        const { email, password } = req.data;

        try {
            // Step 1: Retrieve employee details using email and password
            const employee = await cds.transaction(req).run(
                SELECT.one.from("TIMESHEETTABLE_EMPLOYEEDETAILS")
                    .where({ EmailID: email, Password: password })
            );

            // Step 2: If employee is found, proceed with further checks
            if (employee) {
                const { MANAGERFLAG } = employee;

                // Step 3: Check if ManagerFlag is 'Yes'
                if (MANAGERFLAG === 'Yes') {
                    // Successful authorization for managers
                    return "success";
                } else {
                    // If ManagerFlag is 'No', return an unauthorized message
                    return req.error(403, 'Unauthorized user: You do not have manager privileges.');
                }
            } else {
                // If employee not found, return invalid credentials message
                return req.error(401, 'Invalid credentials: Email or password is incorrect.');
            }
        } catch (error) {
            // Handle any unexpected errors
            return req.error(500, 'An error occurred while authorizing: ' + error.message);
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
            SELECT.from("TIMESHEETTABLE_PROJECTDETAILS").where({ STATUS: "Active" })
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
    srv.on("projectdetails", async req => {
        const projectid = req.data.projectid;
        const projectdata = await cds.transaction(req).run(
            SELECT.from("TIMESHEETTABLE_PROJECTDETAILS").where({ projectID: projectid })
        );
        if (projectdata) {
            return JSON.stringify(projectdata);
        } else {
            return JSON.stringify()
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
                    .columns("period", "Status", "EMPLOYEENAME", "Date", "SubmittedBy")
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
                    .columns("period", "Status", "EMPLOYEENAME", "Date", "SubmittedBy")
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

        const { Status, EmpName, Period, sDate, sSubmittedby } = parsedData;

        try {

            await cds.update('TIMESHEETTABLE_TIMESHEETHEADER')
                .set({ STATUS: Status, DATE: sDate, SUBMITTEDBY: sSubmittedby })
                .where({ EMPLOYEENAME: EmpName, PERIOD: Period });

            return 'Timesheet status updated successfully';
        } catch (error) {
            return req.error(500, 'Failed to update timesheet status: ' + error.message);
        }
    });
    srv.on("retriveemployeedetails", async (req) => {
        const empid = req.data.employeeid.trim(); // Trim the employee ID from the request

        try {

            const employee = await cds.transaction(req).run(
                SELECT.one.from("TIMESHEETTABLE_EMPLOYEEDETAILS").where({ EMPLOYEEID: empid })
            );

            if (employee) {

                const employeeData = JSON.stringify(employee);


                return { status: "success", data: employeeData };
            } else {

                return { status: "error", message: "Employee not found." };
            }

        } catch (error) {
            // Handle any errors that occur during the process
            return { status: "error", message: "An error occurred while retrieving employee details." };
        }
    });

    srv.on('CreateNewProject', async (req) => {
        // Parse the stringified JSON data
        let parsedData;

        try {
            // Parse the NewEmployeeData string to JSON
            parsedData = JSON.parse(req.data.Newprojectdetailsdata);
        } catch (error) {
            return req.error(400, 'Invalid JSON data provided.');
        }

        const {
            ProjectID, Status, KY, ProjectName, Department,
            StartDate, EndDate, TotalHours, RemainingHours
        } = parsedData;

        try {
            // Step 1: Check if EmployeeID already exists in the EmployeeDetails table
            const existingEmployee = await cds.transaction(req).run(
                SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS')
                    .where({ PROJECTID: ProjectID })
            );

            // If employee already exists, throw an error
            if (existingEmployee) {
                return req.error(400, `projects with ID ${ProjectID} already exists.`);
            }
            const formattedStartDate = new Date(StartDate).toISOString().slice(0, 19); // Format to "YYYY-MM-DDTHH:MM:SS"
            const formattedEndDate = new Date(EndDate).toISOString().slice(0, 19);
            // Step 2: If not, insert a new employee record into the EmployeeDetails table
            await cds.transaction(req).run(
                INSERT.into('TIMESHEETTABLE_PROJECTDETAILS').entries({
                    ProjectID: ProjectID,
                    Status: Status,
                    KY: KY,
                    ProjectName: ProjectName,
                    Department: Department,
                    StartDate: formattedStartDate,
                    EndDate: formattedEndDate,
                    TotalHours: TotalHours,
                    RemainingHours: RemainingHours
                })
            );

            // Step 3: Return success message
            return 'Employee Details Created successfully';
        } catch (error) {
            return req.error(500, 'Failed to create employee details: ' + error.message);
        }
    });


    srv.on('CreateNewEmployeeDeatils', async (req) => {
        // Parse the stringified JSON data
        let parsedData;

        try {
            // Parse the NewEmployeeData string to JSON
            parsedData = JSON.parse(req.data.NewEmployeeData);
        } catch (error) {
            return req.error(400, 'Invalid JSON data provided.');
        }

        const {
            EmployeeID, FirstName, LastName, Designation, Password,
            EmailID, StartDate, EndDate, EmployeeStatus, EmployeeType,
            ManagerFlag
        } = parsedData;

        try {
            // Step 1: Check if EmployeeID already exists in the EmployeeDetails table
            const existingEmployee = await cds.transaction(req).run(
                SELECT.one.from('TIMESHEETTABLE_EMPLOYEEDETAILS')
                    .where({ EmployeeID: EmployeeID })
            );

            // If employee already exists, throw an error
            if (existingEmployee) {
                return req.error(400, `Employee with ID ${EmployeeID} already exists.`);
            }

            // Step 2: If not, insert a new employee record into the EmployeeDetails table
            await cds.transaction(req).run(
                INSERT.into('TIMESHEETTABLE_EMPLOYEEDETAILS').entries({
                    EmployeeID: EmployeeID,
                    FirstName: FirstName,
                    LastName: LastName,
                    Designation: Designation,
                    Password: Password,
                    EmailID: EmailID,
                    StartDate: StartDate,
                    EndDate: EndDate,
                    EmployeeStatus: EmployeeStatus,
                    EmployeeType: EmployeeType,
                    ManagerFlag: ManagerFlag
                })
            );

            // Step 3: Return success message
            return 'Employee Details Created successfully';
        } catch (error) {
            return req.error(500, 'Failed to create employee details: ' + error.message);
        }
    });

    srv.on('UpdateEmployeeDeatils', async (req) => {
        // Parse the stringified JSON data
        let parsedData;

        try {
            // Parse the NewEmployeeData string to JSON
            parsedData = JSON.parse(req.data.updateemployeedata);
        } catch (error) {
            return req.error(400, 'Invalid JSON data provided.');
        }

        const {
            EmployeeID, FirstName, LastName, Designation, Password,
            EmailID, StartDate, EndDate, EmployeeStatus, EmployeeType,
            ManagerFlag
        } = parsedData;

        try {
            // Step 1: Check if EmployeeID already exists in the EmployeeDetails table
            const existingEmployee = await cds.transaction(req).run(
                SELECT.one.from('TIMESHEETTABLE_EMPLOYEEDETAILS')
                    .where({ EmployeeID: EmployeeID })
            );

            // If employee already exists, throw an error
            if (existingEmployee) {
                await cds.run(
                    DELETE.from('TIMESHEETTABLE_EMPLOYEEDETAILS')
                        .where({ EmployeeID: EmployeeID })
                );
            }

            // Step 2: If not, insert a new employee record into the EmployeeDetails table
            await cds.transaction(req).run(
                INSERT.into('TIMESHEETTABLE_EMPLOYEEDETAILS').entries({
                    EmployeeID: EmployeeID,
                    FirstName: FirstName,
                    LastName: LastName,
                    Designation: Designation,
                    Password: Password,
                    EmailID: EmailID,
                    StartDate: StartDate,
                    EndDate: EndDate,
                    EmployeeStatus: EmployeeStatus,
                    EmployeeType: EmployeeType,
                    ManagerFlag: ManagerFlag
                })
            );

            // Step 3: Return success message
            return 'Employee Details Created successfully';
        } catch (error) {
            return req.error(500, 'Failed to create employee details: ' + error.message);
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
        var dates = Period.split("-");
        var startdate = new Date(dates[0]);
        var enddate = new Date(dates[1]);
        var startmonth = startdate.getMonth();
        var endmonth = enddate.getMonth();

        var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        var startMonthName = monthNames[startmonth];
        var endMonthName = monthNames[endmonth];
        try {
            if (startMonthName === endMonthName) {
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
                    const monthColumnMap = {
                        'January': 'JANUARYHOURS',
                        'February': 'FEBRUARYHOURS',
                        'March': 'MARCHHOURS',
                        'April': 'APRILHOURS',
                        'May': 'MAYHOURS',
                        'June': 'JUNEHOURS',
                        'July': 'JULYHOURS',
                        'August': 'AUGUSTHOURS',
                        'September': 'SEPTEMBERHOURS',
                        'October': 'OCTOBERHOURS',
                        'November': 'NOVEMBERHOURS',
                        'December': 'DECEMBERHOURS'
                    };
                    const monthColumnMapRemaining = {
                        'January': 'JANUARYHOURSREMAINING',
                        'February': 'FEBRUARYHOURSREMAINING',
                        'March': 'MARCHHOURSREMAINING',
                        'April': 'APRILHOURSREMAINING',
                        'May': 'MAYHOURSREMAINING',
                        'June': 'JUNEHOURSREMAINING',
                        'July': 'JULYHOURSREMAINING',
                        'August': 'AUGUSTHOURSREMAINING',
                        'September': 'SEPTEMBERHOURSREMAINING',
                        'October': 'OCTOBERHOURSREMAINING',
                        'November': 'NOVEMBERHOURSREMAINING',
                        'December': 'DECEMBERHOURSREMAINING'
                    };


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
                            const startmonthName = new Date(projectDetails.STARTDATE);  // e.g., 'March'
                            const endmonthName = new Date(projectDetails.ENDDATE);      // e.g., 'October'
                            const projectStartMonth = startmonthName.toLocaleString('default', { month: 'long' });
                            const projectEndMonth = endmonthName.toLocaleString('default', { month: 'long' });
                            const months = Object.keys(monthColumnMap);
                            const startMonthIndex = months.indexOf(projectStartMonth);
                            const endMonthIndex = months.indexOf(projectEndMonth);
                            const newRemainingHours = projectDetails.REMAININGHOURS + totalWorkedHours;
                            const Billedhours = projectDetails.BILLEDHOURS - totalWorkedHours;
                            const currentMonthHoursColumn = monthColumnMap[startMonthName];
                            const monthhours = projectDetails[currentMonthHoursColumn] - totalWorkedHours;
                            const availableHours = projectDetails.REMAININGHOURS;
                            const totalHours = projectDetails.TOTALHOURS;

                            // Calculate remaining hours
                            const remainingHours = availableHours - totalWorkedHours;

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
                                    .set({ REMAININGHOURS: newRemainingHours, BILLEDHOURS: Billedhours, [currentMonthHoursColumn]: monthhours, STATUS: newStatus })
                                    .where({ PROJECTID: projectId })
                            );
                            let cumulativeHours = 0;
                            const projectHoursData = await cds.run(
                                SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS')
                                    .columns(Object.values(monthColumnMap))
                                    .where({ PROJECTID: projectId })
                            );
                            // Loop through each month within the project start and end dates
                            for (let i = startMonthIndex; i <= endMonthIndex; i++) {
                                const currentMonth = months[i];
                                const currentMonthHoursColumn = monthColumnMap[currentMonth];
                                const currentRemainingMonthColumn = monthColumnMapRemaining[currentMonth];

                                // Retrieve hours submitted for the current month, defaulting to 0 if undefined
                                const currentMonthHours = projectHoursData[currentMonthHoursColumn] || 0;

                                // Calculate remaining hours for the current month based on cumulative hours
                                const remainingHours = totalHours - (cumulativeHours + currentMonthHours);

                                // Update the remaining hours for the current month in the database
                                await cds.run(
                                    UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
                                        .set({ [currentRemainingMonthColumn]: remainingHours })
                                        .where({ PROJECTID: projectId })
                                );

                                // Accumulate hours up to this month for future calculations
                                cumulativeHours += currentMonthHours;
                            }
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
                }
                else {
                    return {
                        status: 'Error',
                        message: 'No timesheet data found for the provided period and employee name'
                    };
                }
            } else {
                if (startmonth !== endmonth) {
                    const daysInMonth = {
                        Jan: 31, Feb: 28, Mar: 31, Apr: 30, May: 31, Jun: 30, Jul: 31, Aug: 31, Sep: 30, Oct: 31, Nov: 30, Dec: 31
                    };
                    var startdateParts = dates[0].trim().split(" ");
                    var enddateParts = dates[1].trim().split(" ");
                    var startmonthday = startdateParts[0];
                    // var endmonthday=enddateParts[0];
                    var startmonthdate = parseInt(startdateParts[1]);
                    var endmonthdate = parseInt(enddateParts[1]);
                    var monthdaysstart = daysInMonth[startmonthday] - startmonthdate + 1;
                    var monthdayend = endmonthdate;

                    const existingHeaderData = await cds.run(
                        SELECT.one.from('TIMESHEETTABLE_TIMESHEETHEADER').where({ PERIOD: Period, EMPLOYEENAME: EmpName })
                    );
                    if (existingHeaderData) {
                        // Step 2: Fetch the items data related to this timesheet
                        const existingItemsData = await cds.run(
                            SELECT.from('TIMESHEETTABLE_TIMESHEETITEM').where({ PERIOD: Period, EMPLOYEENAME: EmpName })
                        );

                        // Exclude the last item from the array
                        const itemsWithoutLast = existingItemsData.slice(0, -1);

                        // Object to track project hours
                        var projectHourMap = {};

                        for (var i = 0; i < itemsWithoutLast.length; i++) {
                            var oItem = itemsWithoutLast[i];
                            // var oCells = oItem.getCells();
                            var projectid = oItem.PROJECTID_PROJECTID   // Get the project name/key
                            // const totalHours = oItem.TOTALHOURS;



                            // Array to store the day values (Monday to Sunday)
                            var weekHours = [
                                oItem.MONDAY || 0, // Monday
                                oItem.TUESDAY || 0, // Tuesday
                                oItem.WEDNESDAY || 0, // Wednesday
                                oItem.THURSDAY || 0, // Thursday
                                oItem.FRIDAY || 0, // Friday
                                oItem.SATURDAY || 0, // Saturday
                                oItem.SUNDAY || 0 // Sunday
                            ];

                            // Initialize the total hours for the project
                            var firstMonthTotalHours = 0;
                            var secondMonthTotalHours = 0;

                            // Loop to calculate the total hours for the first month (remaining days of the first month)
                            for (var dayIndex = 0; dayIndex < monthdaysstart; dayIndex++) {
                                firstMonthTotalHours += weekHours[dayIndex];
                            }

                            // Loop to calculate the total hours for the second month (days in the second month)
                            for (var dayIndex = 0; dayIndex < monthdayend; dayIndex++) {
                                secondMonthTotalHours += weekHours[monthdaysstart + dayIndex];
                            }

                            // Check if the projectName already exists in the map
                            if (!projectHourMap[projectid]) {
                                // Initialize the project with empty arrays for both months
                                projectHourMap[projectid] = {
                                    firstMonthHours: 0,
                                    secondMonthHours: 0
                                };
                            }

                            // Add the calculated hours to the respective month totals for this project
                            projectHourMap[projectid].firstMonthHours += firstMonthTotalHours;
                            projectHourMap[projectid].secondMonthHours += secondMonthTotalHours;

                            const projectDetails = await cds.run(
                                SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS').where({ PROJECTID: projectid })
                            );
                            const startmonthName = new Date(projectDetails.STARTDATE);  // e.g., 'March'
                            const endmonthName = new Date(projectDetails.ENDDATE);      // e.g., 'October'
                            const projectStartMonth = startmonthName.toLocaleString('default', { month: 'long' });
                            const projectEndMonth = endmonthName.toLocaleString('default', { month: 'long' });
                            const totalHours = projectDetails.TOTALHOURS;

                            // Define month maps for the first and second month columns
                            const firstMonthColumnMap = {
                                'January': 'JANUARYHOURS',
                                'February': 'FEBRUARYHOURS',
                                'March': 'MARCHHOURS',
                                'April': 'APRILHOURS',
                                'May': 'MAYHOURS',
                                'June': 'JUNEHOURS',
                                'July': 'JULYHOURS',
                                'August': 'AUGUSTHOURS',
                                'September': 'SEPTEMBERHOURS',
                                'October': 'OCTOBERHOURS',
                                'November': 'NOVEMBERHOURS',
                                'December': 'DECEMBERHOURS'
                            };
                            const monthColumnMapRemaining = {
                                'January': 'JANUARYHOURSREMAINING',
                                'February': 'FEBRUARYHOURSREMAINING',
                                'March': 'MARCHHOURSREMAINING',
                                'April': 'APRILHOURSREMAINING',
                                'May': 'MAYHOURSREMAINING',
                                'June': 'JUNEHOURSREMAINING',
                                'July': 'JULYHOURSREMAINING',
                                'August': 'AUGUSTHOURSREMAINING',
                                'September': 'SEPTEMBERHOURSREMAINING',
                                'October': 'OCTOBERHOURSREMAINING',
                                'November': 'NOVEMBERHOURSREMAINING',
                                'December': 'DECEMBERHOURSREMAINING'

                            };

                            // Month indexes
                            const months = Object.keys(firstMonthColumnMap);
                            const startMonthIndex = months.indexOf(projectStartMonth);
                            const endMonthIndex = months.indexOf(projectEndMonth);


                            // Get the corresponding columns for the first and second month
                            const firstMonthColumn = firstMonthColumnMap[startMonthName];
                            const secondMonthColumn = firstMonthColumnMap[endMonthName];

                            // Fetch project details for both months
                            const projectDetailsFirstMonth = await cds.run(
                                SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS')
                                    .columns(firstMonthColumn, 'BILLEDHOURS')
                                    .where({ PROJECTID: projectid })
                            );
                            const projectDetailsSecondMonth = await cds.run(
                                SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS')
                                    .columns(secondMonthColumn, 'BILLEDHOURS')
                                    .where({ PROJECTID: projectid })
                            );
                            const projectHoursData1 = await cds.run(
                                SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS')
                                    .columns(Object.values(firstMonthColumnMap))
                                    .where({ PROJECTID: projectid })
                            );

                            // Add the hours for the first and second months
                            const firstMonthHours = projectDetailsFirstMonth[firstMonthColumn] || 0;
                            const secondMonthHours = projectDetailsSecondMonth[secondMonthColumn] || 0;
                            const newFirstMonthHours = firstMonthHours - projectHourMap[projectid].firstMonthHours;
                            const newSecondMonthHours = secondMonthHours - projectHourMap[projectid].secondMonthHours;

                            // Update both months in the database
                            await cds.run(
                                UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
                                    .set({
                                        [firstMonthColumn]: newFirstMonthHours,
                                        [secondMonthColumn]: newSecondMonthHours,
                                        BILLEDHOURS: projectDetailsFirstMonth.BILLEDHOURS - [projectHourMap[projectid].firstMonthHours + projectHourMap[projectid].secondMonthHours]
                                    })
                                    .where({ PROJECTID: projectid })
                            );
                            const projectDetailsdata = await cds.run(
                                SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS').where({ PROJECTID: projectid })
                            );

                            const newRemainingHours = totalHours - projectDetailsdata.BILLEDHOURS;

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
                                    .where({ PROJECTID: projectid })
                            );
                            let cumulativeHours = 0;
                            const projectHoursData = await cds.run(
                                SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS')
                                    .columns(Object.values(firstMonthColumnMap))
                                    .where({ PROJECTID: projectid })
                            );
                            for (let i = startMonthIndex; i <= endMonthIndex; i++) {
                                const currentMonth = months[i];
                                const currentMonthHoursColumn = firstMonthColumnMap[currentMonth];
                                const currentRemainingMonthColumn = monthColumnMapRemaining[currentMonth];

                                // Retrieve hours submitted for the current month, defaulting to 0 if undefined
                                const currentMonthHours = projectHoursData[currentMonthHoursColumn] || 0;

                                // Calculate remaining hours for the current month based on cumulative hours
                                const remainingHours = totalHours - (cumulativeHours + currentMonthHours);

                                // Update the remaining hours for the current month in the database
                                await cds.run(
                                    UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
                                        .set({ [currentRemainingMonthColumn]: remainingHours })
                                        .where({ PROJECTID: projectid })
                                );

                                // Accumulate hours up to this month for future calculations
                                cumulativeHours += currentMonthHours;
                            }
                        }
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
                    }
                    else {
                        return {
                            status: 'Error',
                            message: 'No timesheet data found for the provided period and employee name'
                        };
                    }
                }
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
            const Monthdata = JSON.parse(req.data.Monthdata);
            const Monthdatahours = JSON.parse(req.data.projecthourdata)
            const period = req.data.period;
            const empname = headerData.EMPLOYEENAME;

            // Check if the timesheet for this period and employee already exists
            const existingHeader = await cds.run(
                SELECT.one.from('TIMESHEETTABLE_TIMESHEETHEADER').where({ PERIOD: period, EMPLOYEENAME: empname })
            );
            if (existingHeader && existingHeader.STATUS === "Saved") {
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
                        const totalHours = projectDetails.TOTALHOURS;

                        // Calculate remaining hours
                        const remainingHours = availableHours - totalWorkedHours;

                        // const RemainingHoursmonth=remainingHours-totalWorkedHours;
                        // --------------------------------------------------------------------------------------------------------
                        // Project start and end months
                        if (Monthdata.startmonth === Monthdata.endmonth) {
                            const startmonthName = new Date(projectDetails.STARTDATE);  // e.g., 'March'
                            const endmonthName = new Date(projectDetails.ENDDATE);      // e.g., 'October'
                            const projectStartMonth = startmonthName.toLocaleString('default', { month: 'long' });
                            const projectEndMonth = endmonthName.toLocaleString('default', { month: 'long' });
                            // const totalHours = projectData[0].TOTALHOURS;    // Total project hours

                            // Column maps for hours and remaining hours
                            const monthColumnMap = {
                                'January': 'JANUARYHOURS',
                                'February': 'FEBRUARYHOURS',
                                'March': 'MARCHHOURS',
                                'April': 'APRILHOURS',
                                'May': 'MAYHOURS',
                                'June': 'JUNEHOURS',
                                'July': 'JULYHOURS',
                                'August': 'AUGUSTHOURS',
                                'September': 'SEPTEMBERHOURS',
                                'October': 'OCTOBERHOURS',
                                'November': 'NOVEMBERHOURS',
                                'December': 'DECEMBERHOURS'
                            };
                            const monthColumnMapRemaining = {
                                'January': 'JANUARYHOURSREMAINING',
                                'February': 'FEBRUARYHOURSREMAINING',
                                'March': 'MARCHHOURSREMAINING',
                                'April': 'APRILHOURSREMAINING',
                                'May': 'MAYHOURSREMAINING',
                                'June': 'JUNEHOURSREMAINING',
                                'July': 'JULYHOURSREMAINING',
                                'August': 'AUGUSTHOURSREMAINING',
                                'September': 'SEPTEMBERHOURSREMAINING',
                                'October': 'OCTOBERHOURSREMAINING',
                                'November': 'NOVEMBERHOURSREMAINING',
                                'December': 'DECEMBERHOURSREMAINING'
                            };

                            // Month indexes
                            const months = Object.keys(monthColumnMap);
                            const startMonthIndex = months.indexOf(projectStartMonth);
                            const endMonthIndex = months.indexOf(projectEndMonth);

                            // Retrieve project hours data for cumulative calculation
                            const Billedhoursdata = await cds.run(
                                SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS')
                                    .columns('BILLEDHOURS')
                                    .where({ PROJECTID: projectid })
                            );
                            const projectHoursData1 = await cds.run(
                                SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS')
                                    .columns(Object.values(monthColumnMap))
                                    .where({ PROJECTID: projectid })
                            );
                            // Update the specific month’s worked hours and billed hours as usual
                            const currentMonthHoursColumn = monthColumnMap[Monthdata.startmonth];  // e.g., 'MARCHHOURS' if submitted for March
                            const currentMonthHours = (projectHoursData1[currentMonthHoursColumn] || 0) + totalWorkedHours;
                            const newBilledHours = (Billedhoursdata.BILLEDHOURS || 0) + totalWorkedHours;

                            // Update project details with the new values for worked hours and billed hours
                            await cds.run(
                                UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
                                    .set({
                                        [currentMonthHoursColumn]: currentMonthHours,
                                        BILLEDHOURS: newBilledHours
                                    })
                                    .where({ PROJECTID: projectid })
                            );

                            // Initialize cumulative sum of hours
                            let cumulativeHours = 0;
                            const projectHoursData = await cds.run(
                                SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS')
                                    .columns(Object.values(monthColumnMap))
                                    .where({ PROJECTID: projectid })
                            );
                            // Loop through each month within the project start and end dates
                            for (let i = startMonthIndex; i <= endMonthIndex; i++) {
                                const currentMonth = months[i];
                                const currentMonthHoursColumn = monthColumnMap[currentMonth];
                                const currentRemainingMonthColumn = monthColumnMapRemaining[currentMonth];

                                // Retrieve hours submitted for the current month, defaulting to 0 if undefined
                                const currentMonthHours = projectHoursData[currentMonthHoursColumn] || 0;

                                // Calculate remaining hours for the current month based on cumulative hours
                                const remainingHours = totalHours - (cumulativeHours + currentMonthHours);

                                // Update the remaining hours for the current month in the database
                                await cds.run(
                                    UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
                                        .set({ [currentRemainingMonthColumn]: remainingHours })
                                        .where({ PROJECTID: projectid })
                                );

                                // Accumulate hours up to this month for future calculations
                                cumulativeHours += currentMonthHours;
                            }
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

                        // ------------------------------------------------------------------------------------------------------
                        // if (Monthdata.startmonth === Monthdata.endmonth) {
                        //     const monthColumnMap = {
                        //         'January': 'JANUARYHOURS',
                        //         'February': 'FEBRUARYHOURS',
                        //         'March': 'MARCHHOURS',
                        //         'April': 'APRILHOURS',
                        //         'May': 'MAYHOURS',
                        //         'June': 'JUNEHOURS',
                        //         'July': 'JULYHOURS',
                        //         'August': 'AUGUSTHOURS',
                        //         'September': 'SEPTEMBERHOURS',
                        //         'October': 'OCTOBERHOURS',
                        //         'November': 'NOVEMBERHOURS',
                        //         'December': 'DECEMBERHOURS'
                        //     };
                        //     const monthColumnMapremaning = {
                        //         'January': 'JANUARYHOURSREMAINING',
                        //         'February': 'FEBRUARYHOURSREMAINING',
                        //         'March': 'MARCHHOURSREMAINING',
                        //         'April': 'APRILHOURSREMAINING',
                        //         'May': 'MAYHOURSREMAINING',
                        //         'June': 'JUNEHOURSREMAINING',
                        //         'July': 'JULYHOURSREMAINING',
                        //         'August': 'AUGUSTHOURSREMAINING',
                        //         'September': 'SEPTEMBERHOURSREMAINING',
                        //         'October': 'OCTOBERHOURSREMAINING',
                        //         'November': 'NOVEMBERHOURSREMAINING',
                        //         'December': 'DECEMBERHOURSREMAINING'
                        //     }
                        //     const startMonth = Monthdata.startmonth;
                        //     // Get the appropriate column name based on the startMonth
                        //     const hoursColumn = monthColumnMap[startMonth];
                        //     const Remainingmonthcolumn = monthColumnMapremaning[startMonth]

                        //     if (hoursColumn) {
                        //         // Retrieve the current hours and BILLEDHOURS for the project
                        //         const currentProjectDetails = await cds.run(
                        //             SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS')
                        //                 .columns(hoursColumn, Remainingmonthcolumn, 'BILLEDHOURS',)
                        //                 .where({ PROJECTID: projectid })
                        //         );

                        //         // If no existing project details, default to 0
                        //         const currentMonthHours = currentProjectDetails[hoursColumn] || 0;
                        //         const currentBilledHours = currentProjectDetails.BILLEDHOURS || 0;
                        //         // const currentRemainingMonthhours=currentProjectDetails[Remainingmonthcolumn] ||0;

                        //         // Add new worked hours to the existing values
                        //         const newMonthHours = currentMonthHours + totalWorkedHours;
                        //         const newBilledHours = currentBilledHours + totalWorkedHours;
                        //         // const newcurrentRemainingMonthhours=currentRemainingMonthhours+RemainingHoursmonth;

                        //         // Update the project details with the new values
                        //         await cds.run(
                        //             UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
                        //                 .set({
                        //                     [hoursColumn]: newMonthHours,
                        //                     [Remainingmonthcolumn]: remainingHours,
                        //                     BILLEDHOURS: newBilledHours
                        //                 })
                        //                 .where({ PROJECTID: projectid })
                        //         );
                        //     }
                        // }
                        else {
                            // Logic for when the start month and end month are different
                            const firstMonth = Monthdata.startmonth;
                            const secondMonth = Monthdata.endmonth;
                            const startmonthName = new Date(projectDetails.STARTDATE);  // e.g., 'March'
                            const endmonthName = new Date(projectDetails.ENDDATE);      // e.g., 'October'
                            const projectStartMonth = startmonthName.toLocaleString('default', { month: 'long' });
                            const projectEndMonth = endmonthName.toLocaleString('default', { month: 'long' });

                            // Define month maps for the first and second month columns
                            const firstMonthColumnMap = {
                                'January': 'JANUARYHOURS',
                                'February': 'FEBRUARYHOURS',
                                'March': 'MARCHHOURS',
                                'April': 'APRILHOURS',
                                'May': 'MAYHOURS',
                                'June': 'JUNEHOURS',
                                'July': 'JULYHOURS',
                                'August': 'AUGUSTHOURS',
                                'September': 'SEPTEMBERHOURS',
                                'October': 'OCTOBERHOURS',
                                'November': 'NOVEMBERHOURS',
                                'December': 'DECEMBERHOURS'
                            };
                            const monthColumnMapRemaining = {
                                'January': 'JANUARYHOURSREMAINING',
                                'February': 'FEBRUARYHOURSREMAINING',
                                'March': 'MARCHHOURSREMAINING',
                                'April': 'APRILHOURSREMAINING',
                                'May': 'MAYHOURSREMAINING',
                                'June': 'JUNEHOURSREMAINING',
                                'July': 'JULYHOURSREMAINING',
                                'August': 'AUGUSTHOURSREMAINING',
                                'September': 'SEPTEMBERHOURSREMAINING',
                                'October': 'OCTOBERHOURSREMAINING',
                                'November': 'NOVEMBERHOURSREMAINING',
                                'December': 'DECEMBERHOURSREMAINING'

                            };

                            // Month indexes
                            const months = Object.keys(firstMonthColumnMap);
                            const startMonthIndex = months.indexOf(projectStartMonth);
                            const endMonthIndex = months.indexOf(projectEndMonth);


                            // Get the corresponding columns for the first and second month
                            const firstMonthColumn = firstMonthColumnMap[firstMonth];
                            const secondMonthColumn = firstMonthColumnMap[secondMonth];

                            // Fetch project details for both months
                            const projectDetailsFirstMonth = await cds.run(
                                SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS')
                                    .columns(firstMonthColumn, 'BILLEDHOURS')
                                    .where({ PROJECTID: projectid })
                            );
                            const projectDetailsSecondMonth = await cds.run(
                                SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS')
                                    .columns(secondMonthColumn, 'BILLEDHOURS')
                                    .where({ PROJECTID: projectid })
                            );
                            const projectHoursData1 = await cds.run(
                                SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS')
                                    .columns(Object.values(firstMonthColumnMap))
                                    .where({ PROJECTID: projectid })
                            );

                            // Add the hours for the first and second months
                            const firstMonthHours = projectDetailsFirstMonth[firstMonthColumn] || 0;
                            const secondMonthHours = projectDetailsSecondMonth[secondMonthColumn] || 0;
                            const newFirstMonthHours = firstMonthHours + Monthdatahours[projectid].firstMonthHours;
                            const newSecondMonthHours = secondMonthHours + Monthdatahours[projectid].secondMonthHours;

                            // Update both months in the database
                            await cds.run(
                                UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
                                    .set({
                                        [firstMonthColumn]: newFirstMonthHours,
                                        [secondMonthColumn]: newSecondMonthHours,
                                        BILLEDHOURS: projectDetailsFirstMonth.BILLEDHOURS + Monthdatahours[projectid].firstMonthHours + Monthdatahours[projectid].secondMonthHours
                                    })
                                    .where({ PROJECTID: projectid })
                            );
                            // await cds.run(
                            //     UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
                            //         .set({
                            //             [secondMonthColumn]: newSecondMonthHours,
                            //             BILLEDHOURS: projectDetailsSecondMonth.BILLEDHOURS + Monthdatahours[projectid].secondMonthHours
                            //         })
                            //         .where({ PROJECTID: projectid })
                            // );
                            let cumulativeHours = 0;
                            const projectHoursData = await cds.run(
                                SELECT.one.from('TIMESHEETTABLE_PROJECTDETAILS')
                                    .columns(Object.values(firstMonthColumnMap))
                                    .where({ PROJECTID: projectid })
                            );
                            for (let i = startMonthIndex; i <= endMonthIndex; i++) {
                                const currentMonth = months[i];
                                const currentMonthHoursColumn = firstMonthColumnMap[currentMonth];
                                const currentRemainingMonthColumn = monthColumnMapRemaining[currentMonth];

                                // Retrieve hours submitted for the current month, defaulting to 0 if undefined
                                const currentMonthHours = projectHoursData[currentMonthHoursColumn] || 0;

                                // Calculate remaining hours for the current month based on cumulative hours
                                const remainingHours = totalHours - (cumulativeHours + currentMonthHours);

                                // Update the remaining hours for the current month in the database
                                await cds.run(
                                    UPDATE('TIMESHEETTABLE_PROJECTDETAILS')
                                        .set({ [currentRemainingMonthColumn]: remainingHours })
                                        .where({ PROJECTID: projectid })
                                );

                                // Accumulate hours up to this month for future calculations
                                cumulativeHours += currentMonthHours;
                            }
                        }

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
