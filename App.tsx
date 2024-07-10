import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, Image, TextInput, Button } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Directions } from "react-native-google-maps-directions";

import uIcon from "../f1maps/assets/lando.png";

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [destination, setDestination] = useState<string>("");
  const [destinationCoords, setDestinationCoords] = useState<Location.LocationObject | null>(null);
  const [userMarker, setUserMarker] = useState<Location.LocationObject | null>(null);

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
      } else {
        alert("Destination not found");
      }
    } catch (error) {
      console.error("Error searching:", error);
      alert("Error searching for destination");
    }
  };

  const handleDirections = () => {
    if (!destinationCoords) {
      alert("Please search for a destination first");
      return;
    }

    const data = {
      source: {
        latitude: userMarker?.coords.latitude || 0,
        longitude: userMarker?.coords.longitude || 0,
      },
      destination: {
        latitude: destinationCoords.latitude,
        longitude: destinationCoords.longitude,
      },
      params: [
        {
          key: "travelmode",
          value: "driving", // May change according to your use case
        },
        {
          key: "dir_action",
          value: "navigate",
        },
      ],
    };

    Directions(data); // Ensure correct usage of Directions function
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
     