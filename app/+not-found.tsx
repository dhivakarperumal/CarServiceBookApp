import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Ionicons name="construct-outline" size={80} color="#0EA5E9" style={{ marginBottom: 20 }} />
        <Text style={styles.title}>Something's Wrong</Text>
        <Text style={styles.subtitle}>This page doesn't exist or is still under construction.</Text>

        <Link href="/" asChild>
          <TouchableOpacity activeOpacity={0.8}>
            <LinearGradient
              colors={['#0EA5E9', '#0284c7']}
              style={styles.link}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.linkText}>Go back Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  link: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 50,
  },
  linkText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});
