import { Platform } from "react-native";
import { normalizeApiUrl } from "./normalize-api-url";

export { normalizeApiUrl } from "./normalize-api-url";

export const API_URL = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL, Platform.OS);
