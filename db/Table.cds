// context TimeSheettable {
namespace TimeSheettable;

entity EmployeeDetails {
    key EmployeeID     : UUID;
        FirstName      : String;
        LastName       : String;
        Designation    : String;
        Password       : String;
        EmailID        : String;
        StartDate      : Date;
        EndDate        : Date;
        EmployeeStatus : String;
        EmployeeType   : String;
        ManagerFlag    : String;
        Timesheets     : Composition of many TimeSheetHeader
                             on Timesheets.EmployeeID = $self;
}

entity TimeSheetHeader {
        TimeSheetID  : UUID;
    key period       : String;
    key EmployeeName : String;
        Status       : String;
        Date         : Date;
        EmployeeID   : Association to EmployeeDetails; // Association back to EmployeeDetails

}

entity TimeSheetItem {
    key AUTO_INCREMENT_ID : Integer  ;
        ProjectID         : Association to ProjectDetails;
        ProjectName       : String;
        ProjectType       : String;
        Phase             : String;
        Deliverable       : String;
        WorkingHours      : Int16;
        Sunday            : Int16;
        Monday            : Int16;
        Tuesday           : Int16;
        Wednesday         : Int16;
        Thursday          : Int16;
        Friday            : Int16;
        Saturday          : Int16;
        period            : String;
        EmployeeName      : String;
        TimeSheetID       : String;
        AvailableHours:Integer;
}


// entity EmployeeDetails {
//     key EmployeeID:UUID;
//     FirstName:String;
//     LastName:String;
//     Designation:String;
//     Password:String;
//     EmailID:String;
//     StartDate:Date;
//     EndDate:Date;
//     EmployeeStatus:String;
//     EmployeeType:String;
//     ManagerFalg:String;
//     empid:Composition of many TimeSheet on empid.EmployeeID=$self;
// }
// entity TimeSheet{
//     key TimeSheet:UUID;
//     period:DateTime;
//     EmployeeName:String;
//     ProjectID:Association to ProjectDetails;
//     ProjectName:String;
//     ProjectType:String;
//     Phase:String;
//     Deliverable:String;
//     WorkingHours:Int16;
//     Status:String;
//     Date:Date;
//     EmployeeID:Association to EmployeeDetails;
//     //  association to ProjectDetails on ProjectID = ProjectDetails.ProjectID;
// }
entity ProjectDetails {
    key ProjectID      : UUID;
        KY             : Int64;
        ProjectName    : String;
        Department     : String;
        StartDate      : DateTime;
        EndDate        : DateTime;
        TotalHours     : Int16;
        RemainingHours : Int16;
        Status         : String;
        projid         : Composition of many TimeSheetItem
                             on projid.ProjectID = $self;
}

entity EmployeeProjectRelation {
    key ProjectID  : Association to ProjectDetails;
        EmployeeID : Association to EmployeeDetails;
        StartDate  : Association to ProjectDetails;
        EndDate    : DateTime;
}

// entity ProjectKY {
//     key KY        : Association to ProjectDetails;
//         StartDate : Association to ProjectDetails;
//         EndDate   : Association to ProjectDetails;
// }

// entity ProjectKo {
//     key ProjectID      : Association to ProjectDetails;
//         StartDate      : Association to ProjectDetails;
//         EndDate        : Association to ProjectDetails;
//         TotalHours     : Association to ProjectDetails;
//         RemainingHours : Association to ProjectDetails;
//         BilledHours    : Int16;
// }

entity ProjectKY {
    key KY        : Int64;
        StartDate : DateTime;
        EndDate   : DateTime;
}

entity ProjectKo {
    key ProjectID      : UUID; 
        StartDate      : DateTime;
        EndDate        : DateTime;
        TotalHours     : Int16;
        RemainingHours : Int16;
        BilledHours    : Int16;
}

entity Hoilday {
    key HoildayID   : Int16;
        HoildayName : String;
        Date        : DateTime;
}

// }
