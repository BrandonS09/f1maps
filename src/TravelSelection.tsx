import React from "react";
import { StyleSheet, View, Text, Button } from "react-native";

interface TravelSelectionProps {
  setDriving: () => void;
  setWalking: () => void;
}

const TravelSelection: React.FC<TravelSelectionProps> = ({
  setDriving,
  setWalking,
}) => {
  return (
    <View style={styles.selectionContainer}>
      <Text style={styles.selectionText}>Select Your Way of Travel</Text>
      <Button title="Driving" onPress={setDriving} />
      <Text> </Text>
      <Button title="Walking" onPress={setWalking} />
    </View>
  );
};

const styles = StyleSheet.create({
  selectionContainer: {
    flex: 1,
  },
  selectionText: {
    color: "white",
  },
});

export default TravelSelection;
