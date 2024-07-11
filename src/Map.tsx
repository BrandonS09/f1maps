import React, { useRef, useState } from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Polyline,
  Region,
} from "react-native-maps";
import f1Flag from "../assets/flag.png";

interface MapProps {
  mapRef: React.RefObject<MapView>;
  location: Location.LocationObject | null;
  destinationCoords: Location.LocationObject | null;
  userMarker: Location.LocationObject | null;
  heading: number | null;
  routeCoordinates: { latitude: number; longitude: number }[];
  uIcon: any;
  travelForm: string;
}

const Map: React.FC<MapProps> = ({
  mapRef,
  location,
  destinationCoords,
  userMarker,
  heading,
  routeCoordinates,
  uIcon,
  travelForm,
}) => {
  const [mapRotation, setMapRotation] = useState<number>(0);

  const handleRegionChangeComplete = (region: Region) => {
    setMapRotation(region.longitudeDelta);
  };

  const calculateRotation = () => {
    return heading !== null ? heading - mapRotation : 0;
  };

  return (
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
          onRegionChangeComplete={handleRegionChangeComplete}
        >
          {destinationCoords && (
            <Marker
              coordinate={{
                latitude: destinationCoords.latitude,
                longitude: destinationCoords.longitude,
              }}
              title="Destination"
              description="Destination"
            >
              <Image
                source={f1Flag}
                style={{ width: 50, height: 50 }}
                resizeMode="contain"
              />
            </Marker>
          )}

          {userMarker && (
            <Marker
              coordinate={{
                latitude: userMarker.coords.latitude,
                longitude: userMarker.coords.longitude,
              }}
              title="My Location"
              description="Current Location"
              rotation={calculateRotation()} // Use calculated rotation
              anchor={{ x: 0.5, y: 0.5 }} // Center the icon on the marker
            >
              <Image
                source={uIcon}
                style={{
                  width: travelForm === "driving" ? 70 : 50,
                  height: travelForm === "driving" ? 70 : 50,
                }}
                resizeMode="contain"
              />
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
  );
};

const styles = StyleSheet.create({
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

export default Map;
