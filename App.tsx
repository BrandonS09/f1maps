import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View, Text, Image, TextInput, Button, Platform } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";
import Constants from 'expo-constants';

import uIcon from "./assets/lando.png";

// Access API Key from Constants.expoConfig
const apiKey = Platform.select({
  ios: Constants.expoConfig.extra.googleMaps.iosApiKey,
  android: Constants.expoConfig.extra.googleMaps.androidApiKey,
});

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [destination, setDestination] = useState<string>("");
  const [destinationCoords, setDestinationCoords] = useState<Location.LocationObject | null>(null);
  const [userMarker, setUserMarker] = useState<Location.LocationObject | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);

        Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000, // Update location every second
            distanceInterval: 1, // Minimum distance (in meters) to trigger an update
          },
          (locationData) => {
            setLocation(locationData);
            setUserMarker(locationData);
          }
        );

        Location.watchHeadingAsync((headingData) => {
          setHeading(headingData.trueHeading);
        });
      } catch (error) {
        console.error("Error fetching location:", error);
      }
    })();
  }, []);

  const handleSearch = async () => {
    if (destination.trim() === "") {
      alert("Please enter a destination");
      return;
    }

    try {
      const geocode = await Location.geocodeAsync(destination);
      if (geocode && geocode.length > 0) {
        setDestinationCoords(geocode[0]);
        if (mapRef.current) {
          mapRef.current.fitToCoordinates([
            { latitude: location.coords.latitude, longitude: location.coords.longitude },
            { latitude: geocode[0].latitude, longitude: geocode[0].longitude }
          ], {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      } else {
        alert("Destination not found");
      }
    } catch (error) {
      console.error("Error searching:", error);
      alert("Error searching for destination");
    }
  };

  const handleDirections = async () => {
    if (!destinationCoords) {
      alert("Please search for a destination first");
      return;
    }

    const origin = `${location.coords.latitude},${location.coords.longitude}`;
    const destination = `${destinationCoords.latitude},${destinationCoords.longitude}`;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}&mode=driving`;

    try {
      const response = await axios.get(url);
      console.log("API Response:", response.data); // Log the entire response
      if (response.data.routes && response.data.routes.length > 0) {
        const steps = response.data.routes[0].legs[0].steps;
        const points = [];
        steps.forEach(step => {
          const stepPoints = decode(step.polyline.points);
          points.push(...stepPoints);
        });
        setRouteCoordinates(points);
      } else {
        console.error("No routes found in the API response.");
        alert("No routes found. Please check the destination or try again later.");
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
    }
  };

  // Function to decode polyline points
  const decode = (t, e = 5) => {
    let points = [];
    let lat = 0, lon = 0;
    for (let step = 0; step < t.length; ) {
      let b, shift = 0, result = 0;
      do {
        b = t.charCodeAt(step++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = result = 0;
      do {
        b = t.charCodeAt(step++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lon += dlng;

      points.push({ latitude: lat / 1e5, longitude: lon / 1e5 });
    }
    return points;
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter destination"
        value={destination}
        onChangeText={(text) => setDestination(text)}
      />
      <Button title="Search" onPress={handleSearch} />

      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {destinationCoords && (
              <Marker
                coordinate={{
                  latitude: destinationCoords.latitude,
                  longitude: destinationCoords.longitude,
                }}
                title="Destination"
                description={destination}
              />
            )}

            {userMarker && (
              <Marker
                coordinate={{
                  latitude: userMarker.coords.latitude,
                  longitude: userMarker.coords.longitude,
                }}
                title="My Location"
                description="Current Location"
                rotation={heading || 0}
              >
                <Image source={uIcon} style={{ width: 50, height: 50 }} resizeMode="contain" />
              </Marker>
            )}

            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={4}
                strokeColor="blue"
              />
            )}
          </MapView>
        ) : (
          <Text>Loading...</Text>
        )}
      </View>

      <Button title="Get Directions" onPress={handleDirections} disabled={!destinationCoords} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 50,
  },
  input: {
    width: "80%",
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  mapContainer: {
    flex: 1,
    width: "100%",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "gray",
  },
  map: {
    flex: 1,
    width: "100%",
  },
});
