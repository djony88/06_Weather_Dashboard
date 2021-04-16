$(document).ready(function () {

    // Click on Search or City history list (if any)
    // Get location from user input in seearch tab or get location from city history (if any)
    $('#getEnteredCityWeather,#past-searches').on('click', function () {
  
          let clickEvent = $(event.target)[0];
          let location = "";
          if (clickEvent.id === "getEnteredCityWeather") {
            location = $('#cityEntered').val().trim().toUpperCase();
          } else if ( clickEvent.className === ("cityList") ) {
            location = clickEvent.innerText;
          }
          if (location == "") return;
  
          // Update local storage with new city search
          updateLocalStorage (location);
          
          // Get current weather for searched location
          getCurrentWeather(location);
          
          // Get forecast for searched location
          getForecastWeather(location);
         });
  
      // Convert Unix timestampe to MMM DD, YYYY format
      function convertDate(UNIXtimestamp) {
        let convertedDate = "";
        let a = new Date(UNIXtimestamp * 1000);
        let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        let year = a.getFullYear();
        let month = months[a.getMonth()];
        let date = a.getDate();
        convertedDate = month + ' ' + date + ', '+ year;
        return convertedDate;
      }
  
      // Update City in local storage
      function updateLocalStorage(location) {
         let cityList = JSON.parse(localStorage.getItem("cityList")) || [];
         cityList.push(location); 
         cityList.sort();
  
         // Removes dulicate cities from saved searches
         for (let i=1; i<cityList.length; i++) {
             if (cityList[i] === cityList[i-1]) cityList.splice(i,1);
         }
         //Stores in local storage
         localStorage.setItem('cityList', JSON.stringify(cityList));
  
         $('#cityEntered').val("");
      }
  
      // Get current user location
      function establishCurrLocation() {
          
        // Set location to null
          let location = {};
          
          // Get latitude and longitude
          function success(position) {
            location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              success: true
            }
        
            // Get current conditions for current location
            getCurrentWeather(location);
        
            // Get forecast for local conditions 
            getForecastWeather(location);
          }
        
          function error() {
            location = { success: false }
            return location;
          }
        
          // console.log if browser doesn't support location
          if (!navigator.geolocation) {
            console.log('Geolocation is not supported by your browser');
          } else {
            navigator.geolocation.getCurrentPosition(success, error);
          }
        }
  
      // Get current locaation weather
      function getCurrentWeather(loc) {
          
          // Pull city history from local storage memory
          let cityList = JSON.parse(localStorage.getItem("cityList")) || [];
          
          // Divider for each history location
          $('#past-searches').empty();
          
          cityList.forEach ( function (city) {  
            let cityHistoryNameDiv = $('<div>');      
            cityHistoryNameDiv.addClass("cityList");         
            cityHistoryNameDiv.attr("value",city);
            cityHistoryNameDiv.text(city);
            $('#past-searches').append(cityHistoryNameDiv);
          });      
          
          // Reset search value to null
          $('#city-search').val("");
        
          if (typeof loc === "object") {
            city = `lat=${loc.latitude}&lon=${loc.longitude}`;
          } else {
            city = `q=${loc}`;
          }
        
          // Set up Open Weather API Query
          var currentURL = "https://api.openweathermap.org/data/2.5/weather?";
          var cityName = city;
          var unitsURL = "&units=imperial";
          var apiIdURL = "&appid="
          var apiKey = "630e27fa306f06f51bd9ecbb54aae081";
          var openCurrWeatherAPI = currentURL + cityName + unitsURL + apiIdURL + apiKey;
        
          // Open weather API query
          $.ajax({
              url: openCurrWeatherAPI,
              method: "GET"
          }).then(function (response1) {
        
            // Show result into weatherObj
          weatherObj = {
              city: `${response1.name}`,
              wind: response1.wind.speed,
              humidity: response1.main.humidity,
              temp: Math.round(response1.main.temp),
        
              // Convert date to usable format = MM/DD/YYYY Format
              date: (convertDate(response1.dt)),
              icon: `http://openweathermap.org/img/w/${response1.weather[0].icon}.png`,
              desc: response1.weather[0].description
          }
          
            // Remove the current forecast
            $('#forecast').empty(); 
            // Render the current search city
            $('#cityName').text(weatherObj.city + " (" + weatherObj.date + ")");
            // Render the current search city weather icon
            $('#currWeathIcn').attr("src", weatherObj.icon);
            // Render the current search city temperature
            $('#currTemp').text("Temperature: " + weatherObj.temp + " " +  "°F");
            // Render the current search city humidity
            $('#currHum').text("Humidity: " + weatherObj.humidity + "%");
            // Render the current city search wind speed
            $('#currWind').text("Windspeed: " + weatherObj.wind + " MPH");      
        
          // Get UV from open weather using UVI Query
          city = `&lat=${parseInt(response1.coord.lat)}&lon=${parseInt(response1.coord.lon)}`;
          
          // Initiate API Call to get current weather
          var uviURL = "https://api.openweathermap.org/data/2.5/uvi";
          var apiIdURL = "?appid="
          var apiKey = "630e27fa306f06f51bd9ecbb54aae081";
          var cityName = city;
          var openUviWeatherAPI = uviURL + apiIdURL + apiKey + cityName;
          
          // Open weather call
          $.ajax({
              url: openUviWeatherAPI,
              method: "GET"
          }).then(function(response3) {
          
              // Show response into UviLevel variable
              let UviLevel = parseFloat(response3.value);
            
              // Initiate background as violet
              let backgrdColor = 'violet';        
              // determine backgrouind color depending on value
              if (UviLevel < 3) {backgrdColor = 'green';} 
                  else if (UviLevel < 6) { backgrdColor = 'yellow';} 
                  else if (UviLevel < 8) { backgrdColor = 'orange';} 
                  else if (UviLevel < 11) {backgrdColor = 'red';}     
          
              // Insert UVI Lable and value into HTML
              let uviTitle = '<span>UV Index: </span>';
              let color = uviTitle + `<span style="background-color: ${backgrdColor}; padding: 0 7px 0 7px;">${response3.value}</span>`;
              $('#currUVI').html(color);            
              });
          });
      }
  
      // Get weather forecast for selected city
      function getForecastWeather(loc) {
  
          // Determining the type of request - If an object, we have lat/lon, use it
          if (typeof loc === "object") {
              city = `lat=${loc.latitude}&lon=${loc.longitude}`;      
          // Else call API using city name 
          } else {
              city = `q=${loc}`; }
          
          // Set up Open Weather API Query
          var currentURL = "https://api.openweathermap.org/data/2.5/weather?";
          var cityName = city;
          var unitsURL = "&units=imperial";
          var apiIdURL = "&appid="
          var apiKey = "630e27fa306f06f51bd9ecbb54aae081";
          var openCurrWeatherAPI2 = currentURL + cityName + unitsURL + apiIdURL + apiKey;
          
          // Open weather API query
          $.ajax({
              url: openCurrWeatherAPI2,
              method: "GET",
          }).then(function (response4) {
  
          // Capture lat/lon for subsequent request
          var cityLon = response4.coord.lon;
          var cityLat = response4.coord.lat;
          
          // Set city with lat/long
          city = `lat=${cityLat}&lon=${cityLon}`;
          
          // Get five days of weather history using longitude and latitude
          let weatherArr = [];
          let weatherObj = {};
  
          // Initiate API Call to get current weather
          var currentURL = "https://api.openweathermap.org/data/2.5/onecall?";
          var cityName = city;
          
          var exclHrlURL = "&exclude=hourly";
          var unitsURL = "&units=imperial";
          var apiIdURL = "&appid=";
          var apiKey = "630e27fa306f06f51bd9ecbb54aae081";
          var openFcstWeatherAPI = currentURL + cityName + exclHrlURL + unitsURL + apiIdURL + apiKey;
  
          // Open weather API
          $.ajax({
              url: openFcstWeatherAPI,
              method: "GET"
          }).then(function (response2) {
          
            // Load weatherObj from response
            for (let i=1; i < (response2.daily.length-2); i++) {
              let cur = response2.daily[i]
              weatherObj = {
                  weather: cur.weather[0].description,
                  icon: `http://openweathermap.org/img/w/${cur.weather[0].icon}.png`,
                  minTemp: Math.round(cur.temp.min),
                  maxTemp: Math.round(cur.temp.max),
                  humidity: cur.humidity,
                  uvi: cur.uvi,
           
                  // Convert date to usable format = MM/DD/YYYY Format
                  date: (convertDate(cur.dt))
              }
              // Push day to weatherArr
              weatherArr.push(weatherObj);
            }
            // Show forecast on page
            // One iteration for each day of forecast history
            for (let i = 0; i < weatherArr.length; i++) {
              let $colmx1 = $('<div class="col mx-1">');
              let $cardBody = $('<div class="card-body forecast-card">');
              let $cardTitle = $('<h6 class="card-title">');
             
              $cardTitle.text(weatherArr[i].date);
  
              // Format HTML UL Tag
              let $ul = $('<ul>'); 
           
              // Format HTML LI Tags
              let $iconLi = $('<li>');
              let $iconI = $('<img>');
              let $weathLi = $('<li>');
              let $tempMaxLi = $('<li>');
              let $tempMinLi = $('<li>');
              let $humLi = $('<li>');
  
              // Format html values
              $iconI.attr('src', weatherArr[i].icon);
              $weathLi.text(weatherArr[i].weather);                
              $tempMaxLi.text('Temp High: ' + weatherArr[i].maxTemp + " °F");
              $tempMinLi.text('Temp Low: ' + weatherArr[i].minTemp + " °F");
              $humLi.text('Humidity: ' + weatherArr[i].humidity + "%");
  
              // Append HTML
              $iconLi.append($iconI);
              $ul.append($iconLi);
              $ul.append($weathLi);         
              $ul.append($tempMaxLi);
              $ul.append($tempMinLi);
              $ul.append($humLi);
              $cardTitle.append($ul);
              $cardBody.append($cardTitle);
              $colmx1.append($cardBody);
  
              $('#forecast').append($colmx1);
            }
          });
        });        
      }
      
  
      // Current location when page opens
      var location = establishCurrLocation();
    });