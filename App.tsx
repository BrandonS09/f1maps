import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import * as Location from "expo-location";
import uIcon from "../f1maps/assets/lando.png";

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [heading, setHeading] = useState<number | null>(null); // Store heading direction

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      // Get initial location
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      // Subscribe to heading updates
      Location.watchHeadingAsync((headingData) => {
        setHeading(headingData.trueHeading);
      });
    })();
  }, []);

  let initialRegion = {
    latitude: 37.4221,
    longitude: -122.0853,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  if (location) {
    initialRegion = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
        >
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Marker Title"
            description="Marker Description"
            rotation={heading || 0} // Rotate marker based on heading, default to 0 if heading is null
          >
            <Image source={uIcon} style={{width: 50, height: 50}} resizeMode="contain"></Image>
          </Marker>
        </MapView>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    flex: 1,
    width: "100%",
  }
})
