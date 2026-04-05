import { View, ActivityIndicator } from 'react-native';

export default function IndexScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-cream">
      <ActivityIndicator size="large" color="#2D5A3D" />
    </View>
  );
}
