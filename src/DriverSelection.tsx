import React from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity, Button } from "react-native";

interface DriverSelectionProps {
  drivers: any[];
  handleDriverSelect: (driver: any) => void;
  closeDriverMenu: () => void;
}

const DriverSelection: React.FC<DriverSelectionProps> = ({
  drivers,
  handleDriverSelect,
  closeDriverMenu,
}) => {
  return (
    <View style={styles.driverContainer}>
      {drivers.map((driver) => (
        <TouchableOpacity key={driver.name} onPress={() => handleDriverSelect(driver)}>
          <Image source={driver.image} style={styles.driverImage} />
          <Text>{driver.name}</Text>
        </TouchableOpacity>
      ))}
      <Button title="Close" onPress={closeDriverMenu} />
    </View>
  );
};

const styles = StyleSheet.create({
  driverContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  driverImage: {
    width: 50,
    height: 50,
    margin: 10,
  },
});

export default DriverSelection;
