using TimeSheettable from '../db/Table';

service CatalogService {
    entity EmployeeDetails         as projection on TimeSheettable.EmployeeDetails;
    entity TimeSheetHeader         as projection on TimeSheettable.TimeSheetHeader;
    entity TimeSheetItem           as projection on TimeSheettable.TimeSheetItem;
    entity ProjectDetails          as projection on TimeSheettable.ProjectDetails;
    entity EmployeeProjectRelation as projection on TimeSheettable.EmployeeProjectRelation;
    entity ProjectKY               as projection on TimeSheettable.ProjectKY;
    entity ProjectKo               as projection on TimeSheettable.ProjectKo;
    entity Hoilday                 as projection on TimeSheettable.Hoilday;
    function checkCredentials(email : String, password : String)                                                                     returns EmployeeDetails;
    function TimeSheetdata(empid : String)                                                                                           returns String;
    function Detailsofproject()                                                                                                      returns String;
    function TimeSheetSubmit(headerData : String, itemsData : String, Monthdata : String, projecthourdata : String, period : String) returns String;
    function RetriveTimeSheetdata(EmployeeName : String, period : String, Status : String)                                           returns String;
    function AvailableHours(ProjectID : String)                                                                                      returns String;
    function HolidayCheck(dates : String)                                                                                            returns String;
    function TimeSheetApproved(data : String)                                                                                        returns String;
    function TimeSheetDelete(deleteddata : String)                                                                                   returns String;
    function CreateNewEmployeeDeatils(NewEmployeeData : String)                                                                      returns String;
    function retriveemployeedetails(employeeid : String)                                                                             returns String;
    function UpdateEmployeeDeatils(updateemployeedata : String)                                                                      returns String;
    function CreateNewProject(Newprojectdetailsdata : String)                                                                        returns String;
    function Authorizechecking(email : String, password : String)                                                                    returns String;
    function projectdetails(projectid : String)                                                                                      returns String;
}
