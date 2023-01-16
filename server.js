//Name:Manlin Mao
//Class: COMP206 101
//Assignment 2
//Purpose: creating web application that queries mysql db,
//which allows users to find listings by their inputs
const express = require('express');
const app = express();
//requiring 2 js file for using sql and query functions
const queries = require("./mysql/queries");
const mysqlFunc = require("./mysql/config");

//set up view egine
app.set('view engine', 'ejs');
app.listen(3000);

app.get('/', function (request, response) {

  response.render('index', { title: 'Airbnb Search App' });
});
// http://localhost:3000/
app.get("/all", (request, response) => {
  //query cities and states from db
  let statesPromise = queries.querySql("SELECT * FROM states");
  let query = "SELECT * FROM cities WHERE state_id = ? ORDER BY name";
  let safeQuery = mysqlFunc.functions.format(query, [request.query.state]);
  let citiesPromise = queries.querySql(safeQuery);
  //use promise all to send data to ejs
  Promise.all([statesPromise, citiesPromise])
    .then(results => {
      let states = results[0];
      let cities = results[1];
      response.json({
        states: states,
        cities: cities
      });
    });
});

app.get('/airbnb', (request, response) => {
  response.render('airbnb', { title: 'AirBnb' });
});
//setting up a route for linking one place individually to its own information
app.get('/place/:placeID', (request, response) => {
  let ID = request.params.placeID;
  queries.findPlace(ID).then(result => {
    queries.findAmenities(result[0].id).then(amenities => {
      response.render('listing', { listing: result[0], amenities: amenities });
    });
  });
});
//route to find a specific airbnb according to conditions provided
app.get('/airbnb/find-one', (request, response) => {
  let numRooms = request.query.bedrooms;
  let amenitiesID = request.query.amenities;
  let max_guest = request.query.nbrOfGuest;
  let price_by_night = request.query.pricePerNight;
  queries.findListing(
    {
      number_rooms: numRooms,
      amenities: amenitiesID,
      max_guest: max_guest,
      price_by_night, price_by_night
    }
  ).then(result => {
    //if conditions not met, send null to ejs
    if (result.length == 0)
      response.render("listing", { listing: null });
    else {
      queries.findAmenities(result[0].id)
        .then(amenities => {
          response.render("listing", { listing: result[0], amenities: amenities });
        });
    }
  });
});

//route to find lists of places according to user's input
app.get("/airbnb/find-many", async (request, response) => {
  let numRooms = request.query.bedrooms;
  let citiesID = request.query.cities;
  queries.findListings(
    {
      number_rooms: numRooms,
      cities: citiesID
    }

  )
    .then(result => {

      response.render("listings", { listing: result, message: "" });
    });
});
