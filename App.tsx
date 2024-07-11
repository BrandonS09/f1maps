import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Platform,
} from "react-native";
import Map from "./src/Map";
import DriverSelection from "./src/DriverSelection";
import TravelSelection from "./src/TravelSelection";
import * as Location from "expo-location";
import axios from "axios";
import Constants from "expo-constants";
import Modal from "react-native-modal";
import nepobaby from "./assets/stroll.png";
import drivers from "./src/drivers";
import { decodePolyline } from "./src/utils";
import MapView from "react-native-maps";

const apiKey = Platform.select({
  ios: Constants.expoConfig.extra.googleMaps.iosApiKey,
  android: Constants.expoConfig.extra.googleMaps.androidApiKey,
});

const App: React.FC = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [heading, setHeading] = useState<number | null>(null);
  const [destination, setDestination] = useState<string>("");
  const [destinationCoords, setDestinationCoords] =
    useState<Location.LocationObject | null>(null);
  const [userMarker, setUserMarker] = useState<Location.LocationObject | null>(
    null
  );
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [directionsLoading, setDirectionsLoading] = useState<boolean>(false);
  const [uIcon, setUIcon] = useState(nepobaby); // Default to driver's face
  const [chooseDriverClicked, setChooseDriverClicked] = useState(false);
  const [travelForm, setTravelForm] = useState("walking"); // Default to walking
  const [isTravelSelection, setIsTravelSelection] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const mapRef = useRef<MapView>(null); // Add ref for MapView

  useEffect(() => {
    (async () => {
      setDirectionsLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        setDirectionsLoading(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);

        Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
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
      } finally {
        setDirectionsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (destinationCoords) {
      const interval = setInterval(() => {
        handleDirections(travelForm, false); // Use current travel form, no loading for updates
      }, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [destinationCoords, location, travelForm]);

  useEffect(() => {
    if (selectedDriver) {
      if (travelForm === "driving") {
        setUIcon(drivers[selectedDriver.name].team);
      } else {
        setUIcon(selectedDriver.image);
      }
    }
  }, [travelForm, selectedDriver]);

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
          mapRef.current.fitToCoordinates(
            [
              {
                latitude: location?.coords.latitude,
                longitude: location?.coords.longitude,
              },
              {
                latitude: geocode[0].latitude,
                longitude: geocode[0].longitude,
              },
            ],
            {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            }
          );
        }
      } else {
        alert("Destination not found");
      }
    } catch (error) {
      console.error("Error searching:", error);
      alert("Error searching for destination");
    }
  };

  const setDriving = () => {
    setTravelForm("driving");
    handleDirections("driving", true);
  };

  const setWalking = () => {
    setTravelForm("walking");
    handleDirections("walking", true);
  };

  const showSelectionModal = () => {
    setIsTravelSelection(true);
  };

  const handleDirections = async (mode: string, showLoading = false) => {
    setIsTravelSelection(false);
    if (!destinationCoords || !location) {
      alert("Please search for a destination first");
      return;
    }

    if (showLoading) setDirectionsLoading(true);

    const origin = `${location.coords.latitude},${location.coords.longitude}`;
    const destination = `${destinationCoords.latitude},${destinationCoords.longitude}`;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}&mode=${mode}`;

    try {
      const response = await axios.get(url);
      if (response.data.routes && response.data.routes.length > 0) {
        const steps = response.data.routes[0].legs[0].steps;
        const points: { latitude: number; longitude: number }[] = [];
        steps.forEach((step: any) => {
          const stepPoints = decodePolyline(step.polyline.points);
          points.push(...stepPoints);
        });
        setRouteCoordinates(points);

        const leg = response.data.routes[0].legs[0];
        setEta(leg.duration.text);
        setDistance(leg.distance.text);

        if (mapRef.current) {
          mapRef.current.fitToCoordinates(
            [
              {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              },
              {
                latitude: destinationCoords.latitude,
                longitude: destinationCoords.longitude,
              },
            ],
            {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            }
          );
        }
      } else {
        alert(
          "No routes found. Please check the destination or try again later."
        );
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
    } finally {
      if (showLoading) setDirectionsLoading(false);
    }
  };

  const chooseDriver = () => {
    setChooseDriverClicked(true);
  };

  const handleDriverSelect = (driver: any) => {
    setSelectedDriver(driver);
    setUIcon(driver.image); // Default to driver's face
    setChooseDriverClicked(false);
  };

  const closeDriverMenu = () => {
    setChooseDriverClicked(false);
  };

  return (
    <View style={styles.container}>
      {directionsLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading directions...</Text>
        </View>
      )}
      {!directionsLoading && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter destination"
            value={destination}
            onChangeText={(text) => setDestination(text)}
          />
          <Button title="Search" onPress={handleSearch} />

          <Map
            mapRef={mapRef} // Pass the ref to the Map component
            location={location}
            destinationCoords={destinationCoords}
            userMarker={userMarker}
            heading={heading}
            routeCoordinates={routeCoordinates}
            uIcon={uIcon}
            travelForm={travelForm}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Get Directions"
              onPress={showSelectionModal}
              disabled={!destinationCoords}
            />
            <Button title="Choose Driver" onPress={chooseDriver} />
          </View>
          {eta && distance && (
            <View style={styles.infoContainer}>
              <Text>ETA: {eta}</Text>
              <Text>Distance: {distance}</Text>
            </View>
          )}
          <Modal isVisible={isTravelSelection}>
            <TravelSelection setDriving={setDriving} setWalking={setWalking} />
          </Modal>
          {chooseDriverClicked && (
            <DriverSelection
              drivers={drivers}
              handleDriverSelect={handleDriverSelect}
              closeDriverMenu={closeDriverMenu}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 10,
  },
  infoContainer: {
    marginTop: 10,
  },
});

export default App;
