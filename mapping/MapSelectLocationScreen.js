import React, { useState, useEffect } from 'react'
import Styles from "../../constants/Styles";

import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import Colors from "../../constants/Colors";

import MapMarker from "../../components/UI/map/MapMarker";

const MapSelectLocationScreen = ({mapCenter, markerPosition, markerName, updateMarkerPosition}) => {

    const STANDARD = 'standard'
    const SATELLITE = 'satellite'
    const HYBRID = 'hybrid'

    const mapTypeArr = [
        STANDARD, SATELLITE, HYBRID
    ]

    const [mapRegion, setMapRegion] = useState()
    const [markerCoords, setMarkerCoords] = useState(null)
    const [mapType, setMapType] = useState(STANDARD)
    const [mapTypes, setMapTypes] = useState(false)

    useEffect(() => {
        setMapRegion({
            latitude: mapCenter.coordinates[1],
            longitude: mapCenter.coordinates[0],
            latitudeDelta: 0.04,
            longitudeDelta: 0.04
        })
    }, [mapCenter])

    useEffect(() => {
        if(markerPosition) {
            setMarkerCoords({
                latitude: markerPosition.latitude,
                longitude: markerPosition.longitude,
            })
            setMapRegion({
                latitude: markerPosition.latitude,
                longitude: markerPosition.longitude,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04
            })
        }
    }, [])

    const setMarkerPosition = (evt) => {
        setMarkerCoords({
            latitude: evt.nativeEvent.coordinate.latitude,
            longitude: evt.nativeEvent.coordinate.longitude,
        })
        setMapRegion({
            latitude: evt.nativeEvent.coordinate.latitude,
            longitude: evt.nativeEvent.coordinate.longitude,
            latitudeDelta: 0.001,
            longitudeDelta: 0.001,
        })
    }

    const toggleMapTypesView = () => {
        setMapTypes(!mapTypes)
    }

    const saveLocationHandler = () => {
        if(markerCoords) {
            updateMarkerPosition(markerCoords)
        }
        else {
            Alert.alert('Select Location', 'Please select a location to save')
        }
    }

    return (
        <View style={{width: '100%', height: '100%'}}>
            <MapView
                style={styles.map}
                initialRegion={mapRegion}
                onPress={setMarkerPosition}
                mapType={mapType}
            >
                {markerCoords &&
                <Marker coordinate={markerCoords} >
                    <MapMarker title={markerName} />
                </Marker>
                    }
            </MapView>
            {mapTypes &&
                <View style={styles.mapTypeMenu}>
                    {mapTypeArr.map(type => type !== mapType && <TouchableOpacity key={type} style={styles.mapTypeMenuOption} onPress={() => {
                        setMapType(type)
                        setMapTypes(false)}}>
                        <Text style={styles.mapTypeText}>{type}</Text>
                    </TouchableOpacity>)}
                </View>
            }
            <TouchableOpacity
                style={styles.mapTypeControl}
                onPress={() => toggleMapTypesView()}
            >
                <Text style={styles.mapTypeText}>{mapType === 'standard' ? 'map view' : mapType}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveRoute} onPress={() => saveLocationHandler()}>
                <Text style={styles.routeControlText}>SAVE</Text>
            </TouchableOpacity>
        </View>

    )
}

const styles = StyleSheet.create({
    mapTypeControl: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        height: 50,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: Colors.blue,
        borderWidth: 2,
        backgroundColor: `rgba(${Colors.rgbWhite}, .7)`
    },
    mapTypeText: {
        color: Colors.blue,
        fontSize: 20,
        fontFamily: 'evo-reg',
        textTransform: 'uppercase'
    },
    mapTypeMenu: {
        position: 'absolute',
        bottom: 70,
        right: 10,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    mapTypeMenuOption: {
        height: 50,
        marginTop: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: Colors.blue,
        borderWidth: 2,
        backgroundColor: `rgba(${Colors.rgbWhite}, .7)`
    },
    map: {
        flex: 1
    },
    buttonDisable: {
        backgroundColor: `rgba(${Colors.rgbBlue}, .2)`
    },
    saveRoute: {
        position: "absolute",
        top: 10,
        right: 10,
        height: 50,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: "center",
        justifyContent: "center",
        borderColor: Colors.white,
        borderWidth: 2,
        backgroundColor: `rgba(${Colors.rgbBlue}, .9)`
    },
    routeControlText: {
        color: Colors.white,
        fontSize: 20,
        fontFamily: "evo-reg",
        textTransform: "uppercase"
    },
});

export default MapSelectLocationScreen