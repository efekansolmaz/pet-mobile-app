import Constants from 'expo-constants';
import { Platform } from 'react-native';

function defaultHost(): string {
  const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.linkingUri;
  const hostname = debuggerHost?.replace(/^[a-z]+:\/\//, '').split(':')[0];
  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:8000`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? defaultHost();
export const API_PREFIX = `${API_URL}/api/v1`;
