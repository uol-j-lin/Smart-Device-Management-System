const res = require("express/lib/response");
const { off } = require("process");

module.exports = function (app) {

    /*

    A route to serve up the 'Home' HTML page.

    Purpose:
    To provide an entry point to the website.

    Input:
    A URL from the client's browser which requests a resource from the server. This does not contain a payload.

    Output:
    An HTML page that provides an interface for users to navigate to other pages within the site structure.

    */

    app.get("/", function (req, res) {
        res.render("index.html");
    });

    /*

    A route to serve up the 'About' HTML page.

    Purpose:
    To provide an overview of the device management system and information about the creator.

    Input:
    A URL from the client's browser which requests a resource from the server. This does not contain a payload.

    Output:
    An HTML page that discusses the website's functionalities and information about the developer.

    */

    app.get("/about", function (req, res) {
        res.render("about.html");
    });

    /*

    A route to serve up the 'Add a Device' HTML page.

    Purpose:
    To enable the user to add a device to be managed.

    Input:
    A URL from the client's browser which requests a resource from the server. This does not contain a payload.

    Output:
    An HTML page generated using an EJS template that provides a list of pre-defined devices with applicable parameters to be submitted for storage via a form.

    */

    app.get("/addadevice", function (req, res) {
        res.render("addadevice");
    });

    /*

    A route that handles the device insertion logic.

    Purpose:
    To create a record in the database with the fields provided.

    Input:
    User-inputted device field data enclosed in the request message body. Device contains a subset of values corresponding to the device's applicable parameters (i.e. its custom name, type, on/off status, temperature, volume, battery inclusion/exclusion status, open/closed status). This is configured via a form's POST request.

    Output:
    The output is an HTML page generated from an EJS template which contains a message indicating the result of the insertion operation.
    A failed request re-displays the 'Add a Device' input form with a corresponding error message.

    */

    app.post("/add-result", function (req, res) {

        // Convert empty fields into NULL fields to ensure a valid database query

        // Sanitize user input fields by removing special characters

        // Database contains NOT NULL constraints built in for the 'Device Type' and 'Custom Name' fields

        req.body.device_type = req.body.device_type.replace(/[^a-zA-Z0-9 ]/g, '');

        req.body.custom_name = req.body.custom_name.replace(/[^a-zA-Z0-9 ]/g, '');

        if (req.body.on_off === "") {
            req.body.on_off = null;
        }
        else {
            req.body.on_off = req.body.on_off.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.temperature === "") {
            req.body.temperature = null;
        }
        else {
            req.body.temperature = req.body.temperature.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.volume === "") {
            req.body.volume = null;
        }
        else {
            req.body.volume = req.body.volume.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.batteries_included === "") {
            req.body.batteries_included = null;
        }
        else {
            req.body.batteries_included = req.body.batteries_included.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.open_closed === "") {
            req.body.open_closed = null;
        }
        else {
            req.body.open_closed = req.body.open_closed.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        // Ensure the device custom name conforms to a schema and has a fixed set of length values

        let validCustomNameRegex;

        validCustomNameRegex = /^[a-zA-Z0-9_]+([a-zA-Z0-9_]+)*$/.test(req.body.custom_name);

        // Custom name does not conform to schema

        if (!validCustomNameRegex || req.body.custom_name.length < 5 || req.body.custom_name.length > 16) {
            return res.status(400).json({ error: "Custom name does not fit schema or required length" });
        }

        // Ensure that data matches expected types, ranges, and values

        let isValid = true;

        if (req.body.device_type != null && !(typeof req.body.device_type === 'string' || req.body.device_type instanceof String)) {
            isValid = false;
        }

        if (req.body.on_off != null && !(typeof req.body.on_off === 'string' || req.body.on_off instanceof String) && (!isNaN(req.body.on_off) && parseInt(req.body.on_off) == 0 || parseInt(req.body.on_off) == 1)) {
            isValid = false;
        }

        if (req.body.batteries_included != null && !(typeof req.body.batteries_included === 'string' || req.body.batteries_included instanceof String) && (!isNaN(req.body.batteries_included) && parseInt(req.body.batteries_included) == 0 || parseInt(req.body.batteries_included) == 1)) {
            isValid = false;
        }

        if (req.body.open_closed != null && !(typeof req.body.open_closed === 'string' || req.body.open_closed instanceof String) && (!isNaN(req.body.open_closed) && parseInt(req.body.open_closed) == 0 || parseInt(req.body.open_closed) == 1)) {
            isValid = false;
        }

        if (req.body.volume != null && !(typeof req.body.volume === 'string' || req.body.volume instanceof String) && (!isNaN(req.body.volume) && parseInt(req.body.volume) >= 0 && parseInt(req.body.volume) <= 100)) {
            isValid = false;
        }

        if (req.body.temperature != null && !(typeof req.body.temperature === 'string' || req.body.temperature instanceof String) && (!isNaN(req.body.temperature) && parseInt(req.body.temperature) >= 1 && parseInt(req.body.temperature) <= 220)) {
            isValid = false;
        }

        if (!isValid) {
            return res.status(400).json({ error: "The data fields are invalid or the custom name does not fit the required schema." });
        }

        /*

        Database interaction:

        Purpose:
        To insert a device record based on a variable number of input parameters (some of which may be NULL).

        Input:
        User-inputted fields that are applicable to the device type selected.

        Output:
        Insertion of the device record into the database. Given a successful insertion operation, the number of rows stored is returned.

        */

        let sqlQueryInsert = "INSERT INTO devicetypes (Device_Type, On_Off, Temperature, Volume, Batteries_Included, Open_Closed) VALUES (?,?,?,?,?,?)";

        let insertionRecord = [req.body.device_type, req.body.on_off, req.body.temperature, req.body.volume, req.body.batteries_included, req.body.open_closed];

        db.query(sqlQueryInsert, insertionRecord, (err, result) => {

            // Database query unsuccessful, redisplay the device insertion form

            if (err) {
                res.redirect("/addadevice");
            }
        });

        /*

        Database interaction:

        Purpose:
        To determine the AUTO_INCREMENT ID of the last row that has been inserted or updated in a table.

        Input:
        A MySQL function that takes an optional expression.

        Output:
        AUTO_INCREMENT ID of most recent record to be inserted or updated in a table.

        */

        let sqlQueryRecentInsertID = "SELECT LAST_INSERT_ID()";

        db.query(sqlQueryRecentInsertID, (err, result) => {

            // Database query unsuccessful, redisplay the device insertion form

            if (err) {
                res.redirect("/addadevice");
            }

            /*

            Database interaction:

            Purpose:
            To insert a custom name into the 'Device Names' table that corresponds to the fields of a record in the 'Device Types' table.

            Input:
            A custom name and AUTO_INCREMENT ID of the corresponding record in the 'Device Types' table.

            Output:
            Insertion of the custom name into the 'Device Names' table. Given a successful insertion operation, the number of rows stored is returned.

            */

            let sqlQueryInsertCustomName = "INSERT INTO devicenames (Custom_Name, Device_Type_ID) VALUES (?,?)";

            let customNameRecord = [req.body.custom_name, result[0]['LAST_INSERT_ID()']];

            db.query(sqlQueryInsertCustomName, customNameRecord, (err, result) => {

                // Database query unsuccessful, redisplay the device insertion form

                if (err) {
                    res.redirect("/addadevice");
                }
            });
        });
    });

    /*

    A route that displays a user-friendly device dashboard GUI.

    Purpose:
    To display the user devices in the database with a GUI. Each device can be individually selected by the user to view its status, control its fields, or to be deleted.

    Input:
    A URL from the client's browser which sends the device's ID to the web server. This does not contain a payload.

    Output:
    An HTML page constructed from an EJS template which contains the active devices in the database with options to view, control, and delete on a per device basis.

    */

    app.get("/dashboard", function (req, res) {

        /*

        Database interaction:

        Purpose:
        To retrieve all device records from the 'Device Names' and 'Device Types' database tables.

        Input:
        A JOIN clause is used to combine rows from the two tables, based on a related column: the Device Type ID, provided as user input to the SQL statement.

        Output:
        The SQL SELECT statement returns a set containing all records from the 'Device Names' and 'Device Types' database tables.

        */

        let sqlQueryAll = 'SELECT * FROM devicenames LEFT JOIN devicetypes ON devicenames.Device_Type_ID = devicetypes.Device_Type_ID';

        db.query(sqlQueryAll, (err, result) => {

            // Database query unsuccessful, redirect to the home page

            if (err) {
                res.redirect("index.html");
            }
            else {
                res.render("dashboard.ejs", { deviceList: result });
            }
        })
    });

    /*

    A route that requests user confirmation for deleting a selected device.

    Purpose:
    To request user confirmation for a deletion operation.

    Input:
    User-inputted device field data enclosed in the request message body. Device contains a subset of values corresponding to the device's applicable parameters (i.e. its custom name, type, on/off status, temperature, volume, battery inclusion/exclusion status, open/closed status). This is configured via a form's POST request.

    Output:
    An HTML page generated using an EJS template that provides the option to confirm or cancel the deletion operation with a modal window.

    */

    app.post("/confirm-delete", function (req, res) {

        let inputFields = req.body.device_type_ID;

        // Parse input into device fields for validation and sanitization

        if (inputFields.includes(",")) {
            const inputDeviceFields = inputFields.split(",");
            req.body.device_type_ID = inputDeviceFields[0];
            req.body.custom_name = inputDeviceFields[1];
            req.body.device_type = inputDeviceFields[2];
            req.body.on_off = inputDeviceFields[3];
            req.body.batteries_included = inputDeviceFields[4];
            req.body.open_closed = inputDeviceFields[5];
            req.body.volume = inputDeviceFields[6];
            req.body.temperature = inputDeviceFields[7];
        }

        if (req.body.device_type_ID === undefined) {
            res.redirect("index.html");
            return;
        }

        // Convert empty fields into NULL fields to ensure a valid database query

        // Sanitize user input fields by removing special characters

        // Database contains NOT NULL constraints built in for the 'Device Type' and 'Custom Name' fields

        req.body.device_type = req.body.device_type.replace(/[^a-zA-Z0-9 ]/g, '');

        req.body.custom_name = req.body.custom_name.replace(/[^a-zA-Z0-9 ]/g, '');

        if (req.body.on_off === "") {
            req.body.on_off = null;
        }
        else {
            req.body.on_off = req.body.on_off.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.temperature === "") {
            req.body.temperature = null;
        }
        else {
            req.body.temperature = req.body.temperature.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.volume === "") {
            req.body.volume = null;
        }
        else {
            req.body.volume = req.body.volume.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.batteries_included === "") {
            req.body.batteries_included = null;
        }
        else {
            req.body.batteries_included = req.body.batteries_included.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.open_closed === "") {
            req.body.open_closed = null;
        }
        else {
            req.body.open_closed = req.body.open_closed.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        // Ensure the device custom name conforms to a schema and has a fixed set of length values

        let validCustomNameRegex;

        validCustomNameRegex = /^[a-zA-Z0-9_]+([a-zA-Z0-9_]+)*$/.test(req.body.custom_name);

        // Custom name does not conform to schema

        if (!validCustomNameRegex || req.body.custom_name.length < 5 || req.body.custom_name.length > 16) {
            return res.status(400).json({ error: "Custom name does not fit schema or required length" });
        }

        // Ensure that data matches expected types, ranges, and values

        let isValid = true;

        if (req.body.device_type != null && !(typeof req.body.device_type === 'string' || req.body.device_type instanceof String)) {
            isValid = false;
        }

        if (req.body.on_off != null && !(typeof req.body.on_off === 'string' || req.body.on_off instanceof String) && (!isNaN(req.body.on_off) && parseInt(req.body.on_off) == 0 || parseInt(req.body.on_off) == 1)) {
            isValid = false;
        }

        if (req.body.batteries_included != null && !(typeof req.body.batteries_included === 'string' || req.body.batteries_included instanceof String) && (!isNaN(req.body.batteries_included) && parseInt(req.body.batteries_included) == 0 || parseInt(req.body.batteries_included) == 1)) {
            isValid = false;
        }

        if (req.body.open_closed != null && !(typeof req.body.open_closed === 'string' || req.body.open_closed instanceof String) && (!isNaN(req.body.open_closed) && parseInt(req.body.open_closed) == 0 || parseInt(req.body.open_closed) == 1)) {
            isValid = false;
        }

        if (req.body.volume != null && !(typeof req.body.volume === 'string' || req.body.volume instanceof String) && (!isNaN(req.body.volume) && parseInt(req.body.volume) >= 0 && parseInt(req.body.volume) <= 100)) {
            isValid = false;
        }

        if (req.body.temperature != null && !(typeof req.body.temperature === 'string' || req.body.temperature instanceof String) && (!isNaN(req.body.temperature) && parseInt(req.body.temperature) >= 1 && parseInt(req.body.temperature) <= 220)) {
            isValid = false;
        }

        if (!isValid) {
            return res.status(400).json({ error: "The data fields are invalid or the custom name does not fit the required schema." });
        }

        /*

        Database interaction:

        Purpose:
        To retrieve all device records from the 'Device Names' and 'Device Types' database tables.

        Input:
        A JOIN clause is used to combine rows from the two tables, based on a related column: the Device Type ID, provided as user input to the SQL statement.

        Output:
        The SQL SELECT statement returns a set containing all records from the 'Device Names' and 'Device Types' database tables.

        */

        let sqlQueryAll = "SELECT * FROM devicenames LEFT JOIN devicetypes ON devicenames.Device_Type_ID = devicetypes.Device_Type_ID";

        let selectAll;

        db.query(sqlQueryAll, (err, result) => {

            // Database query unsuccessful, redisplay the device insertion form

            if (err) {
                res.redirect("/addadevice");
            }
            else {
                selectAll = result;
            }
        });

        /*

        Database interaction:

        Purpose:
        To retrieve the fields associated with the currently selected device from the database.

        Input:
        The ID of the device to be deleted is inputted into the SQL statement.

        Output:
        Zero or one row record(s) is returned to the user depending on the existence of a device with the given ID.

        */

        let sqlQueryDeviceRecord = "SELECT * FROM devicetypes JOIN devicenames ON devicetypes.Device_Type_ID = devicenames.Device_Type_ID AND devicetypes.Device_Type_ID = ?";

        let recordDeviceDeletionID = [req.body.device_type_ID];

        db.query(sqlQueryDeviceRecord, recordDeviceDeletionID, (err, result) => {
            if (err) {
                res.redirect("index.html");
            }
            else {
                res.render("confirmdelete.ejs", {
                    deviceInfo: result,
                    deviceList: selectAll
                });
            }
        });
    });

    /*

    A route that performs the deletion operation and serves up an HTML page based on an EJS template that indicates a successful deletion operation.

    Purpose:
    To delete a given device stored in the database and provide user feedback on the operation status.

    Input:
    User-inputted device field data enclosed in the request message body. The device object contains a subset of values corresponding to the device's applicable parameters (i.e. its custom name, type, on/off status, temperature, volume, battery inclusion/exclusion status, open/closed status). This is configured via a form's POST request.

    Output:
    The MySQL delete operation deletes the record from the parent 'Device Types' table which automatically removes the matching records from the child, 'Device Names' table. This is done using an ON DELETE CASCADE option. Given a successful deletion, the count of deleted rows is returned.

    An HTML page generated from an EJS template which contains a message indicating the status of the delete operation. A failed request re-displays the 'Delete a Device' input form.

    */

    app.post("/delete-result", function (req, res) {

        let inputFields = req.body.device_type_ID;

        // Parse input into device fields for validation and sanitization

        if (inputFields.includes(",")) {
            const inputDeviceFields = inputFields.split(",");
            req.body.device_type_ID = inputDeviceFields[0];
            req.body.custom_name = inputDeviceFields[1];
            req.body.device_type = inputDeviceFields[2];
            req.body.on_off = inputDeviceFields[3];
            req.body.batteries_included = inputDeviceFields[4];
            req.body.open_closed = inputDeviceFields[5];
            req.body.volume = inputDeviceFields[6];
            req.body.temperature = inputDeviceFields[7];
        }

        if (req.body.device_type_ID === undefined) {
            res.redirect("index.html");
            return;
        }

        // Convert empty fields into NULL fields to ensure a valid database query

        // Sanitize user input fields by removing special characters

        // Database contains NOT NULL constraints built in for the 'Device Type' and 'Custom Name' fields

        req.body.device_type = req.body.device_type.replace(/[^a-zA-Z0-9 ]/g, '');

        req.body.custom_name = req.body.custom_name.replace(/[^a-zA-Z0-9 ]/g, '');

        if (req.body.on_off === "") {
            req.body.on_off = null;
        }
        else {
            req.body.on_off = req.body.on_off.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.temperature === "") {
            req.body.temperature = null;
        }
        else {
            req.body.temperature = req.body.temperature.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.volume === "") {
            req.body.volume = null;
        }
        else {
            req.body.volume = req.body.volume.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.batteries_included === "") {
            req.body.batteries_included = null;
        }
        else {
            req.body.batteries_included = req.body.batteries_included.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.open_closed === "") {
            req.body.open_closed = null;
        }
        else {
            req.body.open_closed = req.body.open_closed.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        // Ensure the device custom name conforms to a schema and has a fixed set of length values

        let validCustomNameRegex;

        validCustomNameRegex = /^[a-zA-Z0-9_]+([a-zA-Z0-9_]+)*$/.test(req.body.custom_name);

        // Custom name does not conform to schema

        if (!validCustomNameRegex || req.body.custom_name.length < 5 || req.body.custom_name.length > 16) {
            return res.status(400).json({ error: "Custom name does not fit schema or required length" });
        }

        // Ensure that data matches expected types, ranges, and values

        let isValid = true;

        if (req.body.device_type != null && !(typeof req.body.device_type === 'string' || req.body.device_type instanceof String)) {
            isValid = false;
        }

        if (req.body.on_off != null && !(typeof req.body.on_off === 'string' || req.body.on_off instanceof String) && (!isNaN(req.body.on_off) && parseInt(req.body.on_off) == 0 || parseInt(req.body.on_off) == 1)) {
            isValid = false;
        }

        if (req.body.batteries_included != null && !(typeof req.body.batteries_included === 'string' || req.body.batteries_included instanceof String) && (!isNaN(req.body.batteries_included) && parseInt(req.body.batteries_included) == 0 || parseInt(req.body.batteries_included) == 1)) {
            isValid = false;
        }

        if (req.body.open_closed != null && !(typeof req.body.open_closed === 'string' || req.body.open_closed instanceof String) && (!isNaN(req.body.open_closed) && parseInt(req.body.open_closed) == 0 || parseInt(req.body.open_closed) == 1)) {
            isValid = false;
        }

        if (req.body.volume != null && !(typeof req.body.volume === 'string' || req.body.volume instanceof String) && (!isNaN(req.body.volume) && parseInt(req.body.volume) >= 0 && parseInt(req.body.volume) <= 100)) {
            isValid = false;
        }

        if (req.body.temperature != null && !(typeof req.body.temperature === 'string' || req.body.temperature instanceof String) && (!isNaN(req.body.temperature) && parseInt(req.body.temperature) >= 1 && parseInt(req.body.temperature) <= 220)) {
            isValid = false;
        }

        if (!isValid) {
            return res.status(400).json({ error: "The data fields are invalid or the custom name does not fit the required schema." });
        }

        /*

        Database interaction:

        Purpose:
        To delete a device record from the 'Device Names' and 'Device Types' database tables. Deletion of the record from the parent 'Device Types' table automatically deletes the corresponding record in the 'Device Names' table using the ON DELETE CASCADE referential action for the foreign key of the child table.

        Input:
        The device type ID is provided to the SQL statement in the request payload.

        Output:
        The device is deleted from the database, given that its ID exists. A successful deletion returns a count of the number of records deleted.

        */

        let sqlQueryDelete = "DELETE FROM devicetypes WHERE Device_Type_ID = ?";

        let recordToDelete = [req.body.device_type_ID];

        db.query(sqlQueryDelete, recordToDelete, (err, result) => {
            // Database query unsuccessful, redirect to the home page

            if (err) {
                res.redirect("index.html");
            }
        });

        /*

        Database interaction:

        Purpose:
        To retrieve all device records from the 'Device Names' and 'Device Types' database tables.

        Input:
        A JOIN clause is used to combine rows from the two tables, based on a related column: the Device Type ID, provided as user input to the SQL statement.

        Output:
        The SQL SELECT statement returns a set containing all records from the 'Device Names' and 'Device Types' database tables.

        */

        let sqlQueryAll = "SELECT * FROM devicenames LEFT JOIN devicetypes ON devicenames.Device_Type_ID = devicetypes.Device_Type_ID";

        db.query(sqlQueryAll, (err, result) => {
            res.render("confirmdeleteresult.ejs", { deviceList: result });
        });
    });

    /*

    A route that queries the fields pertaining to a device from the database.

    Purpose:
    Extract a device record from the database based on its ID.

    Input:
    A URL from the client's browser which sends the device's ID to the server. This does not contain a payload.

    Output:
    An HTML page constructed from an EJS template which contains the status of each of the device's applicable fields.

    */

    app.get("/display-status", function (req, res) {

        /*

        Database interaction:

        Purpose:
        To retrieve all device records from the 'Device Names' and 'Device Types' database tables.

        Input:
        A JOIN clause is used to combine rows from the two tables, based on a related column: the Device Type ID, provided as user input to the SQL statement.

        Output:
        The SQL SELECT statement returns a set containing all records from the 'Device Names' and 'Device Types' database tables.

        */

        let sqlQueryAll = "SELECT * FROM devicenames LEFT JOIN devicetypes ON devicenames.Device_Type_ID = devicetypes.Device_Type_ID";

        let selectAll;

        db.query(sqlQueryAll, (err, result) => {
            selectAll = result;
        });

        /*

        Database interaction:

        Purpose:
        To retrieve a device record from the 'Device Names' and 'Device Types' database tables based on its ID.

        Input:
        A device's ID is provided as input to the SQL statement to be used by the JOIN clause.

        Output:
        The SQL SELECT statement returns a set containing zero or one record from the 'Device Names' and 'Device Types' database tables based on the existence of its ID.

        */

        let sqlQueryDevice = "SELECT * FROM devicetypes CROSS JOIN devicenames ON devicetypes.Device_Type_ID = devicenames.Device_Type_ID AND devicetypes.Device_Type_ID = ?";

        let deviceRecordID = [req.query.deviceTypeID];

        db.query(sqlQueryDevice, deviceRecordID, (err, result) => {
            if (err) {
                res.redirect("index.html");
            }
            else {

                // Determine which fields within the query result have non-null values

                let valid_on_off = (result[0].On_Off !== null);
                let valid_temperature = (result[0].Temperature !== null);
                let valid_volume = (result[0].Volume !== null);
                let valid_batteries_included = (result[0].Batteries_Included !== null);
                let valid_open_closed = (result[0].Open_Closed !== null);

                // Determine state of each field

                let deviceOnState = 0;
                if (valid_on_off) {
                    deviceOnState = (result[0].On_Off === 1);
                }

                let deviceOpenState = 0;
                if (valid_open_closed) {
                    deviceOpenState = (result[0].Open_Closed === 1);
                }

                let deviceBatteriesState = 0;
                if (valid_batteries_included) {
                    deviceBatteriesState = (result[0].Batteries_Included === 1);
                }

                // Render the HTML page and provide the device's non-null field information

                res.render("devicestatus.ejs", {
                    deviceStatus: result,
                    deviceList: selectAll,
                    validOnOff: valid_on_off,
                    validTemperature: valid_temperature,
                    validVolume: valid_volume,
                    validBatteriesIncluded: valid_batteries_included,
                    validOpenClosed: valid_open_closed,
                    deviceOn: deviceOnState,
                    deviceOpen: deviceOpenState,
                    deviceBatteries: deviceBatteriesState
                }
                );
            }
        });
    });

    /*

    A route that serves up an HTML page from an EJS template that enables users to view and update the fields of a selected device.

    Purpose:
    Retrieve the current status of fields pertaining to a selected device and enable valid field updates to occur.

    Input:
    User-inputted device field data enclosed in the request message body. The device object contains a subset of values corresponding to the device's applicable parameters (i.e. its custom name, type, on/off status, temperature, volume, battery inclusion/exclusion status, open/closed status). This is configured via a form's POST request.

    Output:
    The retrieval of a device record whose relevant fields can be modified by the user.

    */

    app.post("/retrieve-update-record", function (req, res) {

        let inputFields = req.body.device_type_ID;

        // Parse input into device fields for validation and sanitization

        if (inputFields.includes(",")) {
            const inputDeviceFields = inputFields.split(",");
            req.body.device_type_ID = inputDeviceFields[0];
            req.body.custom_name = inputDeviceFields[1];
            req.body.device_type = inputDeviceFields[2];
            req.body.on_off = inputDeviceFields[3];
            req.body.batteries_included = inputDeviceFields[4];
            req.body.open_closed = inputDeviceFields[5];
            req.body.volume = inputDeviceFields[6];
            req.body.temperature = inputDeviceFields[7];
        }

        if (req.body.device_type_ID === undefined) {
            res.redirect("index.html");
            return;
        }

        // Convert empty fields into NULL fields to ensure a valid database query

        // Sanitize user input fields by removing special characters

        // Database contains NOT NULL constraints built in for the 'Device Type' and 'Custom Name' fields

        req.body.device_type = req.body.device_type.replace(/[^a-zA-Z0-9 ]/g, '');

        req.body.custom_name = req.body.custom_name.replace(/[^a-zA-Z0-9 ]/g, '');

        if (req.body.on_off === "") {
            req.body.on_off = null;
        }
        else {
            req.body.on_off = req.body.on_off.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.temperature === "") {
            req.body.temperature = null;
        }
        else {
            req.body.temperature = req.body.temperature.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.volume === "") {
            req.body.volume = null;
        }
        else {
            req.body.volume = req.body.volume.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.batteries_included === "") {
            req.body.batteries_included = null;
        }
        else {
            req.body.batteries_included = req.body.batteries_included.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.open_closed === "") {
            req.body.open_closed = null;
        }
        else {
            req.body.open_closed = req.body.open_closed.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        // Ensure the device custom name conforms to a schema and has a fixed set of length values

        let validCustomNameRegex;

        validCustomNameRegex = /^[a-zA-Z0-9_]+([a-zA-Z0-9_]+)*$/.test(req.body.custom_name);

        // Custom name does not conform to schema

        if (!validCustomNameRegex || req.body.custom_name.length < 5 || req.body.custom_name.length > 16) {
            res.statusCode = 500;
            res.send('Custom name does not fit schema or required length');
        }

        // Ensure that data matches expected types, ranges, and values

        let isValid = true;

        if (req.body.device_type != null && !(typeof req.body.device_type === 'string' || req.body.device_type instanceof String)) {
            isValid = false;
        }

        if (req.body.on_off != null && !(typeof req.body.on_off === 'string' || req.body.on_off instanceof String) && (!isNaN(req.body.on_off) && parseInt(req.body.on_off) == 0 || parseInt(req.body.on_off) == 1)) {
            isValid = false;
        }

        if (req.body.batteries_included != null && !(typeof req.body.batteries_included === 'string' || req.body.batteries_included instanceof String) && (!isNaN(req.body.batteries_included) && parseInt(req.body.batteries_included) == 0 || parseInt(req.body.batteries_included) == 1)) {
            isValid = false;
        }

        if (req.body.open_closed != null && !(typeof req.body.open_closed === 'string' || req.body.open_closed instanceof String) && (!isNaN(req.body.open_closed) && parseInt(req.body.open_closed) == 0 || parseInt(req.body.open_closed) == 1)) {
            isValid = false;
        }

        if (req.body.volume != null && !(typeof req.body.volume === 'string' || req.body.volume instanceof String) && (!isNaN(req.body.volume) && parseInt(req.body.volume) >= 0 && parseInt(req.body.volume) <= 100)) {
            isValid = false;
        }

        if (req.body.temperature != null && !(typeof req.body.temperature === 'string' || req.body.temperature instanceof String) && (!isNaN(req.body.temperature) && parseInt(req.body.temperature) >= 1 && parseInt(req.body.temperature) <= 220)) {
            isValid = false;
        }

        if (!isValid) {
            return res.status(400).json({ error: "The data fields are invalid or the custom name does not fit the required schema." });
        }

        /*

        Database interaction:

        Purpose:
        To retrieve all device records from the 'Device Names' and 'Device Types' database tables.

        Input:
        A JOIN clause is used to combine rows from the two tables, based on a related column: the Device Type ID, provided as user input to the SQL statement.

        Output:
        The SQL SELECT statement returns a set containing all records from the 'Device Names' and 'Device Types' database tables.

        */

        let sqlQueryAll = "SELECT * FROM devicenames LEFT JOIN devicetypes ON devicenames.Device_Type_ID = devicetypes.Device_Type_ID";

        let selectAll;

        db.query(sqlQueryAll, (err, result) => {
            selectAll = result;
        });

        /*

        Database interaction:

        Purpose:
        To retrieve a device record from the database.

        Input:
        The device ID is provided as input to the SQL statement in the request payload.

        Output:
        The retrieval of all fields applicable to the device with a given ID, given that the ID exists in the database.

        */

        let sqlQueryDeviceRecord = "SELECT * FROM devicetypes CROSS JOIN devicenames ON devicetypes.Device_Type_ID = devicenames.Device_Type_ID AND devicetypes.Device_Type_ID = ?";

        let deviceRecordID = [req.body.device_type_ID];

        db.query(sqlQueryDeviceRecord, deviceRecordID, (err, result) => {
            if (err) {
                res.redirect("index.html");
            }
            else {

                // Determine which fields within the query result have non-null values

                let valid_on_off = (result[0].On_Off !== null);
                let valid_temperature = (result[0].Temperature !== null);
                let valid_volume = (result[0].Volume !== null);
                let valid_batteries_included = (result[0].Batteries_Included !== null);
                let valid_open_closed = (result[0].Open_Closed !== null);

                // Determine state of each field

                let deviceOnState = 0;
                if (valid_on_off) {
                    deviceOnState = (result[0].On_Off === 1);
                }

                let deviceOpenState = 0;
                if (valid_open_closed) {
                    deviceOpenState = (result[0].Open_Closed === 1);
                }

                let deviceBatteriesState = 0;
                if (valid_batteries_included) {
                    deviceBatteriesState = (result[0].Batteries_Included === 1);
                }

                res.render("performupdate.ejs", {
                    updateRecord: result,
                    deviceList: selectAll,
                    validOnOff: valid_on_off,
                    validTemperature: valid_temperature,
                    validVolume: valid_volume,
                    validBatteriesIncluded: valid_batteries_included,
                    validOpenClosed: valid_open_closed,
                    deviceOn: deviceOnState,
                    deviceOpen: deviceOpenState,
                    deviceBatteries: deviceBatteriesState
                });
            }
        })
    })

    /*

    A route that updates the fields of a device.

    Purpose:
    To update the device's record in the database, given that the field data is valid.

    Input:
    User-inputted device field data enclosed in the request message body. The device object contains a subset of values corresponding to the device's applicable parameters (i.e. its custom name, type, on/off status, temperature, volume, battery inclusion/exclusion status, open/closed status). This is configured via a form's POST request.

    Output:
    The update SQL statement returns the number of rows updated. The output is an HTML page generated from an EJS template which contains a message indicating the result of the update operation. A failed request re-displays the 'Update a Device' input form with a corresponding error message.

    */

    app.post("/update-result", function (req, res) {

        // Convert empty fields into NULL fields to ensure a valid database query

        // Sanitize user input fields by removing special characters

        // Database contains NOT NULL constraints built in for the 'Device Type' and 'Custom Name' fields

        req.body.device_type = req.body.device_type.replace(/[^a-zA-Z0-9 ]/g, '');

        req.body.custom_name = req.body.custom_name.replace(/[^a-zA-Z0-9 ]/g, '');

        if (req.body.on_off === undefined) {
            req.body.on_off = null;
        }
        else {
            req.body.on_off = req.body.on_off.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.temperature === undefined) {
            req.body.temperature = null;
        }
        else {
            req.body.temperature = req.body.temperature.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.volume === undefined) {
            req.body.volume = null;
        }
        else {
            req.body.volume = req.body.volume.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.batteries_included === undefined) {
            req.body.batteries_included = null;
        }
        else {
            req.body.batteries_included = req.body.batteries_included.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        if (req.body.open_closed === undefined) {
            req.body.open_closed = null;
        }
        else {
            req.body.open_closed = req.body.open_closed.replace(/[^a-zA-Z0-9 ]/g, '');
        }

        // Ensure the device custom name conforms to a schema and has a fixed set of length values

        let validCustomNameRegex;

        validCustomNameRegex = /^[a-zA-Z0-9_]+([a-zA-Z0-9_]+)*$/.test(req.body.custom_name);

        // Custom name does not conform to schema

        if (!validCustomNameRegex || req.body.custom_name.length < 5 || req.body.custom_name.length > 16) {
            res.statusCode = 500;
            res.send('Custom name does not fit schema or required length');
        }

        // Ensure that data matches expected types, ranges, and values

        let isValid = true;

        if (req.body.device_type != null && !(typeof req.body.device_type === 'string' || req.body.device_type instanceof String)) {
            isValid = false;
        }

        if (req.body.on_off != null && !(typeof req.body.on_off === 'string' || req.body.on_off instanceof String) && (!isNaN(req.body.on_off) && parseInt(req.body.on_off) == 0 || parseInt(req.body.on_off) == 1)) {
            isValid = false;
        }

        if (req.body.batteries_included != null && !(typeof req.body.batteries_included === 'string' || req.body.batteries_included instanceof String) && (!isNaN(req.body.batteriesIncluded) && parseInt(req.body.batteries_included) == 0 || parseInt(req.body.batteries_included) == 1)) {
            isValid = false;
        }

        if (req.body.open_closed != null && !(typeof req.body.open_closed === 'string' || req.body.open_closed instanceof String) && (!isNaN(req.body.open_closed) && parseInt(req.body.open_closed) == 0 || parseInt(req.body.open_closed) == 1)) {
            isValid = false;
        }

        if (req.body.volume != null && !(typeof req.body.volume === 'string' || req.body.volume instanceof String) && (!isNaN(req.body.volume) && parseInt(req.body.volume) >= 0 && parseInt(req.body.volume) <= 100)) {
            isValid = false;
        }

        if (req.body.temperature != null && !(typeof req.body.temperature === 'string' || req.body.temperature instanceof String) && (!isNaN(req.body.temperature) && parseInt(req.body.temperature) >= 1 && parseInt(req.body.temperature) <= 220)) {
            isValid = false;
        }

        if (!isValid) {
            return res.status(400).json({ error: "The data fields are invalid or the custom name does not fit the required schema." });
        }

        if (Array.isArray(req.body.on_off)) {
            req.body.on_off = req.body.on_off[0];
        }

        if (Array.isArray(req.body.batteries_included)) {
            req.body.batteries_included = req.body.batteries_included[0];
        }
        if (Array.isArray(req.body.open_closed)) {
            req.body.open_closed = req.body.open_closed[0];
        }

        // Determine which fields within the query result have non-null values

        let valid_on_off = (req.body.on_off !== null);
        let valid_temperature = (req.body.temperature !== null);
        let valid_volume = (req.body.volume !== null);
        let valid_batteries_included = (req.body.batteries_included !== null);
        let valid_open_closed = (req.body.open_closed !== null);

        // Determine state of each field

        let deviceOnState = 0;
        if (valid_on_off) {
            deviceOnState = (req.body.on_off === "1");
        }

        let deviceOpenState = 0;
        if (valid_open_closed) {
            deviceOpenState = (req.body.open_closed === "1");
        }

        let deviceBatteriesState = 0;
        if (valid_batteries_included) {
            deviceBatteriesState = (req.body.batteries_included === "1");
        }

        /*

        Database interaction:

        Purpose:
        To update the custom name of a device record in the 'Device Names' table of the database.

        Input:
        The custom name and ID of the device record to be updated is provided to the SQL statement.

        Output:
        The custom name is updated to the 'Device Names' table given that the ID exists. The number of rows updated is returned.

        */

        let sqlQueryCustomName = "UPDATE devicenames SET Custom_Name = ? WHERE Device_Type_ID = ?";

        let customNameRecord = [req.body.custom_name, req.body.device_type_ID];

        db.query(sqlQueryCustomName, customNameRecord, (err, result) => {
            if (err) {
                res.redirect("/retrieve-update-record");
            }
        });

        /*

        Database interaction:

        Purpose:
        To update an existing device record with updated field values in the 'Device Types' table in the database.

        Input:
        Updated field values applicable to the given device are provided as input to the SQL statement.

        Output:
        The replacement of the original device field values with the updated ones. The number of updated rows are returned.

        */

        let sqlQueryUpdateFields = "UPDATE devicetypes SET Device_Type = ?, On_Off = ?, Temperature = ?, Volume = ?, Batteries_Included = ?, Open_Closed = ? WHERE Device_Type_ID = ?";

        let deviceValuesRecord = [req.body.device_type, req.body.on_off, req.body.temperature, req.body.volume, req.body.batteries_included, req.body.open_closed, req.body.device_type_ID];

        db.query(sqlQueryUpdateFields, deviceValuesRecord, (err, result) => {
            if (err) {
                res.redirect("/retrieve-update-record");
            }
        });

        /*

        Database interaction:

        Purpose:
        To retrieve all device records from the 'Device Names' and 'Device Types' database tables.

        Input:
        A JOIN clause is used to combine rows from the two tables, based on a related column: the Device Type ID, provided as user input to the SQL statement.

        Output:
        The SQL SELECT statement returns a set containing all records from the 'Device Names' and 'Device Types' database tables.

        */

        let sqlQueryAll = "SELECT * FROM devicenames LEFT JOIN devicetypes ON devicenames.Device_Type_ID = devicetypes.Device_Type_ID";

        db.query(sqlQueryAll, (err, result) => {

            // Database query unsuccessful, redirect to the home page

            if (err) {
                res.redirect("index.html");
            }
            else {
                res.render("performupdateresult.ejs", {
                    updateRecord: req.body,
                    deviceList: result,
                    validOnOff: valid_on_off,
                    validTemperature: valid_temperature,
                    validVolume: valid_volume,
                    validBatteriesIncluded: valid_batteries_included,
                    validOpenClosed: valid_open_closed,
                    deviceOn: deviceOnState,
                    deviceOpen: deviceOpenState,
                    deviceBatteries: deviceBatteriesState,
                });
            }
        });
    });
};