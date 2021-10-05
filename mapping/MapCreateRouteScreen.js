import React, { useState, useEffect, useReducer } from "react";
import Styles from "../../constants/Styles";
import { FontAwesome5 } from "@expo/vector-icons";

import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import Colors from "../../constants/Colors";

import { useDispatch, useSelector } from "react-redux";
import {saveRoute} from "../../store/Routes/routeActions";
import MapMarker from "../../components/UI/map/MapMarker";
import haversine from "haversine";
import agreementHandler from "../../components/Alerts/agreementHandler";
import asyncForEach from "../../helpers/asyncForEach";
import {SafeViewScrollScreenContainer} from "../../components/UI/layout/ScreenContainer";
import InputText from "../../components/UI/inputs/InputText";
import {errorCheck} from "../../helpers/formActions";
import MainButton from "../../components/UI/buttons/MainButton";
import MainButtonOutline from "../../components/UI/buttons/MainButtonOutline";

const SET_WARMUP = "SET_WARMUP";
const DELETE_WARMUP = "DELETE_WARMUP";
const SET_STOP = "SET_STOP";
const SET_MEETING_LOCATION = "SET_MEETING_LOCATION";
const SET_MAP_REGION = "SET_MAP_REGION";
const SET_MAP_TYPE = "SET_MAP_TYPE";
const TOGGLE_MAP_TYPES = "TOGGLE_MAP_TYPES";
const ADD_POINT_CURRENT_ROUTE = "ADD_POINT_CURRENT_ROUTE";
const DELETE_LAST_POINT_CURRENT_ROUTE = "DELETE_LAST_POINT_CURRENT_ROUTE";
const RESET_ALL = "RESET_ALL";
const UPDATE_VALUE = 'UPDATE_VALUE';
const REDUX_ERRORS = 'REDUX_ERRORS';
const SET_NAME_VISIBLE = 'SET_NAME_VISIBLE'

const STANDARD = "standard";
const SATELLITE = "satellite";
const HYBRID = "hybrid";

function reducer(state, action) {
  switch (action.type) {
      case UPDATE_VALUE:
          let newStateErrors;
          if(action.errors.length > 0) {
              const otherParamErrors = state.errors.filter(error => error.param !== action.data.param && error)
              newStateErrors = [...otherParamErrors, ...state.errors]
          } else {
              newStateErrors = state.errors.filter(error => error.param !== action.data.param && error)
          }
          return {
              ...state,
              [action.data.param]: {
                  ...state[action.data.param],
                  value: action.value,
              },
              errors: newStateErrors,
              emptyErrors: state.emptyErrors.filter(error => error.param !== action.data.param)
          };
      case SET_WARMUP:
        return {
            ...state,
            warmup: action.location,
            currentRoute: [...state.currentRoute, ...[action.location]],
            goBack: false,
        };
      case DELETE_WARMUP:
        return {
            ...state,
            warmup: null,
        };
      case ADD_POINT_CURRENT_ROUTE:
        return {
            ...state,
            currentRoute: action.newCurrentRoute,
            routeDistance: action.totalDist,
            currentRouteDistance: action.currentDist,
            goBack: false,
        };
      case DELETE_LAST_POINT_CURRENT_ROUTE:
        return {
            ...state,
            warmup: action.newWarmup,
            stops: action.newStops,
            route: action.newRoute,
            currentRoute: action.newCurrentRoute,
            routeDistance: action.totalDist,
            currentRouteDistance: action.currentDist
        };
      case SET_MEETING_LOCATION:
        return {
            ...state,
            meetingLocation: action.location,
            mapRegion: action.mapRegion
        };
      case SET_MAP_REGION:
        return {
            ...state,
            mapRegion: action.mapRegion
        };
      case SET_MAP_TYPE:
        return {
            ...state,
            mapType: action.mapType,
            mapTypeVisible: false
        };
      case TOGGLE_MAP_TYPES:
        return {
            ...state,
            mapTypeVisible: !state.mapTypesVisible
        };
      case SET_STOP:
        return {
            ...state,
            stops: action.newStops,
            route: action.newRoute,
            currentRoute: action.newCurrentRoute,
            routeDistance: action.totalDist,
            currentRouteDistance: action.currentDist
        };
      case RESET_ALL:
          return {
            ...state,
            warmup : null,
            stops: [],
            route: [],
            currentRoute: [],
            routeDistance: 0,
            currentRouteDistance: 0,
            nameVisible: false,
            allReset: false
        };
      case REDUX_ERRORS:
          return {
              ...state,
              errors: action.errors
          };
      case SET_NAME_VISIBLE:
          return {
              ...state,
              nameVisible: action.value
          }
      default:
      return state;
  }
}

const initialState = {
    warmup: null,
    stops: [],
    route: [],
    currentRoute: [],
    routeDistance: 0,
    currentRouteDistance: 0,
    mapRegion: null,
    meetingLocation: null,
    mapType: SATELLITE,
    mapTypesVisible: false,
    allReset: false,
    goBack: false,
    name: {
        param: 'name',
        label: 'Route Name',
        value: "",
        validate: [],
        info: "Routes are automatically associated with the location. Route names help you identify the route",
    },
    nameVisible: false,
    errors: [],
    emptyErrors: []
};

const MapCreateRouteScreen = ({ navigation, route }) => {

    const [state, dispatch] = useReducer(reducer, initialState);

    const mapTypeArr = [STANDARD, SATELLITE, HYBRID];

    const crew = useSelector(state => state.access.crewSelected.crewId);
    const token = useSelector(state => state.auth.userToken);
    const success = useSelector(state => state.route.saveSuccess);
    const errors = useSelector(state => state.route.errors);

  const reduxDispatch = useDispatch();

  useEffect(() => {
      if(!route.params.edit) {
          dispatch({type: RESET_ALL})
      }
      infoAlert();
  }, [])

    useEffect(() => {
        if(errors.length > 0) {
            dispatch({type: REDUX_ERRORS, errors})
        }
    }, [errors])

    useEffect(() => {
        if(success) {
            Alert.alert(
                "Save Successful",
                "Your route has been saved",
                [{
                    text: "New Route",
                    onPress: () => dispatch({ type: RESET_ALL })
                }, {
                    text: "Done",
                    onPress: () => navigation.goBack()
                }
                    ]
            )
        }
    }, [success])

  const infoAlert = () => {
    Alert.alert(
      "Create A Route",
      `Start creating your route by clicking anywhere on the map\n\nYour first press will set your Warmup location each subsequent press will add a section to your route\n\nTo add a hiit stop at the last point press 'SET STOP'. Your last stop will automatically be converted to the chilldown by our system\n\nIf you make a mistake you can step back using the \u21BA button\n\nTo start from scratch press the 'trash' button\n\nOnce you have finished press 'SAVE'\n\nYou can change the map type and view your leg and total distance at the bottom`
    );
  };

  useEffect(() => {
      if (route.params.meetingLocation) {
      dispatch({
        type: SET_MEETING_LOCATION,
        location: {
            lat: route.params.meetingLocation[1],
            lng: route.params.meetingLocation[0],
            locationId: route.params.meetingLocationId,
        },
        mapRegion: {
          latitude: route.params.meetingLocation[1],
          longitude: route.params.meetingLocation[0],
          latitudeDelta: 0.001,
          longitudeDelta: 0.001
        }
      });
    }
  }, []);

const valueUpdateHandler =  async(data, value) => {
    let errors = [];
    if(data.validate.length > 0) {
        errors = await errorCheck(value, data.param, state.errors)
    }
    dispatch({type: UPDATE_VALUE, data, value, errors})
};

const totalDistCalc = async (route) => {
    const flatTotalArray = [].concat.apply([], route);
    return await legTotal(flatTotalArray);
};

const currentDistCalc = async (currentRoute) => {
    return await legTotal(currentRoute);
};

    const resetAll = async () => {
    const agreement = await agreementHandler(
      "Reset Whole Route",
      "Are you sure you want to reset the whole route?",
      "Yes"
    );
    if (agreement) {
      dispatch({ type: RESET_ALL });
    }
  };

  const registerTouchHandler = async data => {
    if (!state.warmup) {
      dispatch({ type: SET_WARMUP, location: data.nativeEvent.coordinate });
    } else {
        let newCurrentRoute = [...state.currentRoute, ...[data.nativeEvent.coordinate]]
        const totalDist = await totalDistCalc([...state.route, ...newCurrentRoute])
        const currentDist = await currentDistCalc(newCurrentRoute)
      dispatch({ type: ADD_POINT_CURRENT_ROUTE, newCurrentRoute, totalDist, currentDist });
    }
  };

  const stepBackHandler = async() => {
      let newCurrentRoute = state.currentRoute;
      let newRoute = state.route;
      let newStops = state.stops;
      let newWarmup = state.warmup;
      if (state.currentRoute.length > 1) {
          //point is not a stop
          newCurrentRoute = [...state.currentRoute];
          newCurrentRoute.splice(-1, 1);
      } else {
          //point is a stop or the warmup position
          if (state.route.length > 0) {
              //point is a stop but not warmup
              newCurrentRoute = state.route[state.route.length - 1];
              newRoute = state.route;
              newRoute.splice(-1, 1);
              newStops.splice(-1, 1);
          } else {
              //point is warmup position
              newRoute = []
              newCurrentRoute = [];
              newWarmup = null;
              newStops = [];
          }
      }
      const totalDist = await totalDistCalc([...newRoute, ...newCurrentRoute])
      const currentDist = await currentDistCalc(newCurrentRoute)
    dispatch({ type: DELETE_LAST_POINT_CURRENT_ROUTE, newRoute, newCurrentRoute, newStops, newWarmup, totalDist, currentDist });
  };

  const setStopHandler = async () => {
      const check = state.stops.find(({latitude, longitude}) => latitude === state.currentRoute[state.currentRoute.length - 1].latitude && longitude === state.currentRoute[state.currentRoute.length - 1].longitude)
      const warmupCheck = state.warmup.latitude === state.currentRoute[state.currentRoute.length - 1].latitude && state.warmup.longitude === state.currentRoute[state.currentRoute.length - 1].longitude
      if(!check && !warmupCheck) {
          const newStops = [
              ...state.stops,
              ...[state.currentRoute[state.currentRoute.length - 1]]
          ];
          let newCurrentRoute = [state.currentRoute[state.currentRoute.length - 1]]
          let newRoute = state.route
          newRoute.push(state.currentRoute)
          const totalDist = await totalDistCalc(newRoute)
          const currentDist = await currentDistCalc([])
          dispatch({ type: SET_STOP, newRoute, newCurrentRoute, newStops, totalDist, currentDist })
      } else {
          Alert.alert(
              "Error",
              `You have already added this point as a stop`
          );
      }
  }

    const setRouteHandler = async () => {
        if(state.currentRoute.length > 1) {
          Alert.alert("Finish Route", "Make sure to set your last stop before saving the route - all route lines should be green!")
      } else {
            if(state.route.length === 0) {
                Alert.alert("Finish Route", "Please add stops and legs to your route")
            } else {
                dispatch({type: SET_NAME_VISIBLE, value: true})
            }
      }
  };

  const saveRouteHandler = async () => {
      const legs = []
      const stops = []
      let chilldownLocation = null
      let totalDistance = 0
      await asyncForEach(state.route, async (leg, index) => {
          const distance = await legTotal(leg)
          totalDistance = parseInt(totalDistance)+parseInt(distance)
          legs.push({
              polyline: leg,
              distance,
              legNumber: index + 1
          })
          if(index+1 === state.route.length) {
              //this is the last leg
              chilldownLocation = leg[leg.length-1]
          } else {
              stops.push(leg[leg.length-1])
          }
      })
      const data = {
          meetingLocation: state.meetingLocation.locationId,
          chilldownLocation,
          legs,
          warmupLocation: state.route[0][0],
          stops,
          distance: totalDistance,
          name: state.name.value
      }
      if(state.name.value.trim().length > 0) {
          reduxDispatch(saveRoute(token, crew, data))
      } else {
          Alert.alert("Route Name", "Please provide a short, unique name for the route")
      }
    }

  const legTotal = async array => {
    let distance = 0;
    let prevCoords = null;
    await array.forEach((coords, index) => {
      if (prevCoords) {
        distance = (parseInt(distance) + haversine(prevCoords, coords, {unit: 'meter'})).toFixed();
      }
      prevCoords = coords;
    });
    return distance;
  };

  let markerCoordinates;

  if (state.meetingLocation) {
    markerCoordinates = {
      latitude: state.meetingLocation.lat,
      longitude: state.meetingLocation.lng
    };
  }

  if(state.nameVisible) {
      return (
          <SafeViewScrollScreenContainer>
                <InputText
                    data={state.name}
                    errors={state.errors}
                    valueUpdate={valueUpdateHandler}
                />
                <MainButton
                    title="Save"
                    onPress={() => saveRouteHandler()}
                    styleButton={{marginBottom: 10}}
                />
              <MainButtonOutline
                  title="Cancel"
                  onPress={() => dispatch({type: SET_NAME_VISIBLE, value: false})}
              />
          </SafeViewScrollScreenContainer>
      )
  }

    return (
    <View style={{ width: "100%", height: "100%" }}>
      {state.mapRegion && (
        <MapView
          style={styles.map}
          initialRegion={state.mapRegion}
          onPress={registerTouchHandler}
          mapType={state.mapType}
        >
          {markerCoordinates && (
            <Marker coordinate={markerCoordinates}>
              <MapMarker title="Meeting Location" />
            </Marker>
          )}

          {state.warmup && (
            <Marker coordinate={state.warmup}>
              <MapMarker title="Warm-up" />
            </Marker>
          )}
          {state.stops.map((stop, index) => (
            <Marker coordinate={stop} key={stop.latitude+stop.longitude}>
              <MapMarker title={"HIIT Stop " + (index + 1)} />
            </Marker>
          ))}
          {state.currentRoute.length > 0 && (
            <Polyline
              coordinates={state.currentRoute}
              strokeColor={Colors.pink}
              strokeWidth={6}
            />
          )}
          {state.route.map(routeSegment => (
            <Polyline
              coordinates={routeSegment}
              strokeColor={Colors.green}
              strokeWidth={6}
              key={routeSegment[0].longitude}
            />
          ))}
        </MapView>
      )}

      <TouchableOpacity
        style={styles.addStop}
        disabled={state.currentRoute.length < 1}
        onPress={() => setStopHandler()}
      >
        <Text style={styles.routeControlText}>Set Stop</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.undo} onPress={() => stepBackHandler()}>
        <FontAwesome5 name="undo-alt" size={24} color={Colors.white} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.trash} onPress={() => resetAll()}>
        <FontAwesome5 name="trash" size={24} color={Colors.white} />
      </TouchableOpacity>

        <TouchableOpacity style={styles.saveRoute} onPress={() => setRouteHandler()}>
            <Text style={styles.routeControlText}>SAVE</Text>
        </TouchableOpacity>

      <TouchableOpacity style={styles.info} onPress={() => infoAlert()}>
        <FontAwesome5 name="info" size={24} color={Colors.white} />
      </TouchableOpacity>

      {state.mapTypesVisible && (
        <View style={styles.mapTypeMenu}>
          {mapTypeArr.map(
            mapType =>
              mapType !== state.mapType && (
                <TouchableOpacity
                  key={mapType}
                  style={styles.mapTypeMenuOption}
                  onPress={() => dispatch({ type: SET_MAP_TYPE, mapType })}
                >
                  <Text style={styles.mapTypeText}>
                    {mapType === STANDARD ? "map view" : mapType}
                  </Text>
                </TouchableOpacity>
              )
          )}
        </View>
      )}

      <View style={styles.distanceBox}>
        <Text style={styles.distanceText}>
          Leg: {parseInt(state.currentRouteDistance) / 1000} km
        </Text>
      </View>
      <View style={styles.totalDistanceBox}>
        <Text style={styles.distanceText}>
          Total: {parseInt(state.routeDistance) / 1000} km
        </Text>
      </View>
      <TouchableOpacity
        style={styles.mapTypeControl}
        onPress={() => dispatch({ type: TOGGLE_MAP_TYPES })}
      >
        <Text style={styles.mapTypeText}>
          {state.mapType === STANDARD ? "map view" : state.mapType}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  distanceBox: {
    position: "absolute",
    left: 10,
    bottom: 90,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    borderColor: Colors.white,
    borderWidth: 2,
    backgroundColor: `rgba(${Colors.rgbBlack}, .7)`
  },
  totalDistanceBox: {
    position: "absolute",
    left: 10,
    bottom: 30,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    borderColor: Colors.white,
    borderWidth: 2,
    backgroundColor: `rgba(${Colors.rgbBlack}, .7)`
  },
  distanceText: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: "evo-reg",
    textTransform: "uppercase"
  },
  addStop: {
    position: "absolute",
    top: 10,
    left: 10,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    borderColor: Colors.white,
    borderWidth: 2,
    backgroundColor: `rgba(${Colors.rgbBlue}, .9)`
  },
  undo: {
    position: "absolute",
    top: 70,
    left: 10,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    borderColor: Colors.white,
    borderWidth: 2,
    backgroundColor: `rgba(${Colors.rgbBlue}, .9)`
  },
  info: {
    position: "absolute",
    top: 70,
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
  trash: {
    position: "absolute",
    top: 130,
    left: 10,
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
  routeLegText: {
    color: Colors.blue,
    fontSize: 20,
    fontFamily: "evo-reg",
    textTransform: "uppercase"
  },
  routeLegMenu: {
    position: "absolute",
    top: 10,
    left: 10,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "flex-start",
    justifyContent: "center",
    borderColor: Colors.blue,
    borderWidth: 2,
    backgroundColor: `rgba(${Colors.rgbWhite}, .7)`
  },
  routeLegMenuOption: {
    height: 50,
    padding: 20,
    marginTop: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    borderColor: Colors.blue,
    borderWidth: 2,
    backgroundColor: `rgba(${Colors.rgbWhite}, .7)`
  },
  mapTypeControl: {
    position: "absolute",
    bottom: 10,
    right: 10,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    borderColor: Colors.blue,
    borderWidth: 2,
    backgroundColor: `rgba(${Colors.rgbWhite}, .7)`
  },
  mapTypeText: {
    color: Colors.blue,
    fontSize: 20,
    fontFamily: "evo-reg",
    textTransform: "uppercase"
  },
  mapTypeMenu: {
    position: "absolute",
    bottom: 70,
    right: 10,
    alignItems: "flex-end",
    justifyContent: "center"
  },
  mapTypeMenuOption: {
    height: 50,
    paddingHorizontal: 20,
    marginTop: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    borderColor: Colors.blue,
    borderWidth: 2,
    backgroundColor: `rgba(${Colors.rgbWhite}, .7)`
  },
  map: {
    flex: 1
  },
  buttonDisable: {
    backgroundColor: `rgba(${Colors.rgbBlue}, .2)`
  }
});

export default MapCreateRouteScreen;
