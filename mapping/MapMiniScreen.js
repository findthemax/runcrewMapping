import React, { useState, useEffect } from 'react'

import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import MapView, {Marker} from "react-native-maps";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from "../../constants/Colors";
import MapMarker from "../../components/UI/map/MapMarker";
import Styles from "../../constants/Styles";

const MapMiniScreen = ({location, locationName, errors, onPress}) => {

    const [mapRegion, setMapRegion] = useState()

    const errorArray = errors.filter(error => error.param === "coordinates" && error);

    useEffect(() => {
        if(location) {
            setMapRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.00092,
                longitudeDelta: 0.000421,
            })
        }
    }, [location])


    return (
        <View style={styles.container} >
            {
                location ?
                    <MapView
                        region={mapRegion}
                        style={styles.map}
                    >
                        <Marker coordinate={location}>
                            <MapMarker title={locationName}/>
                        </Marker>
                    </MapView>
                :
                    <TouchableOpacity style={styles.emptyMapBox} onPress={() => onPress()}>
                        <MaterialCommunityIcons name="map-marker-question-outline" size={50} color={Colors.blue} />
                        <Text style={styles.mapBoxText}>No location defined. Press to add</Text>
                    </TouchableOpacity>
            }
            <TouchableOpacity style={styles.editBox} onPress={() => onPress()}>
                <MaterialIcons name="mode-edit" size={30} color={Colors.blue} />
            </TouchableOpacity>
            {errorArray.map((error, index) => (
                <Text
                    key={"coordinates" + index}
                    style={{ ...Styles.errorText, ...styles.error }}
                >
                    {error.msg}
                </Text>
            ))}
        </View>

    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 200,
        marginBottom: 20
    },
    map: {
        flex: 1
    },
    emptyMapBox: {
        flex: 1,
        borderColor: Colors.nickel,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    mapBoxText: {
        color: Colors.blue,
        marginTop: 5
    },
    editBox: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 50,
        height: 50,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: Colors.blue,
        borderWidth: 2,
        backgroundColor: `rgba(${Colors.rgbWhite}, .7)`
    },

});

export default MapMiniScreen