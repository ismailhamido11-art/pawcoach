import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabBarIcon({
  name,
  color,
  focused,
}: {
  name: IoniconsName;
  color: string;
  focused: boolean;
}) {
  return <Ionicons name={name} size={24} color={color} />;
}

const TAB_CONFIG: {
  name: string;
  title: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
  label: string;
}[] = [
  { name: 'index',      title: 'Accueil',    icon: 'home-outline',         iconFocused: 'home',         label: 'Accueil' },
  { name: 'sante',      title: 'Santé',      icon: 'heart-outline',        iconFocused: 'heart',        label: 'Santé' },
  { name: 'activite',   title: 'Activité',   icon: 'bicycle-outline',      iconFocused: 'bicycle',      label: 'Activité' },
  { name: 'nutrition',  title: 'Nutrition',  icon: 'leaf-outline',         iconFocused: 'leaf',         label: 'Nutrition' },
  { name: 'profil',     title: 'Profil',     icon: 'person-outline',       iconFocused: 'person',       label: 'Profil' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2D5A3D',   // forest-500
        tabBarInactiveTintColor: '#C4A882', // earth-300
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E4D0BB',        // earth-200
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      {TAB_CONFIG.map(({ name, title, icon, iconFocused, label }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarLabel: label,
            tabBarAccessibilityLabel: label,
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? iconFocused : icon}
                color={color}
                focused={focused}
              />
            ),
          }}
          listeners={{
            tabPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
          }}
        />
      ))}
    </Tabs>
  );
}
