const mysql = require("./config.js");

// queries a place and limits by amenities and number rooms
// it returns all fields from the "place" table, as well as the city name, state name, and the owner's first/last name and email
// returns a promise -- so you must use .then() to access its data
// example is server.js line 21-23

function findListing(criteria) {
    let query = `SELECT A.*, B.name as cityName, C.name as stateName, 
    D.first_name, D.last_name, D.email
        FROM places A
        JOIN cities B on A.city_id = B.id
        JOIN states C on C.id = B.state_id
        JOIN users D ON A.user_id = D.id
        WHERE A.id IN (
        SELECT place_id FROM place_amenity 
        ${(criteria.amenities == undefined) ? `` : `WHERE amenity_id IN(?)`}
        GROUP BY place_id
        HAVING count(place_id) >= ?
    )
    AND A.number_rooms >= ?
    AND A.max_guest<=?
    AND A.price_by_night<=? LIMIT 1`;
    let safeQuery;
    if (criteria.amenities == undefined) {
        safeQuery = mysql.functions.format(query, [0,
            criteria.number_rooms, criteria.max_guest, criteria.price_by_night]);
    } else {
        safeQuery = mysql.functions.format(query, [criteria.amenities, criteria.amenities.length,
        criteria.number_rooms, criteria.max_guest, criteria.price_by_night])
    }
    return querySql(safeQuery);
}

// queries a list of places and limits by the number of rooms
// only returns 1 result -- that is a promise -- so you must use .then() to access its data
function findListings(criteria) {
    let selectQuery = `SELECT D.*,A.*,B.name as cityName, C.name as stateName FROM places A
        JOIN cities B ON A.city_id = B.id
        JOIN states C on B.state_id = C.id
        JOIN users D on A.user_id = D.id
        WHERE number_rooms >= ? AND city_id =? `;
    let safeQuery = mysql.functions.format(selectQuery, [criteria.number_rooms, criteria.cities]);
    return querySql(safeQuery);
}
//function to query list all amenities for a specific place
function findAmenities(placeID) {
    let query = `SELECT name FROM place_amenity A 
    JOIN amenities B ON A.amenity_id=B.id
    WHERE place_id=?`;
    let safeQuery = mysql.functions.format(query, [placeID]);
    return querySql(safeQuery);
}
//function to query one specific place's info all 
function findPlace(placeID) {
    let query = `SELECT A.*, B.name as cityName, C.name as stateName, 
    D.first_name, D.last_name, D.email
    FROM places A
    JOIN cities B on A.city_id = B.id
    JOIN states C on C.id = B.state_id
    JOIN users D ON A.user_id = D.id
    WHERE A.id=?`
    let safeQuery = mysql.functions.format(query, [placeID]);
    return querySql(safeQuery);
}


module.exports = {
    "findListing": findListing,
    "findListings": findListings,
    "findAmenities": findAmenities,
    "findPlace": findPlace,
    "querySql": querySql
};




// it has been written to return the data from your database query

function querySql(sql) {
    let con = mysql.getCon();

    con.connect(function (error) {
        if (error) {
            return console.error(error);
        }
    });

    return new Promise((resolve, reject) => {
        con.query(sql, (error, sqlResult) => {
            if (error) {
                return reject(error);
            }

            return resolve(sqlResult);
        });

        con.end();
    });
}
